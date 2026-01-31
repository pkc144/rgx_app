import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/router/app_router.dart';
import '../../providers/auth_provider.dart';
import '../../providers/config_provider.dart';

/// Signup screen - EXACT replica of React Native SignupScreen.js
/// Key styles from RN (same as LoginScreen):
/// - Gradient background: gradient1 (#002651) to gradient2 (#0056B7)
/// - Decorative circles with opacity 0.03 and 0.08
/// - Green accent colors: #64C73B (icons), #85F500 (links), #29A400 (button)
/// - White input containers with borderRadius 8
class SignupScreen extends ConsumerStatefulWidget {
  const SignupScreen({super.key});

  @override
  ConsumerState<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends ConsumerState<SignupScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _isLoading = false;
  String? _errorMessage;
  String? _successMessage;
  bool _showError = false;
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  void _dismissError() {
    setState(() => _showError = false);
    FocusScope.of(context).unfocus();
  }

  Future<void> _handleSignup() async {
    setState(() {
      _isLoading = true;
      _showError = false;
      _successMessage = null;
    });

    if (_emailController.text.isEmpty || _passwordController.text.isEmpty) {
      setState(() {
        _errorMessage = 'Both fields are required';
        _showError = true;
        _isLoading = false;
      });
      return;
    }

    if (_passwordController.text != _confirmPasswordController.text) {
      setState(() {
        _errorMessage = 'Passwords do not match';
        _showError = true;
        _isLoading = false;
      });
      return;
    }

    final success = await ref.read(authProvider.notifier).signupWithEmail(
          email: _emailController.text.trim().toLowerCase(),
          password: _passwordController.text,
          name: '',
        );

    setState(() => _isLoading = false);

    if (success && mounted) {
      setState(() {
        _successMessage = 'Your account has been successfully created. Please login!';
      });
      await Future.delayed(const Duration(seconds: 2));
      if (mounted) {
        context.go(AppRoutes.login);
      }
    } else {
      setState(() {
        _errorMessage = ref.read(authProvider).error ?? 'Signup failed';
        _showError = true;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final config = ref.watch(appConfigProvider);

    // RN gradient colors
    const gradient1 = Color(0xFF002651);
    const gradient2 = Color(0xFF0056B7);

    // RN accent colors
    const iconColor = Color(0xFF64C73B);
    const linkColor = Color(0xFF85F500);
    const buttonColor = Color(0xFF29A400);
    const subtitleColor = Color(0xFFBDCFFF);
    const errorColor = Color(0xFFFF6B6B);
    const successColor = Color(0xFF4CAF50);

    return GestureDetector(
      onTap: _dismissError,
      child: Scaffold(
        body: Container(
          width: double.infinity,
          height: double.infinity,
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [gradient1, gradient2],
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
            ),
          ),
          child: Stack(
            children: [
              // ========== DECORATIVE CIRCLES ==========
              // RN: circleOne - width: 350, height: 350, top: -80, right: -80, backgroundColor: 0.08
              Positioned(
                top: -80,
                right: -80,
                child: Container(
                  width: 350,
                  height: 350,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.white.withOpacity(0.08),
                  ),
                ),
              ),
              // RN: circleFour - width: 300, height: 300, top: -80, right: -80, backgroundColor: 0.03
              Positioned(
                top: -80,
                right: -80,
                child: Container(
                  width: 300,
                  height: 300,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.white.withOpacity(0.03),
                  ),
                ),
              ),
              // RN: circleTwo - width: 250, height: 250, bottom: -50, left: -50, backgroundColor: 0.08
              Positioned(
                bottom: -50,
                left: -50,
                child: Container(
                  width: 250,
                  height: 250,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.white.withOpacity(0.08),
                  ),
                ),
              ),
              // RN: circleThree - width: 250, height: 250, bottom: -100, left: -100, backgroundColor: 0.03
              Positioned(
                bottom: -100,
                left: -100,
                child: Container(
                  width: 250,
                  height: 250,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.white.withOpacity(0.03),
                  ),
                ),
              ),

              // ========== MAIN CONTENT ==========
              SafeArea(
                child: Center(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.symmetric(horizontal: 30),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        // ========== BACK BUTTON ==========
                        Align(
                          alignment: Alignment.centerLeft,
                          child: GestureDetector(
                            onTap: () => context.pop(),
                            child: Container(
                              padding: const EdgeInsets.all(8),
                              child: const Icon(
                                Icons.arrow_back,
                                color: Colors.white,
                                size: 24,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 20),

                        // ========== LOGO SECTION ==========
                        // RN: logo 40x40 + logoText fontSize 22, letterSpacing 1.5
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            // Logo image - RN: width: 40, height: 40, marginRight: 8
                            config.logoPath.isNotEmpty
                                ? Image.asset(
                                    config.logoPath,
                                    width: 40,
                                    height: 40,
                                    fit: BoxFit.contain,
                                    errorBuilder: (_, __, ___) => Container(
                                      width: 40,
                                      height: 40,
                                      decoration: BoxDecoration(
                                        color: Colors.white.withOpacity(0.2),
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                    ),
                                  )
                                : Container(
                                    width: 40,
                                    height: 40,
                                    decoration: BoxDecoration(
                                      color: Colors.white.withOpacity(0.2),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                  ),
                            const SizedBox(width: 8),
                            // RN: fontSize: 22, fontWeight: '700', letterSpacing: 1.5, color: '#fff'
                            Text(
                              config.appName.split(' by ').first,
                              style: const TextStyle(
                                fontSize: 22,
                                fontWeight: FontWeight.w700,
                                letterSpacing: 1.5,
                                color: Colors.white,
                                fontFamily: 'Poppins',
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 40),

                        // ========== TITLE ==========
                        const Text(
                          'Create Account',
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.white,
                            fontFamily: 'Poppins',
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(height: 8),

                        // ========== SUBTITLE ==========
                        const Text(
                          'Please fill in the details to sign up',
                          style: TextStyle(
                            fontSize: 12,
                            color: subtitleColor,
                            fontFamily: 'Poppins',
                          ),
                        ),
                        const SizedBox(height: 30),

                        // ========== ERROR MESSAGE ==========
                        if (_showError && _errorMessage != null)
                          Padding(
                            padding: const EdgeInsets.only(bottom: 15),
                            child: Text(
                              _errorMessage!,
                              style: const TextStyle(
                                color: errorColor,
                                fontSize: 13,
                                fontFamily: 'Poppins',
                              ),
                              textAlign: TextAlign.center,
                            ),
                          ),

                        // ========== SUCCESS MESSAGE ==========
                        if (_successMessage != null)
                          Padding(
                            padding: const EdgeInsets.only(bottom: 15),
                            child: Text(
                              _successMessage!,
                              style: const TextStyle(
                                color: successColor,
                                fontSize: 13,
                                fontFamily: 'Poppins',
                              ),
                              textAlign: TextAlign.center,
                            ),
                          ),

                        // ========== EMAIL INPUT ==========
                        Container(
                          height: 45,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Row(
                            children: [
                              const Padding(
                                padding: EdgeInsets.symmetric(horizontal: 15),
                                child: Icon(
                                  Icons.mail_outline,
                                  color: iconColor,
                                  size: 16,
                                ),
                              ),
                              Expanded(
                                child: TextField(
                                  controller: _emailController,
                                  keyboardType: TextInputType.emailAddress,
                                  style: const TextStyle(
                                    color: Colors.black,
                                    fontSize: 14,
                                    fontFamily: 'Poppins',
                                  ),
                                  decoration: const InputDecoration(
                                    hintText: 'Email',
                                    hintStyle: TextStyle(
                                      color: Color(0xFF999999),
                                      fontSize: 14,
                                      fontFamily: 'Poppins',
                                    ),
                                    border: InputBorder.none,
                                    contentPadding: EdgeInsets.zero,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 15),

                        // ========== PASSWORD INPUT ==========
                        Container(
                          height: 45,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Row(
                            children: [
                              const Padding(
                                padding: EdgeInsets.symmetric(horizontal: 15),
                                child: Icon(
                                  Icons.lock_outline,
                                  color: iconColor,
                                  size: 16,
                                ),
                              ),
                              Expanded(
                                child: TextField(
                                  controller: _passwordController,
                                  obscureText: _obscurePassword,
                                  style: const TextStyle(
                                    color: Colors.black,
                                    fontSize: 14,
                                    fontFamily: 'Poppins',
                                  ),
                                  decoration: const InputDecoration(
                                    hintText: 'Password',
                                    hintStyle: TextStyle(
                                      color: Color(0xFF999999),
                                      fontSize: 14,
                                      fontFamily: 'Poppins',
                                    ),
                                    border: InputBorder.none,
                                    contentPadding: EdgeInsets.zero,
                                  ),
                                ),
                              ),
                              GestureDetector(
                                onTap: () {
                                  setState(() {
                                    _obscurePassword = !_obscurePassword;
                                  });
                                },
                                child: Padding(
                                  padding: const EdgeInsets.symmetric(horizontal: 15),
                                  child: Icon(
                                    _obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                                    color: iconColor,
                                    size: 16,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 15),

                        // ========== CONFIRM PASSWORD INPUT ==========
                        Container(
                          height: 45,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Row(
                            children: [
                              const Padding(
                                padding: EdgeInsets.symmetric(horizontal: 15),
                                child: Icon(
                                  Icons.lock_outline,
                                  color: iconColor,
                                  size: 16,
                                ),
                              ),
                              Expanded(
                                child: TextField(
                                  controller: _confirmPasswordController,
                                  obscureText: _obscureConfirmPassword,
                                  style: const TextStyle(
                                    color: Colors.black,
                                    fontSize: 14,
                                    fontFamily: 'Poppins',
                                  ),
                                  decoration: const InputDecoration(
                                    hintText: 'Confirm Password',
                                    hintStyle: TextStyle(
                                      color: Color(0xFF999999),
                                      fontSize: 14,
                                      fontFamily: 'Poppins',
                                    ),
                                    border: InputBorder.none,
                                    contentPadding: EdgeInsets.zero,
                                  ),
                                ),
                              ),
                              GestureDetector(
                                onTap: () {
                                  setState(() {
                                    _obscureConfirmPassword = !_obscureConfirmPassword;
                                  });
                                },
                                child: Padding(
                                  padding: const EdgeInsets.symmetric(horizontal: 15),
                                  child: Icon(
                                    _obscureConfirmPassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                                    color: iconColor,
                                    size: 16,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 25),

                        // ========== SIGNUP BUTTON ==========
                        SizedBox(
                          width: double.infinity,
                          height: 45,
                          child: ElevatedButton(
                            onPressed: _isLoading ? null : _handleSignup,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: buttonColor,
                              disabledBackgroundColor: buttonColor.withOpacity(0.6),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(3),
                              ),
                              elevation: 0,
                            ),
                            child: _isLoading
                                ? const SizedBox(
                                    width: 20,
                                    height: 20,
                                    child: CircularProgressIndicator(
                                      color: Colors.white,
                                      strokeWidth: 2,
                                    ),
                                  )
                                : const Text(
                                    'Sign Up',
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontSize: 16,
                                      fontFamily: 'Poppins',
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                          ),
                        ),
                        const SizedBox(height: 30),

                        // ========== LOGIN LINK ==========
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Text(
                              'Already have an account? ',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 13,
                                fontFamily: 'Poppins',
                              ),
                            ),
                            GestureDetector(
                              onTap: () => context.pop(),
                              child: const Text(
                                'Login',
                                style: TextStyle(
                                  color: linkColor,
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                  fontFamily: 'Poppins',
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 20),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
