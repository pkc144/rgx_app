class PortfolioModel {
  final String? id;
  final String? userId;
  final double? totalInvestment;
  final double? currentValue;
  final double? totalPnl;
  final double? totalPnlPercent;
  final double? dayPnl;
  final double? dayPnlPercent;
  final List<HoldingModel>? holdings;
  final DateTime? lastUpdated;

  PortfolioModel({
    this.id,
    this.userId,
    this.totalInvestment,
    this.currentValue,
    this.totalPnl,
    this.totalPnlPercent,
    this.dayPnl,
    this.dayPnlPercent,
    this.holdings,
    this.lastUpdated,
  });

  factory PortfolioModel.fromJson(Map<String, dynamic> json) {
    return PortfolioModel(
      id: json['id'] as String?,
      userId: json['userId'] as String?,
      totalInvestment: (json['totalInvestment'] as num?)?.toDouble(),
      currentValue: (json['currentValue'] as num?)?.toDouble(),
      totalPnl: (json['totalPnl'] as num?)?.toDouble(),
      totalPnlPercent: (json['totalPnlPercent'] as num?)?.toDouble(),
      dayPnl: (json['dayPnl'] as num?)?.toDouble(),
      dayPnlPercent: (json['dayPnlPercent'] as num?)?.toDouble(),
      holdings: (json['holdings'] as List<dynamic>?)
          ?.map((e) => HoldingModel.fromJson(e as Map<String, dynamic>))
          .toList(),
      lastUpdated: json['lastUpdated'] != null ? DateTime.parse(json['lastUpdated']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'totalInvestment': totalInvestment,
      'currentValue': currentValue,
      'totalPnl': totalPnl,
      'totalPnlPercent': totalPnlPercent,
      'dayPnl': dayPnl,
      'dayPnlPercent': dayPnlPercent,
      'holdings': holdings?.map((e) => e.toJson()).toList(),
      'lastUpdated': lastUpdated?.toIso8601String(),
    };
  }

  bool get isProfitable => (totalPnl ?? 0) > 0;
  bool get isDayProfitable => (dayPnl ?? 0) > 0;
  int get totalHoldings => holdings?.length ?? 0;
}

class HoldingModel {
  final String? id;
  final String? symbol;
  final String? companyName;
  final String? exchange;
  final int? quantity;
  final double? avgPrice;
  final double? currentPrice;
  final double? investedValue;
  final double? currentValue;
  final double? pnl;
  final double? pnlPercent;
  final double? dayChange;
  final double? dayChangePercent;
  final String? brokerCode;
  final DateTime? purchaseDate;

  HoldingModel({
    this.id,
    this.symbol,
    this.companyName,
    this.exchange,
    this.quantity,
    this.avgPrice,
    this.currentPrice,
    this.investedValue,
    this.currentValue,
    this.pnl,
    this.pnlPercent,
    this.dayChange,
    this.dayChangePercent,
    this.brokerCode,
    this.purchaseDate,
  });

  factory HoldingModel.fromJson(Map<String, dynamic> json) {
    return HoldingModel(
      id: json['id'] as String?,
      symbol: json['symbol'] as String?,
      companyName: json['companyName'] as String?,
      exchange: json['exchange'] as String?,
      quantity: json['quantity'] as int?,
      avgPrice: (json['avgPrice'] as num?)?.toDouble(),
      currentPrice: (json['currentPrice'] as num?)?.toDouble(),
      investedValue: (json['investedValue'] as num?)?.toDouble(),
      currentValue: (json['currentValue'] as num?)?.toDouble(),
      pnl: (json['pnl'] as num?)?.toDouble(),
      pnlPercent: (json['pnlPercent'] as num?)?.toDouble(),
      dayChange: (json['dayChange'] as num?)?.toDouble(),
      dayChangePercent: (json['dayChangePercent'] as num?)?.toDouble(),
      brokerCode: json['brokerCode'] as String?,
      purchaseDate: json['purchaseDate'] != null ? DateTime.parse(json['purchaseDate']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'symbol': symbol,
      'companyName': companyName,
      'exchange': exchange,
      'quantity': quantity,
      'avgPrice': avgPrice,
      'currentPrice': currentPrice,
      'investedValue': investedValue,
      'currentValue': currentValue,
      'pnl': pnl,
      'pnlPercent': pnlPercent,
      'dayChange': dayChange,
      'dayChangePercent': dayChangePercent,
      'brokerCode': brokerCode,
      'purchaseDate': purchaseDate?.toIso8601String(),
    };
  }

  bool get isProfitable => (pnl ?? 0) > 0;
  bool get isDayProfitable => (dayChange ?? 0) > 0;
}

class PositionModel {
  final String? id;
  final String? symbol;
  final String? companyName;
  final String? exchange;
  final int? quantity;
  final double? avgPrice;
  final double? currentPrice;
  final double? pnl;
  final double? pnlPercent;
  final String? productType;
  final String? positionType;
  final double? multiplier;
  final double? buyValue;
  final double? sellValue;
  final String? brokerCode;

  PositionModel({
    this.id,
    this.symbol,
    this.companyName,
    this.exchange,
    this.quantity,
    this.avgPrice,
    this.currentPrice,
    this.pnl,
    this.pnlPercent,
    this.productType,
    this.positionType,
    this.multiplier,
    this.buyValue,
    this.sellValue,
    this.brokerCode,
  });

  factory PositionModel.fromJson(Map<String, dynamic> json) {
    return PositionModel(
      id: json['id'] as String?,
      symbol: json['symbol'] as String?,
      companyName: json['companyName'] as String?,
      exchange: json['exchange'] as String?,
      quantity: json['quantity'] as int?,
      avgPrice: (json['avgPrice'] as num?)?.toDouble(),
      currentPrice: (json['currentPrice'] as num?)?.toDouble(),
      pnl: (json['pnl'] as num?)?.toDouble(),
      pnlPercent: (json['pnlPercent'] as num?)?.toDouble(),
      productType: json['productType'] as String?,
      positionType: json['positionType'] as String?,
      multiplier: (json['multiplier'] as num?)?.toDouble(),
      buyValue: (json['buyValue'] as num?)?.toDouble(),
      sellValue: (json['sellValue'] as num?)?.toDouble(),
      brokerCode: json['brokerCode'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'symbol': symbol,
      'companyName': companyName,
      'exchange': exchange,
      'quantity': quantity,
      'avgPrice': avgPrice,
      'currentPrice': currentPrice,
      'pnl': pnl,
      'pnlPercent': pnlPercent,
      'productType': productType,
      'positionType': positionType,
      'multiplier': multiplier,
      'buyValue': buyValue,
      'sellValue': sellValue,
      'brokerCode': brokerCode,
    };
  }

  bool get isProfitable => (pnl ?? 0) > 0;
  bool get isLong => positionType?.toUpperCase() == 'LONG';
  bool get isShort => positionType?.toUpperCase() == 'SHORT';
}
