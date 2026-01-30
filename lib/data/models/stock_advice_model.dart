class StockAdviceModel {
  final String? id;
  final String? symbol;
  final String? companyName;
  final String? exchange;
  final String? adviceType;
  final double? entryPrice;
  final double? targetPrice;
  final double? stopLoss;
  final double? currentPrice;
  final int? quantity;
  final String? rationale;
  final String? timeHorizon;
  final String? riskLevel;
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

  factory StockAdviceModel.fromJson(Map<String, dynamic> json) {
    return StockAdviceModel(
      id: json['id'] as String?,
      symbol: json['symbol'] as String?,
      companyName: json['companyName'] as String?,
      exchange: json['exchange'] as String?,
      adviceType: json['adviceType'] as String?,
      entryPrice: (json['entryPrice'] as num?)?.toDouble(),
      targetPrice: (json['targetPrice'] as num?)?.toDouble(),
      stopLoss: (json['stopLoss'] as num?)?.toDouble(),
      currentPrice: (json['currentPrice'] as num?)?.toDouble(),
      quantity: json['quantity'] as int?,
      rationale: json['rationale'] as String?,
      timeHorizon: json['timeHorizon'] as String?,
      riskLevel: json['riskLevel'] as String?,
      createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt']) : null,
      expiresAt: json['expiresAt'] != null ? DateTime.parse(json['expiresAt']) : null,
      isActive: json['isActive'] as bool?,
      isExecuted: json['isExecuted'] as bool?,
      advisor: json['advisor'] != null ? AdvisorInfo.fromJson(json['advisor']) : null,
      tags: (json['tags'] as List<dynamic>?)?.map((e) => e as String).toList(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'symbol': symbol,
      'companyName': companyName,
      'exchange': exchange,
      'adviceType': adviceType,
      'entryPrice': entryPrice,
      'targetPrice': targetPrice,
      'stopLoss': stopLoss,
      'currentPrice': currentPrice,
      'quantity': quantity,
      'rationale': rationale,
      'timeHorizon': timeHorizon,
      'riskLevel': riskLevel,
      'createdAt': createdAt?.toIso8601String(),
      'expiresAt': expiresAt?.toIso8601String(),
      'isActive': isActive,
      'isExecuted': isExecuted,
      'advisor': advisor?.toJson(),
      'tags': tags,
    };
  }

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

  factory AdvisorInfo.fromJson(Map<String, dynamic> json) {
    return AdvisorInfo(
      id: json['id'] as String?,
      name: json['name'] as String?,
      code: json['code'] as String?,
      imageUrl: json['imageUrl'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'code': code,
      'imageUrl': imageUrl,
    };
  }
}
