import 'package:json_annotation/json_annotation.dart';

part 'stock_advice_model.g.dart';

@JsonSerializable()
class StockAdviceModel {
  final String? id;
  final String? symbol;
  final String? companyName;
  final String? exchange;
  final String? adviceType; // BUY, SELL, HOLD
  final double? entryPrice;
  final double? targetPrice;
  final double? stopLoss;
  final double? currentPrice;
  final int? quantity;
  final String? rationale;
  final String? timeHorizon; // SHORT_TERM, MEDIUM_TERM, LONG_TERM
  final String? riskLevel; // LOW, MEDIUM, HIGH
  final DateTime? createdAt;
  final DateTime? expiresAt;
  final bool? isActive;
  final bool? isExecuted;
  final AdvisorInfo? advisor;
  final List<String>? tags;

  StockAdviceModel({
    this.id,
    this.symbol,
    this.companyName,
    this.exchange,
    this.adviceType,
    this.entryPrice,
    this.targetPrice,
    this.stopLoss,
    this.currentPrice,
    this.quantity,
    this.rationale,
    this.timeHorizon,
    this.riskLevel,
    this.createdAt,
    this.expiresAt,
    this.isActive,
    this.isExecuted,
    this.advisor,
    this.tags,
  });

  factory StockAdviceModel.fromJson(Map<String, dynamic> json) => _$StockAdviceModelFromJson(json);
  Map<String, dynamic> toJson() => _$StockAdviceModelToJson(this);

  double? get potentialProfit {
    if (entryPrice == null || targetPrice == null) return null;
    return ((targetPrice! - entryPrice!) / entryPrice!) * 100;
  }

  double? get potentialLoss {
    if (entryPrice == null || stopLoss == null) return null;
    return ((entryPrice! - stopLoss!) / entryPrice!) * 100;
  }

  double? get riskRewardRatio {
    final profit = potentialProfit;
    final loss = potentialLoss;
    if (profit == null || loss == null || loss == 0) return null;
    return profit / loss;
  }

  bool get isBuy => adviceType?.toUpperCase() == 'BUY';
  bool get isSell => adviceType?.toUpperCase() == 'SELL';
  bool get isHold => adviceType?.toUpperCase() == 'HOLD';

  bool get isExpired {
    if (expiresAt == null) return false;
    return DateTime.now().isAfter(expiresAt!);
  }
}

@JsonSerializable()
class AdvisorInfo {
  final String? id;
  final String? name;
  final String? code;
  final String? imageUrl;

  AdvisorInfo({
    this.id,
    this.name,
    this.code,
    this.imageUrl,
  });

  factory AdvisorInfo.fromJson(Map<String, dynamic> json) => _$AdvisorInfoFromJson(json);
  Map<String, dynamic> toJson() => _$AdvisorInfoToJson(this);
}
