import 'package:flutter/material.dart';
import '../config/app_config.dart';

/// App theme configuration
class AppTheme {
  final AppConfig config;

  AppTheme(this.config);

  ThemeData get lightTheme => ThemeData(
    useMaterial3: true,
    brightness: Brightness.light,
    primaryColor: config.primaryColor,
    colorScheme: ColorScheme.light(
      primary: config.primaryColor,
      secondary: config.secondaryColor,
      surface: Colors.white,
      error: const Color(0xFFE53935),
    ),
    scaffoldBackgroundColor: const Color(0xFFF5F5F5),
    fontFamily: 'Satoshi',
    appBarTheme: AppBarTheme(
      backgroundColor: config.primaryColor,
      foregroundColor: Colors.white,
      elevation: 0,
      centerTitle: true,
      titleTextStyle: const TextStyle(
        fontFamily: 'Satoshi',
        fontSize: 18,
        fontWeight: FontWeight.w600,
        color: Colors.white,
      ),
    ),
    cardTheme: CardTheme(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      color: Colors.white,
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: config.primaryColor,
        foregroundColor: Colors.white,
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
        textStyle: const TextStyle(
          fontFamily: 'Satoshi',
          fontSize: 16,
          fontWeight: FontWeight.w600,
        ),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: config.primaryColor,
        side: BorderSide(color: config.primaryColor),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
        textStyle: const TextStyle(
          fontFamily: 'Satoshi',
          fontSize: 16,
          fontWeight: FontWeight.w600,
        ),
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: config.primaryColor,
        textStyle: const TextStyle(
          fontFamily: 'Satoshi',
          fontSize: 14,
          fontWeight: FontWeight.w500,
        ),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.white,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: Color(0xFFE0E0E0)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: Color(0xFFE0E0E0)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: BorderSide(color: config.primaryColor, width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: Color(0xFFE53935)),
      ),
      hintStyle: const TextStyle(
        fontFamily: 'Satoshi',
        color: Color(0xFF9E9E9E),
        fontSize: 14,
      ),
    ),
    bottomNavigationBarTheme: BottomNavigationBarThemeData(
      backgroundColor: Colors.white,
      selectedItemColor: config.primaryColor,
      unselectedItemColor: const Color(0xFF9E9E9E),
      type: BottomNavigationBarType.fixed,
      elevation: 8,
      selectedLabelStyle: const TextStyle(
        fontFamily: 'Satoshi',
        fontSize: 12,
        fontWeight: FontWeight.w600,
      ),
      unselectedLabelStyle: const TextStyle(
        fontFamily: 'Satoshi',
        fontSize: 12,
        fontWeight: FontWeight.w400,
      ),
    ),
    tabBarTheme: TabBarTheme(
      labelColor: config.primaryColor,
      unselectedLabelColor: const Color(0xFF9E9E9E),
      indicatorColor: config.primaryColor,
      labelStyle: const TextStyle(
        fontFamily: 'Satoshi',
        fontSize: 14,
        fontWeight: FontWeight.w600,
      ),
      unselectedLabelStyle: const TextStyle(
        fontFamily: 'Satoshi',
        fontSize: 14,
        fontWeight: FontWeight.w400,
      ),
    ),
    dividerTheme: const DividerThemeData(
      color: Color(0xFFE0E0E0),
      thickness: 1,
    ),
    chipTheme: ChipThemeData(
      backgroundColor: const Color(0xFFF5F5F5),
      selectedColor: config.primaryColor.withValues(alpha: 0.1),
      labelStyle: const TextStyle(
        fontFamily: 'Satoshi',
        fontSize: 12,
        fontWeight: FontWeight.w500,
      ),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
      ),
    ),
    textTheme: const TextTheme(
      displayLarge: TextStyle(
        fontFamily: 'Satoshi',
        fontSize: 32,
        fontWeight: FontWeight.bold,
        color: Color(0xFF212121),
      ),
      displayMedium: TextStyle(
        fontFamily: 'Satoshi',
        fontSize: 28,
        fontWeight: FontWeight.bold,
        color: Color(0xFF212121),
      ),
      displaySmall: TextStyle(
        fontFamily: 'Satoshi',
        fontSize: 24,
        fontWeight: FontWeight.bold,
        color: Color(0xFF212121),
      ),
      headlineLarge: TextStyle(
        fontFamily: 'Satoshi',
        fontSize: 22,
        fontWeight: FontWeight.w600,
        color: Color(0xFF212121),
      ),
      headlineMedium: TextStyle(
        fontFamily: 'Satoshi',
        fontSize: 20,
        fontWeight: FontWeight.w600,
        color: Color(0xFF212121),
      ),
      headlineSmall: TextStyle(
        fontFamily: 'Satoshi',
        fontSize: 18,
        fontWeight: FontWeight.w600,
        color: Color(0xFF212121),
      ),
      titleLarge: TextStyle(
        fontFamily: 'Satoshi',
        fontSize: 16,
        fontWeight: FontWeight.w600,
        color: Color(0xFF212121),
      ),
      titleMedium: TextStyle(
        fontFamily: 'Satoshi',
        fontSize: 14,
        fontWeight: FontWeight.w600,
        color: Color(0xFF212121),
      ),
      titleSmall: TextStyle(
        fontFamily: 'Satoshi',
        fontSize: 12,
        fontWeight: FontWeight.w600,
        color: Color(0xFF212121),
      ),
      bodyLarge: TextStyle(
        fontFamily: 'Satoshi',
        fontSize: 16,
        fontWeight: FontWeight.w400,
        color: Color(0xFF424242),
      ),
      bodyMedium: TextStyle(
        fontFamily: 'Satoshi',
        fontSize: 14,
        fontWeight: FontWeight.w400,
        color: Color(0xFF424242),
      ),
      bodySmall: TextStyle(
        fontFamily: 'Satoshi',
        fontSize: 12,
        fontWeight: FontWeight.w400,
        color: Color(0xFF757575),
      ),
      labelLarge: TextStyle(
        fontFamily: 'Satoshi',
        fontSize: 14,
        fontWeight: FontWeight.w500,
        color: Color(0xFF212121),
      ),
      labelMedium: TextStyle(
        fontFamily: 'Satoshi',
        fontSize: 12,
        fontWeight: FontWeight.w500,
        color: Color(0xFF424242),
      ),
      labelSmall: TextStyle(
        fontFamily: 'Satoshi',
        fontSize: 10,
        fontWeight: FontWeight.w500,
        color: Color(0xFF757575),
      ),
    ),
  );

  ThemeData get darkTheme => lightTheme.copyWith(
    brightness: Brightness.dark,
    scaffoldBackgroundColor: const Color(0xFF121212),
    colorScheme: ColorScheme.dark(
      primary: config.primaryColor,
      secondary: config.secondaryColor,
      surface: const Color(0xFF1E1E1E),
      error: const Color(0xFFCF6679),
    ),
    cardTheme: lightTheme.cardTheme?.copyWith(
      color: const Color(0xFF1E1E1E),
    ),
  );
}

/// Stock-specific colors
class StockColors {
  static const Color profit = Color(0xFF4CAF50);
  static const Color loss = Color(0xFFE53935);
  static const Color neutral = Color(0xFF9E9E9E);
  static const Color buy = Color(0xFF4CAF50);
  static const Color sell = Color(0xFFE53935);
  static const Color hold = Color(0xFFFF9800);

  static Color getPnlColor(double value) {
    if (value > 0) return profit;
    if (value < 0) return loss;
    return neutral;
  }
}
