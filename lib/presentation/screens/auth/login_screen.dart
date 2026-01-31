import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/router/app_router.dart';
import '../../../core/utils/validators.dart';
import '../../providers/auth_provider.dart';
import '../../providers/config_provider.dart';

/// Login screen - EXACT replica of React Native LoginScreen.js
/// Key styles from RN:
/// - container: backgroundColor '#fff', padding 50
/// - button: backgroundColor '#000', borderRadius 5
/// - input: height 40, borderColor '#ccc', borderRadius 5
class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;
  String? _errorMessage;
  bool _showError = false;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _dismissError() {
    setState(() => _showError = false);
    FocusScope.of(context).unfocus();
  }

  Future<void> _handleEmailSignIn() async {
    setState(() {
      _isLoading = true;
      _showError = false;
    });

    if (_emailController.text.isEmpty || _passwordController.text.isEmpty) {
      setState(() {
        _errorMessage = 'Email and password are required';
        _showError = true;
        _isLoading = false;
      });
      return;
    }

    final success = await ref.read(authProvider.notifier).loginWithEmail(
          _emailController.text.trim().toLowerCase(),
          _passwordController.text,
        );

    setState(() => _isLoading = false);

    if (success && mounted) {
      context.go(AppRoutes.home);
    } else {
      setState(() {
        _errorMessage = ref.read(authProvider).error ?? 'Login failed';
        _showError = true;
      });
    }
  }

  Future<void> _handleGoogleLogin() async {
    setState(() {
      _showError = false;
      _isLoading = true;
    });

    final success = await ref.read(authProvider.notifier).signInWithGoogle();

    setState(() => _isLoading = false);

    if (success && mounted) {
      context.go(AppRoutes.home);
    } else {
      setState(() {
        _errorMessage = ref.read(authProvider).error ?? 'Google sign in failed';
        _showError = true;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final config = ref.watch(appConfigProvider);
    final screenWidth = MediaQuery.of(context).size.width;

    return GestureDetector(
      onTap: _dismissError,
      child: Scaffold(
        // RN: backgroundColor: '#fff'
        backgroundColor: Colors.white,
        body: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              // RN: padding: 50
              padding: const EdgeInsets.all(50),
              child: Form(
                key: _formKey,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    // ========== LOGO SECTION ==========
                    // RN LogoSection: containerLogo with centered content
                    Container(
                      padding: const EdgeInsets.symmetric(vertical: 20),
                      child: Column(
                        children: [
                          // Logo image - RN: width: 65% of screen, height: 80, marginBottom: 20
                          config.logoPath.isNotEmpty
                              ? Image.asset(
                                  config.logoPath,
                                  width: screenWidth * 0.65,
                                  height: 80,
                                  fit: BoxFit.contain,
                                  errorBuilder: (_, __, ___) => _buildFallbackLogo(config, screenWidth),
                                )
                              : _buildFallbackLogo(config, screenWidth),
                          const SizedBox(height: 20),

                          // Subtitle - RN: fontSize: 18, color: '#000101', marginBottom: 20
                          Text(
                            'Invest with ${config.appName}',
                            style: const TextStyle(
                              fontSize: 18,
                              color: Color(0xFF000101),
                              fontFamily: 'Poppins',
                            ),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 20),

                          // Help text - RN: fontSize: 13, color: '#9ca2ae', marginBottom: 20
                          Text(
                            'Please Login To Start Trading with ${config.appName}',
                            style: const TextStyle(
                              fontSize: 13,
                              color: Color(0xFF9CA2AE),
                              fontFamily: 'Poppins',
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                    ),

                    // ========== GOOGLE BUTTON (FIRST) ==========
                    // RN: backgroundColor: '#000', borderRadius: 5, marginBottom: 20
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: _isLoading ? null : _handleGoogleLogin,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.black,
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(5),
                          ),
                          elevation: 0,
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            // Google logo - RN: width: 25, height: 25
                            Image.asset(
                              'assets/images/google_logo.png',
                              width: 25,
                              height: 25,
                              errorBuilder: (_, __, ___) => Container(
                                width: 25,
                                height: 25,
                                decoration: const BoxDecoration(
                                  color: Colors.white,
                                  shape: BoxShape.circle,
                                ),
                                child: const Center(
                                  child: Text(
                                    'G',
                                    style: TextStyle(
                                      color: Colors.red,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 16,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 10),
                            // RN: color: '#fff', fontSize: 16
                            const Text(
                              'Sign In with Google',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 16,
                                fontFamily: 'Poppins',
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),

                    // ========== OR TEXT ==========
                    // RN: color: '#9ca2ae', marginVertical: 10
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 10),
                      child: Text(
                        'or',
                        style: TextStyle(
                          color: Color(0xFF9CA2AE),
                          fontSize: 14,
                          fontFamily: 'Poppins',
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ),

                    // ========== LOADING INDICATOR ==========
                    if (_isLoading)
                      const Padding(
                        padding: EdgeInsets.only(bottom: 10),
                        child: CircularProgressIndicator(
                          color: Colors.black,
                        ),
                      ),

                    // ========== ERROR MESSAGE ==========
                    // RN: color: 'red', textAlign: 'center', marginBottom: 10
                    if (_showError && _errorMessage != null)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: Text(
                          _errorMessage!,
                          style: const TextStyle(
                            color: Colors.red,
                            fontSize: 14,
                            fontFamily: 'Poppins',
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ),

                    // ========== EMAIL INPUT ==========
                    // RN: height: 40, borderColor: '#ccc', borderWidth: 1, borderRadius: 5, marginBottom: 15
                    Container(
                      height: 40,
                      margin: const EdgeInsets.only(bottom: 15),
                      child: TextFormField(
                        controller: _emailController,
                        keyboardType: TextInputType.emailAddress,
                        style: const TextStyle(
                          color: Color(0xFF000101),
                          fontSize: 14,
                          fontFamily: 'Poppins',
                        ),
                        decoration: InputDecoration(
                          hintText: 'Enter your email',
                          hintStyle: const TextStyle(
                            color: Color(0xFF656564),
                            fontSize: 14,
                            fontFamily: 'Poppins',
                          ),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 10),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(5),
                            borderSide: const BorderSide(
                              color: Color(0xFFCCCCCC),
                              width: 1,
                            ),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(5),
                            borderSide: const BorderSide(
                              color: Color(0xFFCCCCCC),
                              width: 1,
                            ),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(5),
                            borderSide: const BorderSide(
                              color: Color(0xFFCCCCCC),
                              width: 1,
                            ),
                          ),
                        ),
                      ),
                    ),

                    // ========== PASSWORD INPUT ==========
                    // RN: height: 40, borderColor: '#ccc', borderWidth: 1, borderRadius: 5, marginBottom: 15
                    Container(
                      height: 40,
                      margin: const EdgeInsets.only(bottom: 15),
                      child: TextFormField(
                        controller: _passwordController,
                        obscureText: true,
                        style: const TextStyle(
                          color: Color(0xFF000101),
                          fontSize: 14,
                          fontFamily: 'Poppins',
                        ),
                        decoration: InputDecoration(
                          hintText: 'Enter your password',
                          hintStyle: const TextStyle(
                            color: Color(0xFF656564),
                            fontSize: 14,
                            fontFamily: 'Poppins',
                          ),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 10),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(5),
                            borderSide: const BorderSide(
                              color: Color(0xFFCCCCCC),
                              width: 1,
                            ),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(5),
                            borderSide: const BorderSide(
                              color: Color(0xFFCCCCCC),
                              width: 1,
                            ),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(5),
                            borderSide: const BorderSide(
                              color: Color(0xFFCCCCCC),
                              width: 1,
                            ),
                          ),
                        ),
                      ),
                    ),

                    // ========== FORGOT PASSWORD ==========
                    // RN: color: '#656564', textAlign: 'center', marginBottom: 20
                    Padding(
                      padding: const EdgeInsets.only(bottom: 20),
                      child: GestureDetector(
                        onTap: () {
                          // TODO: Navigate to ResetPassword
                        },
                        child: const Text(
                          'Forgot your password?',
                          style: TextStyle(
                            color: Color(0xFF656564),
                            fontSize: 14,
                            fontFamily: 'Poppins',
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ),
                    ),

                    // ========== SIGN IN WITH EMAIL BUTTON ==========
                    // RN: backgroundColor: '#000', borderRadius: 5, marginBottom: 20
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: _isLoading ? null : _handleEmailSignIn,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.black,
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(5),
                          ),
                          elevation: 0,
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: const [
                            // Mail icon - RN: AntDesign mail icon
                            Icon(
                              Icons.mail_outline,
                              color: Colors.white,
                              size: 20,
                            ),
                            SizedBox(width: 10),
                            // RN: color: '#fff', fontSize: 16
                            Text(
                              'Sign In with Email',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 16,
                                fontFamily: 'Poppins',
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),

                    // ========== SIGNUP LINK ==========
                    // RN: flexDirection: 'row', justifyContent: 'center'
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        // RN: color: '#656564', marginTop: 20
                        const Text(
                          'No account?',
                          style: TextStyle(
                            color: Color(0xFF656564),
                            fontSize: 14,
                            fontFamily: 'Poppins',
                          ),
                        ),
                        // RN: color: '#010100', fontWeight: 'bold', textDecorationLine: 'underline'
                        GestureDetector(
                          onTap: () => context.push(AppRoutes.signup),
                          child: const Text(
                            ' Signup with email',
                            style: TextStyle(
                              color: Color(0xFF010100),
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              fontFamily: 'Poppins',
                              decoration: TextDecoration.underline,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildFallbackLogo(dynamic config, double screenWidth) {
    return Container(
      width: screenWidth * 0.65,
      height: 80,
      alignment: Alignment.center,
      child: Text(
        config.appName,
        style: const TextStyle(
          fontSize: 28,
          fontWeight: FontWeight.bold,
          color: Color(0xFF000101),
          fontFamily: 'Poppins',
        ),
      ),
    );
  }
}
