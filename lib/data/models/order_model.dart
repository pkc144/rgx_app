import 'package:json_annotation/json_annotation.dart';

part 'order_model.g.dart';

@JsonSerializable()
class OrderModel {
  final String? id;
  final String? orderId;
  final String? symbol;
  final String? companyName;
  final String? exchange;
  final String? transactionType; // BUY, SELL
  final String? orderType; // MARKET, LIMIT, SL, SL-M
  final String? productType; // CNC, MIS, NRML
  final int? quantity;
  final int? filledQuantity;
  final int? pendingQuantity;
  final double? price;
  final double? triggerPrice;
  final double? avgPrice;
  final String? status; // PENDING, OPEN, COMPLETE, CANCELLED, REJECTED
  final String? statusMessage;
  final String? brokerCode;
  final String? brokerOrderId;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  final DateTime? filledAt;

  OrderModel({
    this.id,
    this.orderId,
    this.symbol,
    this.companyName,
    this.exchange,
    this.transactionType,
    this.orderType,
    this.productType,
    this.quantity,
    this.filledQuantity,
    this.pendingQuantity,
    this.price,
    this.triggerPrice,
    this.avgPrice,
    this.status,
    this.statusMessage,
    this.brokerCode,
    this.brokerOrderId,
    this.createdAt,
    this.updatedAt,
    this.filledAt,
  });

  factory OrderModel.fromJson(Map<String, dynamic> json) => _$OrderModelFromJson(json);
  Map<String, dynamic> toJson() => _$OrderModelToJson(this);

  bool get isBuy => transactionType?.toUpperCase() == 'BUY';
  bool get isSell => transactionType?.toUpperCase() == 'SELL';
  bool get isMarket => orderType?.toUpperCase() == 'MARKET';
  bool get isLimit => orderType?.toUpperCase() == 'LIMIT';

  bool get isPending => status?.toUpperCase() == 'PENDING' || status?.toUpperCase() == 'OPEN';
  bool get isComplete => status?.toUpperCase() == 'COMPLETE';
  bool get isCancelled => status?.toUpperCase() == 'CANCELLED';
  bool get isRejected => status?.toUpperCase() == 'REJECTED';

  bool get canCancel => isPending;

  double get orderValue {
    final qty = quantity ?? 0;
    final prc = price ?? avgPrice ?? 0;
    return qty * prc;
  }
}

@JsonSerializable()
class PlaceOrderRequest {
  final String symbol;
  final String exchange;
  final String transactionType;
  final String orderType;
  final String productType;
  final int quantity;
  final double? price;
  final double? triggerPrice;
  final String brokerCode;

  PlaceOrderRequest({
    required this.symbol,
    required this.exchange,
    required this.transactionType,
    required this.orderType,
    required this.productType,
    required this.quantity,
    this.price,
    this.triggerPrice,
    required this.brokerCode,
  });

  factory PlaceOrderRequest.fromJson(Map<String, dynamic> json) => _$PlaceOrderRequestFromJson(json);
  Map<String, dynamic> toJson() => _$PlaceOrderRequestToJson(this);
}
