import 'dart:convert';
import 'package:crypto/crypto.dart';
import '../config/env_config.dart';

/// Security token manager for API authentication
/// Generates JWT tokens matching the RN implementation
class SecurityTokenManager {
  /// Get current time in IST (UTC+5:30)
  static DateTime _nowTimeIST() {
    final now = DateTime.now().toUtc();
    // IST offset is UTC+5:30
    return now.add(const Duration(hours: 5, minutes: 30));
  }

  /// Generate JWT token for API requests
  /// Matches RN: jwt-encode with {apiKey, exp, iat} payload
  static String? generateToken() {
    try {
      final apiKey = EnvConfig.aqKeys;
      final secretKey = EnvConfig.aqSecret;

      if (apiKey.isEmpty || secretKey.isEmpty) {
        return null;
      }

      final now = _nowTimeIST();
      final iat = now.millisecondsSinceEpoch ~/ 1000;
      final exp = (now.millisecondsSinceEpoch + 15000) ~/ 1000; // 15 seconds expiry

      // Create JWT payload
      final payload = {
        'apiKey': apiKey,
        'exp': exp,
        'iat': iat,
      };

      return _encodeJwt(payload, secretKey);
    } catch (e) {
      print('Error generating token: $e');
      return null;
    }
  }

  /// Encode JWT token with HS256 algorithm
  static String _encodeJwt(Map<String, dynamic> payload, String secret) {
    // JWT Header
    final header = {'alg': 'HS256', 'typ': 'JWT'};

    // Encode header and payload
    final headerEncoded = _base64UrlEncode(jsonEncode(header));
    final payloadEncoded = _base64UrlEncode(jsonEncode(payload));

    // Create signature
    final signatureInput = '$headerEncoded.$payloadEncoded';
    final key = utf8.encode(secret);
    final bytes = utf8.encode(signatureInput);
    final hmac = Hmac(sha256, key);
    final digest = hmac.convert(bytes);
    final signature = _base64UrlEncodeBytes(digest.bytes);

    return '$headerEncoded.$payloadEncoded.$signature';
  }

  /// Base64 URL encode a string
  static String _base64UrlEncode(String input) {
    return _base64UrlEncodeBytes(utf8.encode(input));
  }

  /// Base64 URL encode bytes
  static String _base64UrlEncodeBytes(List<int> bytes) {
    return base64Url.encode(bytes).replaceAll('=', '');
  }

  /// Validate a security token
  static bool validateToken(String token) {
    try {
      final parts = token.split('.');
      if (parts.length != 3) return false;

      // Decode payload
      final payloadJson = utf8.decode(
        base64Url.decode(base64Url.normalize(parts[1])),
      );
      final payload = jsonDecode(payloadJson) as Map<String, dynamic>;

      // Check expiration
      final exp = payload['exp'] as int?;
      if (exp == null) return false;

      final nowSeconds = _nowTimeIST().millisecondsSinceEpoch ~/ 1000;
      if (exp <= nowSeconds) return false;

      return true;
    } catch (e) {
      return false;
    }
  }
}
