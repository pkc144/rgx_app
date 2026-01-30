import 'dart:convert';
import 'package:crypto/crypto.dart';
import '../config/env_config.dart';

/// Security token manager for API authentication
class SecurityTokenManager {
  /// Generate encrypted security token for API requests
  static String? generateToken() {
    try {
      final aqKeys = EnvConfig.aqKeys;
      final aqSecret = EnvConfig.aqSecret;

      if (aqKeys.isEmpty || aqSecret.isEmpty) {
        return null;
      }

      final timestamp = DateTime.now().millisecondsSinceEpoch.toString();
      final data = '$aqKeys:$timestamp';

      // Create HMAC-SHA256 signature
      final key = utf8.encode(aqSecret);
      final bytes = utf8.encode(data);
      final hmac = Hmac(sha256, key);
      final digest = hmac.convert(bytes);

      // Encode as base64
      final token = base64Encode(utf8.encode('$data:${digest.toString()}'));

      return token;
    } catch (e) {
      return null;
    }
  }

  /// Validate a security token
  static bool validateToken(String token) {
    try {
      final decoded = utf8.decode(base64Decode(token));
      final parts = decoded.split(':');

      if (parts.length != 3) return false;

      final timestamp = int.tryParse(parts[1]);
      if (timestamp == null) return false;

      // Token valid for 5 minutes
      final now = DateTime.now().millisecondsSinceEpoch;
      final diff = now - timestamp;
      if (diff > 5 * 60 * 1000) return false;

      return true;
    } catch (e) {
      return false;
    }
  }
}
