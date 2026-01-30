import 'package:json_annotation/json_annotation.dart';

part 'portfolio_model.g.dart';

@JsonSerializable()
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

  factory PortfolioModel.fromJson(Map<String, dynamic> json) => _$PortfolioModelFromJson(json);
  Map<String, dynamic> toJson() => _$PortfolioModelToJson(this);

  bool get isProfitable => (totalPnl ?? 0) > 0;
  bool get isDayProfitable => (dayPnl ?? 0) > 0;

  int get totalHoldings => holdings?.length ?? 0;
}

@JsonSerializable()
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

  factory HoldingModel.fromJson(Map<String, dynamic> json) => _$HoldingModelFromJson(json);
  Map<String, dynamic> toJson() => _$HoldingModelToJson(this);

  bool get isProfitable => (pnl ?? 0) > 0;
  bool get isDayProfitable => (dayChange ?? 0) > 0;
}

@JsonSerializable()
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
  final String? productType; // MIS, CNC, NRML
  final String? positionType; // LONG, SHORT
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

  factory PositionModel.fromJson(Map<String, dynamic> json) => _$PositionModelFromJson(json);
  Map<String, dynamic> toJson() => _$PositionModelToJson(this);

  bool get isProfitable => (pnl ?? 0) > 0;
  bool get isLong => positionType?.toUpperCase() == 'LONG';
  bool get isShort => positionType?.toUpperCase() == 'SHORT';
}
