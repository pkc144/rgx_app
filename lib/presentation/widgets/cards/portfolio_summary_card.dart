import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/formatters.dart';
import '../../providers/config_provider.dart';

/// Portfolio summary card for home screen
class PortfolioSummaryCard extends ConsumerWidget {
  final double totalValue;
  final double totalPnl;
  final double totalPnlPercent;
  final double dayPnl;

  const PortfolioSummaryCard({
    super.key,
    required this.totalValue,
    required this.totalPnl,
    required this.totalPnlPercent,
    required this.dayPnl,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final config = ref.watch(appConfigProvider);
    final isProfitable = totalPnl >= 0;
    final isDayProfitable = dayPnl >= 0;

    return Card(
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          gradient: config.gradient,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Your Portfolio',
                  style: TextStyle(
                    color: Colors.white70,
                    fontSize: 14,
                  ),
                ),
                Icon(
                  LucideIcons.externalLink,
                  color: Colors.white70,
                  size: 18,
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              Formatters.formatCurrency(totalValue),
              style: const TextStyle(
                color: Colors.white,
                fontSize: 28,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: isProfitable
                        ? StockColors.profit.withOpacity(0.2)
                        : StockColors.loss.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        isProfitable
                            ? LucideIcons.trendingUp
                            : LucideIcons.trendingDown,
                        size: 14,
                        color: isProfitable
                            ? StockColors.profit
                            : StockColors.loss,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '${Formatters.formatCurrency(totalPnl)} (${Formatters.formatPercent(totalPnlPercent)})',
                        style: TextStyle(
                          color: isProfitable
                              ? StockColors.profit
                              : StockColors.loss,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                Text(
                  "Today: ${Formatters.formatCurrency(dayPnl)}",
                  style: TextStyle(
                    color: isDayProfitable
                        ? StockColors.profit
                        : StockColors.loss,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
