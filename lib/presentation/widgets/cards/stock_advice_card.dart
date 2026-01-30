import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/formatters.dart';
import '../../providers/config_provider.dart';

/// Stock advice card widget
class StockAdviceCard extends ConsumerWidget {
  final String symbol;
  final String companyName;
  final String adviceType;
  final double currentPrice;
  final double targetPrice;
  final double stopLoss;
  final VoidCallback? onTap;
  final VoidCallback? onAddToCart;

  const StockAdviceCard({
    super.key,
    required this.symbol,
    required this.companyName,
    required this.adviceType,
    required this.currentPrice,
    required this.targetPrice,
    required this.stopLoss,
    this.onTap,
    this.onAddToCart,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final config = ref.watch(appConfigProvider);
    final isBuy = adviceType.toUpperCase() == 'BUY';
    final potentialReturn = ((targetPrice - currentPrice) / currentPrice) * 100;
    final riskPercent = ((currentPrice - stopLoss) / currentPrice) * 100;

    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          symbol,
                          style:
                              Theme.of(context).textTheme.titleMedium?.copyWith(
                                    fontWeight: FontWeight.bold,
                                  ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          companyName,
                          style:
                              Theme.of(context).textTheme.bodySmall?.copyWith(
                                    color: Colors.grey,
                                  ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: isBuy
                          ? StockColors.buy.withOpacity(0.1)
                          : StockColors.sell.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          isBuy ? LucideIcons.trendingUp : LucideIcons.trendingDown,
                          size: 16,
                          color: isBuy ? StockColors.buy : StockColors.sell,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          adviceType.toUpperCase(),
                          style: TextStyle(
                            color: isBuy ? StockColors.buy : StockColors.sell,
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Price info
              Row(
                children: [
                  Expanded(
                    child: _buildPriceItem(
                      context,
                      'Current',
                      Formatters.formatCurrency(currentPrice),
                      null,
                    ),
                  ),
                  Expanded(
                    child: _buildPriceItem(
                      context,
                      'Target',
                      Formatters.formatCurrency(targetPrice),
                      StockColors.profit,
                    ),
                  ),
                  Expanded(
                    child: _buildPriceItem(
                      context,
                      'Stop Loss',
                      Formatters.formatCurrency(stopLoss),
                      StockColors.loss,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Potential return
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.grey.shade100,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Icon(
                          LucideIcons.target,
                          size: 16,
                          color: StockColors.profit,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'Potential: ${Formatters.formatPercent(potentialReturn)}',
                          style: TextStyle(
                            color: StockColors.profit,
                            fontWeight: FontWeight.w600,
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                    Row(
                      children: [
                        Icon(
                          LucideIcons.shieldAlert,
                          size: 16,
                          color: StockColors.loss,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'Risk: ${Formatters.formatPercent(riskPercent)}',
                          style: TextStyle(
                            color: StockColors.loss,
                            fontWeight: FontWeight.w600,
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Action button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: onAddToCart,
                  icon: const Icon(LucideIcons.shoppingCart, size: 18),
                  label: const Text('Add to Cart'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: isBuy ? StockColors.buy : StockColors.sell,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPriceItem(
    BuildContext context,
    String label,
    String value,
    Color? valueColor,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Colors.grey,
              ),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: Theme.of(context).textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.w600,
                color: valueColor,
              ),
        ),
      ],
    );
  }
}
