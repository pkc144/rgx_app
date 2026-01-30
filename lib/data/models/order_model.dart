class OrderModel {
  final String? id;
  final String? orderId;
  final String? symbol;
  final String? companyName;
  final String? exchange;
  final String? transactionType;
  final String? orderType;
  final String? productType;
  final int? quantity;
  final int? filledQuantity;
  final int? pendingQuantity;
  final double? price;
  final double? triggerPrice;
  final double? avgPrice;
  final String? status;
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

  factory OrderModel.fromJson(Map<String, dynamic> json) {
    return OrderModel(
      id: json['id'] as String?,
      orderId: json['orderId'] as String?,
      symbol: json['symbol'] as String?,
      companyName: json['companyName'] as String?,
      exchange: json['exchange'] as String?,
      transactionType: json['transactionType'] as String?,
      orderType: json['orderType'] as String?,
      productType: json['productType'] as String?,
      quantity: json['quantity'] as int?,
      filledQuantity: json['filledQuantity'] as int?,
      pendingQuantity: json['pendingQuantity'] as int?,
      price: (json['price'] as num?)?.toDouble(),
      triggerPrice: (json['triggerPrice'] as num?)?.toDouble(),
      avgPrice: (json['avgPrice'] as num?)?.toDouble(),
      status: json['status'] as String?,
      statusMessage: json['statusMessage'] as String?,
      brokerCode: json['brokerCode'] as String?,
      brokerOrderId: json['brokerOrderId'] as String?,
      createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt']) : null,
      updatedAt: json['updatedAt'] != null ? DateTime.parse(json['updatedAt']) : null,
      filledAt: json['filledAt'] != null ? DateTime.parse(json['filledAt']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'orderId': orderId,
      'symbol': symbol,
      'companyName': companyName,
      'exchange': exchange,
      'transactionType': transactionType,
      'orderType': orderType,
      'productType': productType,
      'quantity': quantity,
      'filledQuantity': filledQuantity,
      'pendingQuantity': pendingQuantity,
      'price': price,
      'triggerPrice': triggerPrice,
      'avgPrice': avgPrice,
      'status': status,
      'statusMessage': statusMessage,
      'brokerCode': brokerCode,
      'brokerOrderId': brokerOrderId,
      'createdAt': createdAt?.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
      'filledAt': filledAt?.toIso8601String(),
    };
  }

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

  factory PlaceOrderRequest.fromJson(Map<String, dynamic> json) {
    return PlaceOrderRequest(
      symbol: json['symbol'] as String,
      exchange: json['exchange'] as String,
      transactionType: json['transactionType'] as String,
      orderType: json['orderType'] as String,
      productType: json['productType'] as String,
      quantity: json['quantity'] as int,
      price: (json['price'] as num?)?.toDouble(),
      triggerPrice: (json['triggerPrice'] as num?)?.toDouble(),
      brokerCode: json['brokerCode'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'symbol': symbol,
      'exchange': exchange,
      'transactionType': transactionType,
      'orderType': orderType,
      'productType': productType,
      'quantity': quantity,
      'price': price,
      'triggerPrice': triggerPrice,
      'brokerCode': brokerCode,
    };
  }
}
