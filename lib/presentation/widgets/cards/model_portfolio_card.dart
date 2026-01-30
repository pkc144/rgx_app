import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons/lucide_icons.dart';

/// Model Portfolio card matching React Native design
class ModelPortfolioCard extends StatelessWidget {
  final String name;
  final String description;
  final double cagr;
  final double minInvestment;
  final String riskLevel;
  final int stockCount;
  final bool isHorizontal;
  final VoidCallback? onTap;

  const ModelPortfolioCard({
    super.key,
    required this.name,
    required this.description,
    required this.cagr,
    required this.minInvestment,
    required this.riskLevel,
    required this.stockCount,
    this.isHorizontal = true,
    this.onTap,
  });

  Color get _riskColor {
    switch (riskLevel.toUpperCase()) {
      case 'CONSERVATIVE':
        return const Color(0xFF4CAF50);
      case 'MODERATE':
        return const Color(0xFFFF9800);
      case 'AGGRESSIVE':
        return const Color(0xFFE53935);
      default:
        return const Color(0xFF9E9E9E);
    }
  }

  String _formatCurrency(double value) {
    if (value >= 100000) {
      return '₹${(value / 100000).toStringAsFixed(1)}L';
    } else if (value >= 1000) {
      return '₹${(value / 1000).toStringAsFixed(0)}K';
    }
    return '₹${value.toStringAsFixed(0)}';
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: isHorizontal ? 280 : double.infinity,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.08),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header: Name + Risk Badge
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      name,
                      style: const TextStyle(
                        fontFamily: 'Satoshi',
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF212121),
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(width: 8),
                  _buildRiskBadge(),
                ],
              ),

              const SizedBox(height: 8),

              // Description
              Text(
                description,
                style: const TextStyle(
                  fontFamily: 'Satoshi',
                  fontSize: 12,
                  color: Color(0xFF757575),
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),

              const SizedBox(height: 16),

              // Stats Row
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _buildStatItem(
                    icon: LucideIcons.trendingUp,
                    label: 'CAGR',
                    value: '${cagr.toStringAsFixed(1)}%',
                    valueColor: const Color(0xFF4CAF50),
                  ),
                  _buildStatItem(
                    icon: LucideIcons.wallet,
                    label: 'Min. Invest',
                    value: _formatCurrency(minInvestment),
                    valueColor: const Color(0xFF424242),
                  ),
                  _buildStatItem(
                    icon: LucideIcons.briefcase,
                    label: 'Stocks',
                    value: stockCount.toString(),
                    valueColor: const Color(0xFF424242),
                  ),
                ],
              ),

              const SizedBox(height: 16),

              // Invest Now Button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: onTap,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF0056B7),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    elevation: 0,
                  ),
                  child: const Text(
                    'Invest Now',
                    style: TextStyle(
                      fontFamily: 'Satoshi',
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildRiskBadge() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: _riskColor.withOpacity(0.15),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        riskLevel.toUpperCase(),
        style: TextStyle(
          fontFamily: 'Satoshi',
          fontSize: 10,
          fontWeight: FontWeight.bold,
          color: _riskColor,
        ),
      ),
    );
  }

  Widget _buildStatItem({
    required IconData icon,
    required String label,
    required String value,
    required Color valueColor,
  }) {
    return Column(
      children: [
        Icon(icon, size: 16, color: const Color(0xFF9E9E9E)),
        const SizedBox(height: 4),
        Text(
          label,
          style: const TextStyle(
            fontFamily: 'Satoshi',
            fontSize: 10,
            color: Color(0xFF9E9E9E),
          ),
        ),
        const SizedBox(height: 2),
        Text(
          value,
          style: TextStyle(
            fontFamily: 'Satoshi',
            fontSize: 14,
            fontWeight: FontWeight.bold,
            color: valueColor,
          ),
        ),
      ],
    );
  }
}
