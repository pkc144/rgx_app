import 'package:json_annotation/json_annotation.dart';

part 'model_portfolio_model.g.dart';

@JsonSerializable()
class ModelPortfolioModel {
  final String? id;
  final String? name;
  final String? description;
  final String? category;
  final String? riskLevel; // CONSERVATIVE, MODERATE, AGGRESSIVE
  final double? minInvestment;
  final double? cagr;
  final double? returnSinceInception;
  final double? annualizedReturns;
  final double? volatility;
  final double? sharpeRatio;
  final double? maxDrawdown;
  final List<PortfolioStock>? stocks;
  final List<SectorAllocation>? sectorAllocation;
  final String? imageUrl;
  final bool? isActive;
  final bool? isSubscribed;
  final DateTime? createdAt;
  final DateTime? lastRebalancedAt;
  final PerformanceMetrics? performance;

  ModelPortfolioModel({
    this.id,
    this.name,
    this.description,
    this.category,
    this.riskLevel,
    this.minInvestment,
    this.cagr,
    this.returnSinceInception,
    this.annualizedReturns,
    this.volatility,
    this.sharpeRatio,
    this.maxDrawdown,
    this.stocks,
    this.sectorAllocation,
    this.imageUrl,
    this.isActive,
    this.isSubscribed,
    this.createdAt,
    this.lastRebalancedAt,
    this.performance,
  });

  factory ModelPortfolioModel.fromJson(Map<String, dynamic> json) => _$ModelPortfolioModelFromJson(json);
  Map<String, dynamic> toJson() => _$ModelPortfolioModelToJson(this);

  int get stockCount => stocks?.length ?? 0;

  bool get isConservative => riskLevel?.toUpperCase() == 'CONSERVATIVE';
  bool get isModerate => riskLevel?.toUpperCase() == 'MODERATE';
  bool get isAggressive => riskLevel?.toUpperCase() == 'AGGRESSIVE';
}

@JsonSerializable()
class PortfolioStock {
  final String? symbol;
  final String? companyName;
  final String? exchange;
  final double? weightage;
  final double? currentPrice;
  final double? entryPrice;
  final double? returns;
  final String? sector;
  final int? quantity;

  PortfolioStock({
    this.symbol,
    this.companyName,
    this.exchange,
    this.weightage,
    this.currentPrice,
    this.entryPrice,
    this.returns,
    this.sector,
    this.quantity,
  });

  factory PortfolioStock.fromJson(Map<String, dynamic> json) => _$PortfolioStockFromJson(json);
  Map<String, dynamic> toJson() => _$PortfolioStockToJson(this);

  bool get isProfitable => (returns ?? 0) > 0;
}

@JsonSerializable()
class SectorAllocation {
  final String? sector;
  final double? percentage;
  final String? color;

  SectorAllocation({
    this.sector,
    this.percentage,
    this.color,
  });

  factory SectorAllocation.fromJson(Map<String, dynamic> json) => _$SectorAllocationFromJson(json);
  Map<String, dynamic> toJson() => _$SectorAllocationToJson(this);
}

@JsonSerializable()
class PerformanceMetrics {
  final double? oneMonth;
  final double? threeMonth;
  final double? sixMonth;
  final double? oneYear;
  final double? threeYear;
  final double? fiveYear;
  final double? sinceInception;
  final List<PerformancePoint>? chartData;

  PerformanceMetrics({
    this.oneMonth,
    this.threeMonth,
    this.sixMonth,
    this.oneYear,
    this.threeYear,
    this.fiveYear,
    this.sinceInception,
    this.chartData,
  });

  factory PerformanceMetrics.fromJson(Map<String, dynamic> json) => _$PerformanceMetricsFromJson(json);
  Map<String, dynamic> toJson() => _$PerformanceMetricsToJson(this);
}

@JsonSerializable()
class PerformancePoint {
  final DateTime? date;
  final double? value;

  PerformancePoint({
    this.date,
    this.value,
  });

  factory PerformancePoint.fromJson(Map<String, dynamic> json) => _$PerformancePointFromJson(json);
  Map<String, dynamic> toJson() => _$PerformancePointToJson(this);
}
