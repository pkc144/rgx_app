import 'package:flutter/material.dart';

/// App variant configuration for multi-tenant support
class AppConfig {
  final String appName;
  final String variant;
  final Color primaryColor;
  final Color secondaryColor;
  final Color accentColor;
  final Gradient gradient;
  final String logoPath;
  final String toolbarLogoPath;
  final bool modelPortfolioEnabled;
  final bool bespokePlansEnabled;
  final bool brokerConnectEnabled;
  final String paymentPlatform;

  const AppConfig({
    required this.appName,
    required this.variant,
    required this.primaryColor,
    required this.secondaryColor,
    required this.accentColor,
    required this.gradient,
    required this.logoPath,
    required this.toolbarLogoPath,
    this.modelPortfolioEnabled = true,
    this.bespokePlansEnabled = true,
    this.brokerConnectEnabled = true,
    this.paymentPlatform = 'razorpay',
  });

  /// Default RGX Research configuration
  /// Gradient colors from RN: gradient1 = #002651, gradient2 = #0056B7
  static AppConfig get rgxResearch => AppConfig(
    appName: 'EquityPro by RGXResearch',
    variant: 'rgxresearch',
    primaryColor: const Color(0xFF002651),
    secondaryColor: const Color(0xFF0056B7),
    accentColor: const Color(0xFF29A400),
    gradient: const LinearGradient(
      colors: [Color(0xFF002651), Color(0xFF0056B7)],
      begin: Alignment.topCenter,
      end: Alignment.bottomCenter,
    ),
    logoPath: 'assets/logos/logo.png',
    toolbarLogoPath: 'assets/logos/fadedlogo.png',
  );

  /// ARFS variant configuration
  static AppConfig get arfs => AppConfig(
    appName: 'ARFS',
    variant: 'arfs',
    primaryColor: const Color(0xFFB71C1C),
    secondaryColor: const Color(0xFFD32F2F),
    accentColor: const Color(0xFFFF5722),
    gradient: const LinearGradient(
      colors: [Color(0xFFB71C1C), Color(0xFFD32F2F)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    ),
    logoPath: 'assets/logos/arfs_logo.png',
    toolbarLogoPath: 'assets/logos/arfs_toolbar_logo.png',
  );

  /// Magnus variant configuration
  static AppConfig get magnus => AppConfig(
    appName: 'Magnus',
    variant: 'magnus',
    primaryColor: const Color(0xFF006064),
    secondaryColor: const Color(0xFF00838F),
    accentColor: const Color(0xFF00BCD4),
    gradient: const LinearGradient(
      colors: [Color(0xFF006064), Color(0xFF00838F)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    ),
    logoPath: 'assets/logos/magnus_logo.png',
    toolbarLogoPath: 'assets/logos/magnus_toolbar_logo.png',
  );

  /// Get config by variant name
  static AppConfig getByVariant(String variant) {
    switch (variant.toLowerCase()) {
      case 'arfs':
        return arfs;
      case 'magnus':
        return magnus;
      case 'rgxresearch':
      default:
        return rgxResearch;
    }
  }
}
