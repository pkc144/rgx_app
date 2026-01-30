import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../services/auth/auth_service.dart';
import '../../data/models/user_model.dart';

/// Auth state notifier provider
final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(ref.read(authServiceProvider));
});

/// Current user provider
final currentUserProvider = Provider<UserModel?>((ref) {
  return ref.watch(authProvider).user;
});

/// Auth status provider
final authStatusProvider = Provider<AuthStatus>((ref) {
  return ref.watch(authProvider).status;
});

/// Is authenticated provider
final isAuthenticatedProvider = Provider<bool>((ref) {
  return ref.watch(authStatusProvider) == AuthStatus.authenticated;
});

/// Auth state notifier
class AuthNotifier extends StateNotifier<AuthState> {
  final AuthService _authService;

  AuthNotifier(this._authService) : super(AuthState()) {
    _init();
  }

  void _init() {
    // Listen to Firebase auth state changes
    _authService.authStateChanges.listen((User? user) {
      if (user != null) {
        _loadUserProfile();
      } else {
        state = AuthState(status: AuthStatus.unauthenticated);
      }
    });
  }

  Future<void> _loadUserProfile() async {
    state = state.copyWith(status: AuthStatus.loading);

    final result = await _authService.getUserProfile();
    result.when(
      success: (user) {
        state = AuthState(
          status: AuthStatus.authenticated,
          user: user,
        );
      },
      failure: (error) {
        state = AuthState(
          status: AuthStatus.unauthenticated,
          error: error.message,
        );
      },
    );
  }

  Future<bool> loginWithEmail(String email, String password) async {
    state = state.copyWith(status: AuthStatus.loading, error: null);

    final result = await _authService.loginWithEmail(email, password);
    return result.when(
      success: (user) {
        state = AuthState(
          status: AuthStatus.authenticated,
          user: user,
        );
        return true;
      },
      failure: (error) {
        state = state.copyWith(
          status: AuthStatus.unauthenticated,
          error: error.message,
        );
        return false;
      },
    );
  }

  Future<bool> signupWithEmail({
    required String email,
    required String password,
    required String name,
    String? phone,
  }) async {
    state = state.copyWith(status: AuthStatus.loading, error: null);

    final result = await _authService.signupWithEmail(
      email: email,
      password: password,
      name: name,
      phone: phone,
    );

    return result.when(
      success: (user) {
        state = AuthState(
          status: AuthStatus.authenticated,
          user: user,
        );
        return true;
      },
      failure: (error) {
        state = state.copyWith(
          status: AuthStatus.unauthenticated,
          error: error.message,
        );
        return false;
      },
    );
  }

  Future<bool> signInWithGoogle() async {
    state = state.copyWith(status: AuthStatus.loading, error: null);

    final result = await _authService.signInWithGoogle();
    return result.when(
      success: (user) {
        state = AuthState(
          status: AuthStatus.authenticated,
          user: user,
        );
        return true;
      },
      failure: (error) {
        state = state.copyWith(
          status: AuthStatus.unauthenticated,
          error: error.message,
        );
        return false;
      },
    );
  }

  Future<bool> resetPassword(String email) async {
    final result = await _authService.resetPassword(email);
    return result.isSuccess;
  }

  Future<void> logout() async {
    await _authService.logout();
    state = AuthState(status: AuthStatus.unauthenticated);
  }

  Future<bool> updateProfile(Map<String, dynamic> data) async {
    final result = await _authService.updateProfile(data);
    return result.when(
      success: (user) {
        state = state.copyWith(user: user);
        return true;
      },
      failure: (_) => false,
    );
  }

  void clearError() {
    state = state.copyWith(error: null);
  }
}
