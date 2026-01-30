import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';
import '../../core/config/env_config.dart';
import '../../core/network/dio_client.dart';
import '../../core/constants/api_endpoints.dart';
import '../../core/errors/api_exception.dart';

/// Payment service provider
final paymentServiceProvider = Provider<PaymentService>((ref) {
  return PaymentService(ref.read(dioClientProvider));
});

/// Payment order model
class PaymentOrder {
  final String orderId;
  final String paymentId;
  final double amount;
  final String currency;
  final String status;
  final String? description;
  final DateTime createdAt;

  PaymentOrder({
    required this.orderId,
    required this.paymentId,
    required this.amount,
    required this.currency,
    required this.status,
    this.description,
    required this.createdAt,
  });

  factory PaymentOrder.fromJson(Map<String, dynamic> json) {
    return PaymentOrder(
      orderId: json['orderId'] ?? json['order_id'] ?? '',
      paymentId: json['paymentId'] ?? json['payment_id'] ?? '',
      amount: (json['amount'] ?? 0).toDouble(),
      currency: json['currency'] ?? 'INR',
      status: json['status'] ?? 'created',
      description: json['description'],
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : DateTime.now(),
    );
  }
}

/// Payment result
class PaymentResult {
  final bool success;
  final String? paymentId;
  final String? orderId;
  final String? signature;
  final String? error;

  PaymentResult({
    required this.success,
    this.paymentId,
    this.orderId,
    this.signature,
    this.error,
  });
}

/// Payment service for handling payments via Razorpay
class PaymentService {
  final DioClient _dioClient;
  late final Razorpay _razorpay;

  PaymentService(this._dioClient) {
    _razorpay = Razorpay();
  }

  /// Create payment order on backend
  Future<Result<PaymentOrder>> createOrder({
    required double amount,
    required String description,
    String? planId,
    String? subscriptionType,
  }) async {
    try {
      final response = await _dioClient.post(
        ApiEndpoints.createPaymentOrder,
        data: {
          'amount': amount,
          'currency': 'INR',
          'description': description,
          'planId': planId,
          'subscriptionType': subscriptionType,
        },
      );
      final order = PaymentOrder.fromJson(response.data['order']);
      return Result.success(order);
    } catch (e) {
      if (e is ApiException) return Result.failure(e);
      return Result.failure(ApiException(message: e.toString()));
    }
  }

  /// Open Razorpay payment dialog
  Future<PaymentResult> openPaymentDialog({
    required String orderId,
    required double amount,
    required String description,
    required String name,
    required String email,
    String? phone,
    String? theme,
  }) async {
    final completer = _PaymentCompleter();

    _razorpay.on(Razorpay.EVENT_PAYMENT_SUCCESS, (response) {
      completer.complete(PaymentResult(
        success: true,
        paymentId: response.paymentId,
        orderId: response.orderId,
        signature: response.signature,
      ));
    });

    _razorpay.on(Razorpay.EVENT_PAYMENT_ERROR, (response) {
      completer.complete(PaymentResult(
        success: false,
        error: response.message ?? 'Payment failed',
      ));
    });

    _razorpay.on(Razorpay.EVENT_EXTERNAL_WALLET, (response) {
      completer.complete(PaymentResult(
        success: false,
        error: 'External wallet selected: ${response.walletName}',
      ));
    });

    final options = {
      'key': EnvConfig.razorpayApiKey,
      'amount': (amount * 100).toInt(), // Amount in paise
      'name': EnvConfig.whiteLabelText,
      'description': description,
      'order_id': orderId,
      'prefill': {
        'name': name,
        'email': email,
        if (phone != null) 'contact': phone,
      },
      'theme': {
        'color': theme ?? '#1E3A5F',
      },
    };

    _razorpay.open(options);

    return completer.future;
  }

  /// Verify payment on backend
  Future<Result<bool>> verifyPayment({
    required String orderId,
    required String paymentId,
    required String signature,
  }) async {
    try {
      final response = await _dioClient.post(
        ApiEndpoints.verifyPayment,
        data: {
          'orderId': orderId,
          'paymentId': paymentId,
          'signature': signature,
        },
      );
      return Result.success(response.data['verified'] == true);
    } catch (e) {
      if (e is ApiException) return Result.failure(e);
      return Result.failure(ApiException(message: e.toString()));
    }
  }

  /// Get payment history
  Future<Result<List<PaymentOrder>>> getPaymentHistory() async {
    try {
      final response = await _dioClient.get(ApiEndpoints.paymentHistory);
      final payments = (response.data['payments'] as List?)
              ?.map((e) => PaymentOrder.fromJson(e))
              .toList() ??
          [];
      return Result.success(payments);
    } catch (e) {
      if (e is ApiException) return Result.failure(e);
      return Result.failure(ApiException(message: e.toString()));
    }
  }

  /// Dispose Razorpay instance
  void dispose() {
    _razorpay.clear();
  }
}

/// Helper class to handle async payment completion
class _PaymentCompleter {
  late final Future<PaymentResult> future;
  late final void Function(PaymentResult) complete;

  _PaymentCompleter() {
    final completer = _InternalCompleter<PaymentResult>();
    future = completer.future;
    complete = completer.complete;
  }
}

class _InternalCompleter<T> {
  late final Future<T> future;
  late final void Function(T) complete;
  bool _completed = false;

  _InternalCompleter() {
    future = Future<T>(() {
      // This will be resolved when complete is called
      throw UnimplementedError();
    });

    // Use a proper completer pattern
    final ctrl = _Ctrl<T>();
    future = ctrl.future;
    complete = (value) {
      if (!_completed) {
        _completed = true;
        ctrl.complete(value);
      }
    };
  }
}

class _Ctrl<T> {
  T? _value;
  bool _completed = false;
  final _listeners = <void Function(T)>[];

  Future<T> get future async {
    if (_completed) return _value as T;
    return Future.microtask(() async {
      while (!_completed) {
        await Future.delayed(const Duration(milliseconds: 50));
      }
      return _value as T;
    });
  }

  void complete(T value) {
    _value = value;
    _completed = true;
    for (final listener in _listeners) {
      listener(value);
    }
  }
}
