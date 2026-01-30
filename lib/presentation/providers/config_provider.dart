import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/config/app_config.dart';
import '../../core/config/env_config.dart';
import '../../core/theme/app_theme.dart';

/// App config provider
final appConfigProvider = Provider<AppConfig>((ref) {
  final variant = EnvConfig.appVariant;
  return AppConfig.getByVariant(variant);
});

/// App theme provider
final appThemeProvider = Provider<AppTheme>((ref) {
  final config = ref.watch(appConfigProvider);
  return AppTheme(config);
});
