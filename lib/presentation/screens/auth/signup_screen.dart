import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/router/app_router.dart';
import '../../providers/auth_provider.dart';
import '../../providers/config_provider.dart';

/// Signup screen - EXACT replica of React Native SignupScreen.js
/// Key styles from RN:
/// - container: backgroundColor '#fff', padding 50
/// - button: backgroundColor '#000', borderRadius 5
/// - input: height 40, borderColor '#ccc', borderRadius 5
class SignupScreen extends ConsumerStatefulWidget {
  const SignupScreen({super.key});

  @override
  ConsumerState<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends ConsumerState<SignupScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;
  String? _errorMessage;
  String? _successMessage;
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

    final success = await ref.read(authProvider.notifier).signupWithEmail(
          email: _emailController.text.trim().toLowerCase(),
          password: _passwordController.text,
          name: '', // Name is optional in RN version
        );

    setState(() => _isLoading = false);

    if (success && mounted) {
      setState(() {
        _successMessage = 'Your account has been successfully created. Please login!';
      });
      await Future.delayed(const Duration(seconds: 2));
      if (mounted) {
        context.go(AppRoutes.home);
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
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // ========== LOGO SECTION ==========
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

                        // Subtitle
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

                        // Help text
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

                  // ========== LOADING INDICATOR ==========
                  // RN: color: '#0000ff'
                  if (_isLoading)
                    const Padding(
                      padding: EdgeInsets.only(bottom: 10),
                      child: CircularProgressIndicator(
                        color: Color(0xFF0000FF),
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

                  // ========== SUCCESS MESSAGE ==========
                  // RN: color: 'green', textAlign: 'center', marginBottom: 10
                  if (_successMessage != null)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: Text(
                        _successMessage!,
                        style: const TextStyle(
                          color: Colors.green,
                          fontSize: 14,
                          fontFamily: 'Poppins',
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ),

                  // ========== BACK BUTTON ==========
                  // RN: marginBottom: 30, arrow-left icon
                  Align(
                    alignment: Alignment.centerLeft,
                    child: Padding(
                      padding: const EdgeInsets.only(bottom: 30),
                      child: GestureDetector(
                        onTap: () => context.pop(),
                        child: const Icon(
                          Icons.arrow_back,
                          size: 20,
                          color: Colors.black,
                        ),
                      ),
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

                  // ========== SIGNUP BUTTON ==========
                  // RN: backgroundColor: '#000', borderRadius: 5, marginBottom: 20
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _isLoading ? null : _handleSignup,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.black,
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(5),
                        ),
                        elevation: 0,
                      ),
                      child: const Text(
                        'Signup with Email',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontFamily: 'Poppins',
                        ),
                      ),
                    ),
                  ),
                ],
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
