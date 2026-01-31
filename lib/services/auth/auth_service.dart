import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_sign_in/google_sign_in.dart';
import '../../core/config/env_config.dart';
import '../../core/network/dio_client.dart';
import '../../core/constants/api_endpoints.dart';
import '../../core/errors/api_exception.dart';
import '../../data/models/user_model.dart';

/// Check if Firebase is available
bool get _isFirebaseAvailable {
  try {
    return Firebase.apps.isNotEmpty;
  } catch (_) {
    return false;
  }
}

/// Auth service provider
final authServiceProvider = Provider<AuthService>((ref) {
  return AuthService(ref.read(dioClientProvider));
});

/// Authentication state
enum AuthStatus {
  initial,
  authenticated,
  unauthenticated,
  loading,
}

/// Auth state model
class AuthState {
  final AuthStatus status;
  final UserModel? user;
  final String? error;

  AuthState({
    this.status = AuthStatus.initial,
    this.user,
    this.error,
  });

  AuthState copyWith({
    AuthStatus? status,
    UserModel? user,
    String? error,
  }) {
    return AuthState(
      status: status ?? this.status,
      user: user ?? this.user,
      error: error,
    );
  }
}

/// Auth service for handling authentication
class AuthService {
  final DioClient _dioClient;
  FirebaseAuth? _firebaseAuth;
  GoogleSignIn? _googleSignIn;

  AuthService(this._dioClient) {
    if (_isFirebaseAvailable) {
      _firebaseAuth = FirebaseAuth.instance;
      _googleSignIn = GoogleSignIn(
        clientId: EnvConfig.googleWebClientId,
      );
    }
  }

  /// Get current Firebase user
  User? get currentUser => _firebaseAuth?.currentUser;

  /// Check if user is logged in
  bool get isLoggedIn => currentUser != null;

  /// Auth state changes stream
  Stream<User?> get authStateChanges =>
      _firebaseAuth?.authStateChanges() ?? Stream.value(null);

  /// Login with email and password
  /// Flow matches RN: Firebase auth -> Get user from backend -> Create if not exists
  Future<Result<UserModel>> loginWithEmail(String email, String password) async {
    try {
      if (_firebaseAuth == null) {
        return Result.failure(ApiException(message: 'Firebase not available'));
      }
      // Step 1: Firebase authentication
      final credential = await _firebaseAuth!.signInWithEmailAndPassword(
        email: email,
        password: password,
      );

      if (credential.user == null) {
        return Result.failure(ApiException(message: 'Login failed'));
      }

      final firebaseUser = credential.user!;

      // Step 2: Try to get user from backend (matching RN behavior)
      try {
        final response = await _dioClient.get(
          ApiEndpoints.getUser(email),
        );

        if (response.data != null && response.data['User'] != null) {
          final user = UserModel.fromJson(response.data['User']);
          return Result.success(user);
        }
      } catch (getUserError) {
        // User doesn't exist in backend, create them
        print('User does not exist in backend, creating...');
      }

      // Step 3: Create user if not found
      try {
        await _dioClient.post(
          ApiEndpoints.createUser,
          data: {
            'email': firebaseUser.email,
            'name': firebaseUser.displayName ?? 'New User',
            'firebaseId': firebaseUser.uid,
          },
        );

        // Return minimal user data
        final user = UserModel(
          email: firebaseUser.email ?? email,
          name: firebaseUser.displayName ?? 'New User',
          firebaseId: firebaseUser.uid,
        );
        return Result.success(user);
      } catch (createError) {
        // Even if create fails, return basic user data so app can proceed
        final user = UserModel(
          email: firebaseUser.email ?? email,
          name: firebaseUser.displayName ?? 'New User',
          firebaseId: firebaseUser.uid,
        );
        return Result.success(user);
      }
    } on FirebaseAuthException catch (e) {
      return Result.failure(ApiException(message: _getFirebaseErrorMessage(e.code)));
    } catch (e) {
      if (e is ApiException) return Result.failure(e);
      return Result.failure(ApiException(message: e.toString()));
    }
  }

  /// Signup with email and password
  /// Flow matches RN: Firebase create user -> Create in backend
  Future<Result<UserModel>> signupWithEmail({
    required String email,
    required String password,
    required String name,
    String? phone,
  }) async {
    try {
      if (_firebaseAuth == null) {
        return Result.failure(ApiException(message: 'Firebase not available'));
      }
      // Step 1: Create Firebase user
      final credential = await _firebaseAuth!.createUserWithEmailAndPassword(
        email: email,
        password: password,
      );

      if (credential.user == null) {
        return Result.failure(ApiException(message: 'Signup failed'));
      }

      final firebaseUser = credential.user!;

      // Update display name if provided
      if (name.isNotEmpty) {
        await firebaseUser.updateDisplayName(name);
      }

      // Step 2: Create user in backend (matching RN api/user/ endpoint)
      try {
        await _dioClient.post(
          ApiEndpoints.createUser,
          data: {
            'email': firebaseUser.email,
            'name': name.isNotEmpty ? name : 'New User',
            'firebaseId': firebaseUser.uid,
          },
        );
      } catch (e) {
        // Ignore backend error - user is created in Firebase
        print('Backend user creation error (ignoring): $e');
      }

      final user = UserModel(
        email: firebaseUser.email ?? email,
        name: name.isNotEmpty ? name : 'New User',
        firebaseId: firebaseUser.uid,
      );
      return Result.success(user);
    } on FirebaseAuthException catch (e) {
      return Result.failure(ApiException(message: _getFirebaseErrorMessage(e.code)));
    } catch (e) {
      if (e is ApiException) return Result.failure(e);
      return Result.failure(ApiException(message: e.toString()));
    }
  }

