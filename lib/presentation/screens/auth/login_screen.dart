import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/router/app_router.dart';
import '../../providers/auth_provider.dart';
import '../../providers/config_provider.dart';

/// Login screen - EXACT replica of React Native LoginScreen.js
/// Key styles from RN:
/// - Gradient background: gradient1 (#002651) to gradient2 (#0056B7)
/// - Decorative circles with opacity 0.03 and 0.08
/// - Green accent colors: #64C73B (icons), #85F500 (links), #29A400 (button)
/// - White input containers with borderRadius 8
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
  bool _obscurePassword = true;

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

  Future<void> _handleAppleLogin() async {
    setState(() {
      _showError = false;
      _isLoading = true;
    });

    // TODO: Implement Apple Sign In
    setState(() => _isLoading = false);
  }

  @override
  Widget build(BuildContext context) {
    final config = ref.watch(appConfigProvider);
    final screenWidth = MediaQuery.of(context).size.width;
    final screenHeight = MediaQuery.of(context).size.height;

    // RN gradient colors
    const gradient1 = Color(0xFF002651);
    const gradient2 = Color(0xFF0056B7);

    // RN accent colors
    const iconColor = Color(0xFF64C73B);
    const linkColor = Color(0xFF85F500);
    const buttonColor = Color(0xFF29A400);
    const subtitleColor = Color(0xFFBDCFFF);
    const errorColor = Color(0xFFFF6B6B);

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
                    child: Form(
                      key: _formKey,
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
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

                          // ========== TITLE WITH UNDERLINE ==========
                          // RN: left-aligned, fontSize: 14, fontFamily: 'Poppins-SemiBold'
                          Align(
                            alignment: Alignment.centerLeft,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Your ${config.appName.split(' by ').first} Universe Awaits',
                                  style: const TextStyle(
                                    fontSize: 14,
                                    color: Colors.white,
                                    fontFamily: 'Poppins',
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                // RN: underline - height: 2, backgroundColor: '#0D47A1'
                                Container(
                                  height: 2,
                                  width: double.infinity,
                                  color: const Color(0xFF0D47A1),
                                ),
                              ],
                            ),
                          ),

                          // ========== SUBTITLE ==========
                          // RN: fontSize: 12, color: '#BDCFFF', textAlign: 'left', marginBottom: 35
                          const Align(
                            alignment: Alignment.centerLeft,
                            child: Text(
                              'Its only takes a minute to create your account',
                              style: TextStyle(
                                fontSize: 12,
                                color: subtitleColor,
                                fontFamily: 'Poppins',
                              ),
                            ),
                          ),
                          const SizedBox(height: 35),

                          // ========== ERROR MESSAGE ==========
                          // RN: color: '#FF6B6B'
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

                          // ========== EMAIL INPUT ==========
                          // RN: backgroundColor: '#FFFFFF', borderRadius: 8, height: 40
                          Container(
                            height: 40,
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Row(
                              children: [
                                // RN: icon color: 'rgba(100, 199, 59, 1)', size: 16
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
                          // RN: backgroundColor: '#FFFFFF', borderRadius: 8, height: 40
                          Container(
                            height: 40,
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Row(
                              children: [
                                // RN: icon color: 'rgba(100, 199, 59, 1)', size: 16
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
                                // Eye icon for password visibility
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
                          const SizedBox(height: 12),

                          // ========== FORGOT PASSWORD ==========
                          // RN: color: 'rgba(133, 245, 0, 1)', fontSize: 12
                          Align(
                            alignment: Alignment.centerRight,
                            child: GestureDetector(
                              onTap: () {
                                // TODO: Navigate to ResetPassword
                              },
                              child: const Text(
                                'Forgot Password?',
                                style: TextStyle(
                                  color: linkColor,
                                  fontSize: 12,
                                  fontFamily: 'Poppins',
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 25),

                          // ========== LOGIN BUTTON ==========
                          // RN: backgroundColor: 'rgba(41, 164, 0, 1)', height: 45, borderRadius: 3
                          SizedBox(
                            width: double.infinity,
                            height: 45,
                            child: ElevatedButton(
                              onPressed: _isLoading ? null : _handleEmailSignIn,
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
                                      'Log In',
                                      style: TextStyle(
                                        color: Colors.white,
                                        fontSize: 14,
                                        fontFamily: 'Poppins',
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                            ),
                          ),
                          const SizedBox(height: 25),

                          // ========== OR DIVIDER ==========
                          // RN: color: '#BDCFFF'
                          Row(
                            children: [
                              Expanded(
                                child: Container(
                                  height: 1,
                                  color: subtitleColor.withOpacity(0.3),
                                ),
                              ),
                              const Padding(
                                padding: EdgeInsets.symmetric(horizontal: 15),
                                child: Text(
                                  'OR',
                                  style: TextStyle(
                                    color: subtitleColor,
                                    fontSize: 14,
                                    fontFamily: 'Poppins',
                                  ),
                                ),
                              ),
                              Expanded(
                                child: Container(
                                  height: 1,
                                  color: subtitleColor.withOpacity(0.3),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 25),

                          // ========== GOOGLE BUTTON ==========
                          // RN: backgroundColor: '#FFFFFF', height: 45, borderRadius: 3
                          SizedBox(
                            width: double.infinity,
                            height: 45,
                            child: ElevatedButton(
                              onPressed: _isLoading ? null : _handleGoogleLogin,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.white,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(3),
                                ),
                                elevation: 0,
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  // Google logo - RN: width: 22, height: 22
                                  Image.asset(
                                    'assets/logos/GLogo.png',
                                    width: 22,
                                    height: 22,
                                    errorBuilder: (_, __, ___) => Container(
                                      width: 22,
                                      height: 22,
                                      decoration: const BoxDecoration(
                                        shape: BoxShape.circle,
                                      ),
                                      child: const Center(
                                        child: Text(
                                          'G',
                                          style: TextStyle(
                                            color: Colors.red,
                                            fontWeight: FontWeight.bold,
                                            fontSize: 14,
                                          ),
                                        ),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 15),
                                  const Text(
                                    'Continue With Google',
                                    style: TextStyle(
                                      color: Color(0xFF333333),
                                      fontSize: 14,
                                      fontFamily: 'Poppins',
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),

                          // ========== APPLE BUTTON (iOS only) ==========
                          // RN: backgroundColor: '#000000', height: 45, marginTop: 12
                          if (Platform.isIOS) ...[
                            const SizedBox(height: 12),
                            SizedBox(
                              width: double.infinity,
                              height: 45,
                              child: ElevatedButton(
                                onPressed: _isLoading ? null : _handleAppleLogin,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.black,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(3),
                                  ),
                                  elevation: 0,
                                ),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: const [
                                    Icon(
                                      Icons.apple,
                                      color: Colors.white,
                                      size: 20,
                                    ),
                                    SizedBox(width: 10),
                                    Text(
                                      'Continue with Apple',
                                      style: TextStyle(
                                        color: Colors.white,
                                        fontSize: 14,
                                        fontFamily: 'Poppins',
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                          const SizedBox(height: 30),

                          // ========== SIGNUP LINK ==========
                          // RN: color: '#85F500', fontSize: 14
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Text(
                                "Don't have an account? ",
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 14,
                                  fontFamily: 'Poppins',
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              GestureDetector(
                                onTap: () => context.push(AppRoutes.signup),
                                child: const Text(
                                  'Sign Up',
                                  style: TextStyle(
                                    color: linkColor,
                                    fontSize: 14,
                                    fontWeight: FontWeight.w500,
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
              ),
            ],
          ),
        ),
      ),
    );
  }
}
