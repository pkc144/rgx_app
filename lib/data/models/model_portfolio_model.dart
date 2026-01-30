class ModelPortfolioModel {
  final String? id;
  final String? name;
  final String? description;
  final String? category;
  final String? riskLevel;
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

  factory ModelPortfolioModel.fromJson(Map<String, dynamic> json) {
    return ModelPortfolioModel(
      id: json['id'] as String?,
      name: json['name'] as String?,
      description: json['description'] as String?,
      category: json['category'] as String?,
      riskLevel: json['riskLevel'] as String?,
      minInvestment: (json['minInvestment'] as num?)?.toDouble(),
      cagr: (json['cagr'] as num?)?.toDouble(),
      returnSinceInception: (json['returnSinceInception'] as num?)?.toDouble(),
      annualizedReturns: (json['annualizedReturns'] as num?)?.toDouble(),
      volatility: (json['volatility'] as num?)?.toDouble(),
      sharpeRatio: (json['sharpeRatio'] as num?)?.toDouble(),
      maxDrawdown: (json['maxDrawdown'] as num?)?.toDouble(),
      stocks: (json['stocks'] as List<dynamic>?)
          ?.map((e) => PortfolioStock.fromJson(e as Map<String, dynamic>))
          .toList(),
      sectorAllocation: (json['sectorAllocation'] as List<dynamic>?)
          ?.map((e) => SectorAllocation.fromJson(e as Map<String, dynamic>))
          .toList(),
      imageUrl: json['imageUrl'] as String?,
      isActive: json['isActive'] as bool?,
      isSubscribed: json['isSubscribed'] as bool?,
      createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt']) : null,
      lastRebalancedAt: json['lastRebalancedAt'] != null ? DateTime.parse(json['lastRebalancedAt']) : null,
      performance: json['performance'] != null ? PerformanceMetrics.fromJson(json['performance']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'category': category,
      'riskLevel': riskLevel,
      'minInvestment': minInvestment,
      'cagr': cagr,
      'returnSinceInception': returnSinceInception,
      'annualizedReturns': annualizedReturns,
      'volatility': volatility,
      'sharpeRatio': sharpeRatio,
      'maxDrawdown': maxDrawdown,
      'stocks': stocks?.map((e) => e.toJson()).toList(),
      'sectorAllocation': sectorAllocation?.map((e) => e.toJson()).toList(),
      'imageUrl': imageUrl,
      'isActive': isActive,
      'isSubscribed': isSubscribed,
      'createdAt': createdAt?.toIso8601String(),
      'lastRebalancedAt': lastRebalancedAt?.toIso8601String(),
      'performance': performance?.toJson(),
    };
  }

  int get stockCount => stocks?.length ?? 0;
  bool get isConservative => riskLevel?.toUpperCase() == 'CONSERVATIVE';
  bool get isModerate => riskLevel?.toUpperCase() == 'MODERATE';
  bool get isAggressive => riskLevel?.toUpperCase() == 'AGGRESSIVE';
}

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

  factory PortfolioStock.fromJson(Map<String, dynamic> json) {
    return PortfolioStock(
      symbol: json['symbol'] as String?,
      companyName: json['companyName'] as String?,
      exchange: json['exchange'] as String?,
      weightage: (json['weightage'] as num?)?.toDouble(),
      currentPrice: (json['currentPrice'] as num?)?.toDouble(),
      entryPrice: (json['entryPrice'] as num?)?.toDouble(),
      returns: (json['returns'] as num?)?.toDouble(),
      sector: json['sector'] as String?,
      quantity: json['quantity'] as int?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'symbol': symbol,
      'companyName': companyName,
      'exchange': exchange,
      'weightage': weightage,
      'currentPrice': currentPrice,
      'entryPrice': entryPrice,
      'returns': returns,
      'sector': sector,
      'quantity': quantity,
    };
  }

  bool get isProfitable => (returns ?? 0) > 0;
}

class SectorAllocation {
  final String? sector;
  final double? percentage;
  final String? color;

  SectorAllocation({
    this.sector,
    this.percentage,
    this.color,
  });

  factory SectorAllocation.fromJson(Map<String, dynamic> json) {
    return SectorAllocation(
      sector: json['sector'] as String?,
      percentage: (json['percentage'] as num?)?.toDouble(),
      color: json['color'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'sector': sector,
      'percentage': percentage,
      'color': color,
    };
  }
}

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

  factory PerformanceMetrics.fromJson(Map<String, dynamic> json) {
    return PerformanceMetrics(
      oneMonth: (json['oneMonth'] as num?)?.toDouble(),
      threeMonth: (json['threeMonth'] as num?)?.toDouble(),
      sixMonth: (json['sixMonth'] as num?)?.toDouble(),
      oneYear: (json['oneYear'] as num?)?.toDouble(),
      threeYear: (json['threeYear'] as num?)?.toDouble(),
      fiveYear: (json['fiveYear'] as num?)?.toDouble(),
      sinceInception: (json['sinceInception'] as num?)?.toDouble(),
      chartData: (json['chartData'] as List<dynamic>?)
          ?.map((e) => PerformancePoint.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'oneMonth': oneMonth,
      'threeMonth': threeMonth,
      'sixMonth': sixMonth,
      'oneYear': oneYear,
      'threeYear': threeYear,
      'fiveYear': fiveYear,
      'sinceInception': sinceInception,
      'chartData': chartData?.map((e) => e.toJson()).toList(),
    };
  }
}

class PerformancePoint {
  final DateTime? date;
  final double? value;

  PerformancePoint({
    this.date,
    this.value,
  });

  factory PerformancePoint.fromJson(Map<String, dynamic> json) {
    return PerformancePoint(
      date: json['date'] != null ? DateTime.parse(json['date']) : null,
      value: (json['value'] as num?)?.toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'date': date?.toIso8601String(),
      'value': value,
    };
  }
}
