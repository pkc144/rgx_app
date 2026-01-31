import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/config/app_config.dart';
import '../../providers/config_provider.dart';

/// Splash screen - EXACT replica of React Native SplashScreen.js
/// Key styles from RN:
/// - container: flex 1, backgroundColor '#fff', centered
/// - logo: width 200, height 200, resizeMode contain
/// - progressBar: fillColor '#002a5c', unfilledColor '#E9E9E9', height 7, width 50%
class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _progressController;

  @override
  void initState() {
    super.initState();
    _progressController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2500),
    )..forward();
  }

  @override
  void dispose() {
    _progressController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final config = ref.watch(appConfigProvider);
    final screenWidth = MediaQuery.of(context).size.width;

    // RN colors
    const fillColor = Color(0xFF002A5C);
    const unfilledColor = Color(0xFFE9E9E9);

    return Scaffold(
      // RN: backgroundColor: '#fff'
      backgroundColor: Colors.white,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Spacer(),

            // ========== LOGO SECTION ==========
            // RN: logo width: 200, height: 200, resizeMode: 'contain'
            Container(
              width: 200,
              height: 200,
              alignment: Alignment.center,
              child: config.logoPath.isNotEmpty
                  ? Image.asset(
                      config.logoPath,
                      width: 200,
                      height: 200,
                      fit: BoxFit.contain,
                      errorBuilder: (_, __, ___) => _buildFallbackLogo(config),
                    )
                  : _buildFallbackLogo(config),
            ),

            const Spacer(),

            // ========== PROGRESS BAR SECTION ==========
            // RN: marginBottom: 70, fillColor: '#002a5c', unfilledColor: '#E9E9E9', height: 7, width: 50%
            Padding(
              padding: const EdgeInsets.only(bottom: 70),
              child: AnimatedBuilder(
                animation: _progressController,
                builder: (context, child) {
                  return Container(
                    width: screenWidth * 0.5,
                    height: 7,
                    decoration: BoxDecoration(
                      color: unfilledColor,
                      borderRadius: BorderRadius.circular(3.5),
                      border: Border.all(
                        color: unfilledColor,
                        width: 1,
                      ),
                    ),
                    child: FractionallySizedBox(
                      alignment: Alignment.centerLeft,
                      widthFactor: _progressController.value,
                      child: Container(
                        decoration: BoxDecoration(
                          color: fillColor,
                          borderRadius: BorderRadius.circular(3.5),
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFallbackLogo(AppConfig config) {
    return Center(
      child: Container(
        width: 120,
        height: 120,
        decoration: BoxDecoration(
          color: const Color(0xFF002A5C),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Center(
          child: Text(
            config.appName.isNotEmpty
                ? config.appName.split(' ').first.substring(0, 2).toUpperCase()
                : 'EP',
            style: const TextStyle(
              fontSize: 48,
              fontWeight: FontWeight.bold,
              color: Colors.white,
              fontFamily: 'Poppins',
            ),
          ),
        ),
      ),
    );
  }
}