  /// Sign in with Google
  /// Flow matches RN: Google sign-in -> Firebase auth -> Create/Get user from backend
  Future<Result<UserModel>> signInWithGoogle() async {
    try {
      if (_firebaseAuth == null || _googleSignIn == null) {
        return Result.failure(ApiException(message: 'Firebase not available'));
      }
      final googleUser = await _googleSignIn!.signIn();
      if (googleUser == null) {
        return Result.failure(ApiException(message: 'Google sign-in cancelled'));
      }

      final googleAuth = await googleUser.authentication;
      final credential = GoogleAuthProvider.credential(
        accessToken: googleAuth.accessToken,
        idToken: googleAuth.idToken,
      );

      final userCredential = await _firebaseAuth!.signInWithCredential(credential);
      if (userCredential.user == null) {
        return Result.failure(ApiException(message: 'Google sign-in failed'));
      }

      final firebaseUser = userCredential.user!;

      // Step 1: Create/update user in backend (matching RN api/user/ POST)
      try {
        await _dioClient.post(
          ApiEndpoints.createUser,
          data: {
            'email': firebaseUser.email,
            'name': firebaseUser.displayName,
            'imageUrl': firebaseUser.photoURL,
          },
        );
      } catch (e) {
        print('Backend user create/update error (ignoring): $e');
      }

      // Step 2: Get user details from backend
      try {
        final response = await _dioClient.get(
          ApiEndpoints.getUser(firebaseUser.email ?? googleUser.email),
        );

        if (response.data != null && response.data['User'] != null) {
          final user = UserModel.fromJson(response.data['User']);
          return Result.success(user);
        }
      } catch (e) {
        print('Backend getUser error (using Firebase data): $e');
      }

      // Fallback to Firebase user data
      final user = UserModel(
        email: firebaseUser.email ?? googleUser.email,
        name: firebaseUser.displayName ?? googleUser.displayName ?? 'User',
        firebaseId: firebaseUser.uid,
        imageUrl: firebaseUser.photoURL,
      );
      return Result.success(user);
    } on FirebaseAuthException catch (e) {
      return Result.failure(ApiException(message: _getFirebaseErrorMessage(e.code)));
    } catch (e) {
      if (e is ApiException) return Result.failure(e);
      return Result.failure(ApiException(message: e.toString()));
    }
  }

  /// Reset password
  Future<Result<void>> resetPassword(String email) async {
    try {
      if (_firebaseAuth == null) {
        return Result.failure(ApiException(message: 'Firebase not available'));
      }
      await _firebaseAuth!.sendPasswordResetEmail(email: email);
      return Result.success(null);
    } on FirebaseAuthException catch (e) {
      return Result.failure(ApiException(message: _getFirebaseErrorMessage(e.code)));
    } catch (e) {
      return Result.failure(ApiException(message: e.toString()));
    }
  }

  /// Logout
  Future<void> logout() async {
    await Future.wait([
      if (_firebaseAuth != null) _firebaseAuth!.signOut(),
      if (_googleSignIn != null) _googleSignIn!.signOut(),
    ]);
  }

  /// Get user profile from backend
  Future<Result<UserModel>> getUserProfile() async {
    try {
      final response = await _dioClient.get(ApiEndpoints.userProfile);
      final user = UserModel.fromJson(response.data['user']);
      return Result.success(user);
    } catch (e) {
      if (e is ApiException) return Result.failure(e);
      return Result.failure(ApiException(message: e.toString()));
    }
  }

  /// Update user profile
  Future<Result<UserModel>> updateProfile(Map<String, dynamic> data) async {
    try {
      final response = await _dioClient.put(
        ApiEndpoints.updateProfile,
        data: data,
      );
      final user = UserModel.fromJson(response.data['user']);
      return Result.success(user);
    } catch (e) {
      if (e is ApiException) return Result.failure(e);
      return Result.failure(ApiException(message: e.toString()));
    }
  }

  String _getFirebaseErrorMessage(String code) {
    switch (code) {
      case 'user-not-found':
        return 'No user found with this email';
      case 'wrong-password':
        return 'Incorrect password';
      case 'email-already-in-use':
        return 'An account already exists with this email';
      case 'invalid-email':
        return 'Invalid email address';
      case 'weak-password':
        return 'Password is too weak';
      case 'user-disabled':
        return 'This account has been disabled';
      case 'too-many-requests':
        return 'Too many attempts. Please try again later';
      case 'network-request-failed':
        return 'Network error. Please check your connection';
      default:
        return 'Authentication failed. Please try again';
    }
  }
}
