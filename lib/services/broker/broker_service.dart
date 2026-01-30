import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/network/dio_client.dart';
import '../../core/constants/api_endpoints.dart';
import '../../core/constants/broker_constants.dart';
import '../../core/errors/api_exception.dart';
import '../../data/models/user_model.dart';
import '../../data/models/order_model.dart';
import '../../data/models/portfolio_model.dart';

/// Broker service provider
final brokerServiceProvider = Provider<BrokerService>((ref) {
  return BrokerService(ref.read(dioClientProvider));
});

/// Broker service for managing broker connections and orders
class BrokerService {
  final DioClient _dioClient;

  BrokerService(this._dioClient);

  /// Get broker connection status
  Future<Result<List<BrokerConnection>>> getBrokerStatus() async {
    try {
      final response = await _dioClient.get(ApiEndpoints.brokerStatus);
      final connections = (response.data['connections'] as List?)
              ?.map((e) => BrokerConnection.fromJson(e))
              .toList() ??
          [];
      return Result.success(connections);
    } catch (e) {
      if (e is ApiException) return Result.failure(e);
      return Result.failure(ApiException(message: e.toString()));
    }
  }

  /// Get broker OAuth URL for connection
  Future<Result<String>> getBrokerConnectUrl(BrokerType broker) async {
    try {
      final response = await _dioClient.post(
        ApiEndpoints.brokerConnect,
        data: {
          'broker': broker.code,
        },
        useCcxt: true,
      );
      return Result.success(response.data['authUrl']);
    } catch (e) {
      if (e is ApiException) return Result.failure(e);
      return Result.failure(ApiException(message: e.toString()));
    }
  }

  /// Disconnect broker
  Future<Result<void>> disconnectBroker(String brokerCode) async {
    try {
      await _dioClient.post(
        ApiEndpoints.brokerDisconnect,
        data: {
          'broker': brokerCode,
        },
      );
      return Result.success(null);
    } catch (e) {
      if (e is ApiException) return Result.failure(e);
      return Result.failure(ApiException(message: e.toString()));
    }
  }

  /// Get holdings from broker
  Future<Result<List<HoldingModel>>> getHoldings(String brokerCode) async {
    try {
      final response = await _dioClient.get(
        ApiEndpoints.ccxtHoldings,
        queryParameters: {'broker': brokerCode},
        useCcxt: true,
      );
      final holdings = (response.data['holdings'] as List?)
              ?.map((e) => HoldingModel.fromJson(e))
              .toList() ??
          [];
      return Result.success(holdings);
    } catch (e) {
      if (e is ApiException) return Result.failure(e);
      return Result.failure(ApiException(message: e.toString()));
    }
  }

  /// Get positions from broker
  Future<Result<List<PositionModel>>> getPositions(String brokerCode) async {
    try {
      final response = await _dioClient.get(
        ApiEndpoints.ccxtPositions,
        queryParameters: {'broker': brokerCode},
        useCcxt: true,
      );
      final positions = (response.data['positions'] as List?)
              ?.map((e) => PositionModel.fromJson(e))
              .toList() ??
          [];
      return Result.success(positions);
    } catch (e) {
      if (e is ApiException) return Result.failure(e);
      return Result.failure(ApiException(message: e.toString()));
    }
  }

  /// Get order book
  Future<Result<List<OrderModel>>> getOrderBook(String brokerCode) async {
    try {
      final response = await _dioClient.get(
        ApiEndpoints.ccxtOrderBook,
        queryParameters: {'broker': brokerCode},
        useCcxt: true,
      );
      final orders = (response.data['orders'] as List?)
              ?.map((e) => OrderModel.fromJson(e))
              .toList() ??
          [];
      return Result.success(orders);
    } catch (e) {
      if (e is ApiException) return Result.failure(e);
      return Result.failure(ApiException(message: e.toString()));
    }
  }

  /// Place order
  Future<Result<OrderModel>> placeOrder(PlaceOrderRequest request) async {
    try {
      final response = await _dioClient.post(
        ApiEndpoints.ccxtPlaceOrder,
        data: request.toJson(),
        useCcxt: true,
      );
      final order = OrderModel.fromJson(response.data['order']);
      return Result.success(order);
    } catch (e) {
      if (e is ApiException) return Result.failure(e);
      return Result.failure(ApiException(message: e.toString()));
    }
  }

  /// Cancel order
  Future<Result<void>> cancelOrder(String orderId, String brokerCode) async {
    try {
      await _dioClient.post(
        ApiEndpoints.ccxtCancelOrder,
        data: {
          'orderId': orderId,
          'broker': brokerCode,
        },
        useCcxt: true,
      );
      return Result.success(null);
    } catch (e) {
      if (e is ApiException) return Result.failure(e);
      return Result.failure(ApiException(message: e.toString()));
    }
  }

  /// Place multiple orders (basket)
  Future<Result<List<OrderModel>>> placeBasketOrders(
      List<PlaceOrderRequest> orders) async {
    final results = <OrderModel>[];
    final errors = <String>[];

    for (final order in orders) {
      final result = await placeOrder(order);
      result.when(
        success: (data) => results.add(data),
        failure: (error) => errors.add('${order.symbol}: ${error.message}'),
      );
    }

    if (errors.isEmpty) {
      return Result.success(results);
    } else if (results.isNotEmpty) {
      // Partial success
      return Result.success(results);
    } else {
      return Result.failure(
        ApiException(message: 'All orders failed: ${errors.join(', ')}'),
      );
    }
  }

  /// Get aggregated holdings from all connected brokers
  Future<Result<List<HoldingModel>>> getAllHoldings(
      List<String> connectedBrokers) async {
    final allHoldings = <HoldingModel>[];

    for (final broker in connectedBrokers) {
      final result = await getHoldings(broker);
      result.when(
        success: (holdings) => allHoldings.addAll(holdings),
        failure: (_) {}, // Ignore individual broker errors
      );
    }

    return Result.success(allHoldings);
  }
}
