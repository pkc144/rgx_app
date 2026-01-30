/// Form validation utilities
class Validators {
  static final RegExp _emailRegex = RegExp(
    r'^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$',
  );

  static final RegExp _phoneRegex = RegExp(r'^[6-9]\d{9}$');
  static final RegExp _panRegex = RegExp(r'^[A-Z]{5}[0-9]{4}[A-Z]$');
  static final RegExp _aadhaarRegex = RegExp(r'^\d{12}$');
  static final RegExp _ifscRegex = RegExp(r'^[A-Z]{4}0[A-Z0-9]{6}$');
  static final RegExp _bankAccountRegex = RegExp(r'^\d{9,18}$');

  /// Validate email address
  static String? validateEmail(String? value) {
    if (value == null || value.isEmpty) {
      return 'Email is required';
    }
    if (!_emailRegex.hasMatch(value)) {
      return 'Please enter a valid email address';
    }
    return null;
  }

  /// Validate phone number (Indian)
  static String? validatePhone(String? value) {
    if (value == null || value.isEmpty) {
      return 'Phone number is required';
    }
    final cleaned = value.replaceAll(RegExp(r'\D'), '');
    if (cleaned.length == 12 && cleaned.startsWith('91')) {
      // +91 prefix
      if (!_phoneRegex.hasMatch(cleaned.substring(2))) {
        return 'Please enter a valid Indian phone number';
      }
    } else if (cleaned.length == 10) {
      if (!_phoneRegex.hasMatch(cleaned)) {
        return 'Please enter a valid Indian phone number';
      }
    } else {
      return 'Phone number must be 10 digits';
    }
    return null;
  }

  /// Validate password
  static String? validatePassword(String? value) {
    if (value == null || value.isEmpty) {
      return 'Password is required';
    }
    if (value.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (!value.contains(RegExp(r'[A-Z]'))) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!value.contains(RegExp(r'[a-z]'))) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!value.contains(RegExp(r'[0-9]'))) {
      return 'Password must contain at least one number';
    }
    return null;
  }

  /// Validate PAN number
  static String? validatePAN(String? value) {
    if (value == null || value.isEmpty) {
      return 'PAN number is required';
    }
    if (!_panRegex.hasMatch(value.toUpperCase())) {
      return 'Please enter a valid PAN number';
    }
    return null;
  }

  /// Validate Aadhaar number
  static String? validateAadhaar(String? value) {
    if (value == null || value.isEmpty) {
      return 'Aadhaar number is required';
    }
    final cleaned = value.replaceAll(RegExp(r'\D'), '');
    if (!_aadhaarRegex.hasMatch(cleaned)) {
      return 'Please enter a valid 12-digit Aadhaar number';
    }
    return null;
  }

  /// Validate IFSC code
  static String? validateIFSC(String? value) {
    if (value == null || value.isEmpty) {
      return 'IFSC code is required';
    }
    if (!_ifscRegex.hasMatch(value.toUpperCase())) {
      return 'Please enter a valid IFSC code';
    }
    return null;
  }

  /// Validate bank account number
  static String? validateBankAccount(String? value) {
    if (value == null || value.isEmpty) {
      return 'Bank account number is required';
    }
    if (!_bankAccountRegex.hasMatch(value)) {
      return 'Please enter a valid bank account number (9-18 digits)';
    }
    return null;
  }

  /// Validate required field
  static String? validateRequired(String? value, [String fieldName = 'This field']) {
    if (value == null || value.trim().isEmpty) {
      return '$fieldName is required';
    }
    return null;
  }

  /// Validate minimum length
  static String? validateMinLength(String? value, int minLength, [String fieldName = 'This field']) {
    if (value == null || value.length < minLength) {
      return '$fieldName must be at least $minLength characters';
    }
    return null;
  }

  /// Validate maximum length
  static String? validateMaxLength(String? value, int maxLength, [String fieldName = 'This field']) {
    if (value != null && value.length > maxLength) {
      return '$fieldName must not exceed $maxLength characters';
    }
    return null;
  }

  /// Validate numeric value
  static String? validateNumeric(String? value, [String fieldName = 'This field']) {
    if (value == null || value.isEmpty) {
      return '$fieldName is required';
    }
    if (double.tryParse(value) == null) {
      return '$fieldName must be a valid number';
    }
    return null;
  }

  /// Validate positive number
  static String? validatePositiveNumber(String? value, [String fieldName = 'This field']) {
    final numError = validateNumeric(value, fieldName);
    if (numError != null) return numError;

    final num = double.parse(value!);
    if (num <= 0) {
      return '$fieldName must be greater than 0';
    }
    return null;
  }

  /// Validate OTP
  static String? validateOTP(String? value, {int length = 6}) {
    if (value == null || value.isEmpty) {
      return 'OTP is required';
    }
    if (value.length != length || !RegExp(r'^\d+$').hasMatch(value)) {
      return 'Please enter a valid $length-digit OTP';
    }
    return null;
  }
}
