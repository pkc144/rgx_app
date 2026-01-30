import 'package:intl/intl.dart';

/// Formatting utilities
class Formatters {
  static final _currencyFormat = NumberFormat.currency(
    locale: 'en_IN',
    symbol: '\u20B9',
    decimalDigits: 2,
  );

  static final _compactCurrencyFormat = NumberFormat.compactCurrency(
    locale: 'en_IN',
    symbol: '\u20B9',
    decimalDigits: 2,
  );

  static final _numberFormat = NumberFormat('#,##0.00', 'en_IN');
  static final _percentFormat = NumberFormat.percentPattern('en_IN');
  static final _dateFormat = DateFormat('dd MMM yyyy');
  static final _dateTimeFormat = DateFormat('dd MMM yyyy, hh:mm a');
  static final _timeFormat = DateFormat('hh:mm a');

  /// Format amount as Indian currency
  static String formatCurrency(double? amount) {
    if (amount == null) return '\u20B90.00';
    return _currencyFormat.format(amount);
  }

  /// Format amount as compact currency (e.g., 1.5L, 2.3Cr)
  static String formatCompactCurrency(double? amount) {
    if (amount == null) return '\u20B90';
    return _compactCurrencyFormat.format(amount);
  }

  /// Format number with Indian number system
  static String formatNumber(double? value, {int decimals = 2}) {
    if (value == null) return '0.00';
    return NumberFormat('#,##,##0.${'0' * decimals}', 'en_IN').format(value);
  }

  /// Format as percentage
  static String formatPercent(double? value, {bool showSign = true}) {
    if (value == null) return '0.00%';
    final sign = showSign && value > 0 ? '+' : '';
    return '$sign${value.toStringAsFixed(2)}%';
  }

  /// Format date
  static String formatDate(DateTime? date) {
    if (date == null) return '';
    return _dateFormat.format(date);
  }

  /// Format date with time
  static String formatDateTime(DateTime? date) {
    if (date == null) return '';
    return _dateTimeFormat.format(date);
  }

  /// Format time only
  static String formatTime(DateTime? date) {
    if (date == null) return '';
    return _timeFormat.format(date);
  }

  /// Format quantity
  static String formatQuantity(int? qty) {
    if (qty == null) return '0';
    return NumberFormat('#,##0', 'en_IN').format(qty);
  }

  /// Parse currency string to double
  static double? parseCurrency(String? value) {
    if (value == null || value.isEmpty) return null;
    final cleaned = value.replaceAll(RegExp(r'[^\d.-]'), '');
    return double.tryParse(cleaned);
  }

  /// Format price change with color indicator
  static String formatPriceChange(double? change, double? changePercent) {
    if (change == null || changePercent == null) return '0.00 (0.00%)';
    final sign = change >= 0 ? '+' : '';
    return '$sign${formatNumber(change)} ($sign${changePercent.toStringAsFixed(2)}%)';
  }

  /// Format large numbers in Indian format (L for Lakhs, Cr for Crores)
  static String formatLargeNumber(double? value) {
    if (value == null) return '0';
    final absValue = value.abs();

    if (absValue >= 10000000) {
      // Crores
      return '${(value / 10000000).toStringAsFixed(2)} Cr';
    } else if (absValue >= 100000) {
      // Lakhs
      return '${(value / 100000).toStringAsFixed(2)} L';
    } else if (absValue >= 1000) {
      // Thousands
      return '${(value / 1000).toStringAsFixed(2)} K';
    }
    return formatNumber(value);
  }

  /// Format stock symbol (clean up)
  static String formatSymbol(String? symbol) {
    if (symbol == null || symbol.isEmpty) return '';
    // Remove exchange prefix if present (e.g., NSE:RELIANCE -> RELIANCE)
    if (symbol.contains(':')) {
      return symbol.split(':').last;
    }
    return symbol;
  }

  /// Format phone number
  static String formatPhone(String? phone) {
    if (phone == null || phone.isEmpty) return '';
    final cleaned = phone.replaceAll(RegExp(r'\D'), '');
    if (cleaned.length == 10) {
      return '${cleaned.substring(0, 5)} ${cleaned.substring(5)}';
    }
    return phone;
  }

  /// Mask sensitive data (e.g., PAN, bank account)
  static String maskSensitive(String? value, {int visibleChars = 4}) {
    if (value == null || value.length <= visibleChars) return value ?? '';
    final masked = '*' * (value.length - visibleChars);
    return '$masked${value.substring(value.length - visibleChars)}';
  }
}
