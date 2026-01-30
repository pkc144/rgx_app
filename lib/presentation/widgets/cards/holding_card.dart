import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/formatters.dart';
import '../../../data/models/portfolio_model.dart';

/// Holding card widget for portfolio screen
class HoldingCard extends StatelessWidget {
  final HoldingModel holding;
  final VoidCallback? onTap;

  const HoldingCard({
    super.key,
    required this.holding,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isProfitable = (holding.pnl ?? 0) >= 0;
    final isDayProfitable = (holding.dayChange ?? 0) >= 0;

    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              // Stock info row
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          holding.symbol ?? '',
                          style:
                              Theme.of(context).textTheme.titleMedium?.copyWith(
                                    fontWeight: FontWeight.bold,
                                  ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          holding.companyName ?? '',
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
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        Formatters.formatCurrency(holding.currentValue),
                        style:
                            Theme.of(context).textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.bold,
                                ),
                      ),
                      const SizedBox(height: 2),
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            isProfitable
                                ? LucideIcons.trendingUp
                                : LucideIcons.trendingDown,
                            size: 14,
                            color: StockColors.getPnlColor(holding.pnl ?? 0),
                          ),
                          const SizedBox(width: 4),
                          Text(
                            Formatters.formatPercent(holding.pnlPercent),
                            style: TextStyle(
                              color: StockColors.getPnlColor(holding.pnl ?? 0),
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 12),
              const Divider(height: 1),
              const SizedBox(height: 12),

              // Details row
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _buildDetailItem(
                    context,
                    'Qty',
                    Formatters.formatQuantity(holding.quantity),
                  ),
                  _buildDetailItem(
                    context,
                    'Avg',
                    Formatters.formatCurrency(holding.avgPrice),
                  ),
                  _buildDetailItem(
                    context,
                    'LTP',
                    Formatters.formatCurrency(holding.currentPrice),
                  ),
                  _buildDetailItem(
                    context,
                    'P&L',
                    Formatters.formatCurrency(holding.pnl),
                    valueColor: StockColors.getPnlColor(holding.pnl ?? 0),
                  ),
                ],
              ),

              // Day change if available
              if (holding.dayChangePercent != null) ...[
                const SizedBox(height: 8),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: isDayProfitable
                        ? StockColors.profit.withOpacity(0.1)
                        : StockColors.loss.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    "Today: ${Formatters.formatPercent(holding.dayChangePercent)}",
                    style: TextStyle(
                      color: StockColors.getPnlColor(holding.dayChange ?? 0),
                      fontSize: 11,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDetailItem(
    BuildContext context,
    String label,
    String value, {
    Color? valueColor,
  }) {
    return Column(
      children: [
        Text(
          label,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Colors.grey,
                fontSize: 11,
              ),
        ),
        const SizedBox(height: 2),
        Text(
          value,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                fontWeight: FontWeight.w600,
                color: valueColor,
              ),
        ),
      ],
    );
  }
}
