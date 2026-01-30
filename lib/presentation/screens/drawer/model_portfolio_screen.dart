import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../providers/config_provider.dart';
import '../../../core/utils/formatters.dart';

/// Model Portfolio screen
class ModelPortfolioScreen extends ConsumerWidget {
  const ModelPortfolioScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final config = ref.watch(appConfigProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Model Portfolio'),
      ),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: 3, // Placeholder
        itemBuilder: (context, index) {
          return _buildPortfolioCard(context, config, index);
        },
      ),
    );
  }

  Widget _buildPortfolioCard(
      BuildContext context, dynamic config, int index) {
    final portfolios = [
      {
        'name': 'Conservative Growth',
        'description': 'Low-risk portfolio focused on stable returns',
        'cagr': 12.5,
        'risk': 'Low',
        'minInvestment': 50000.0,
        'stocks': 15,
      },
      {
        'name': 'Balanced Portfolio',
        'description': 'Mix of growth and value stocks',
        'cagr': 18.2,
        'risk': 'Medium',
        'minInvestment': 100000.0,
        'stocks': 20,
      },
      {
        'name': 'Aggressive Growth',
        'description': 'High-risk, high-reward strategy',
        'cagr': 25.8,
        'risk': 'High',
        'minInvestment': 200000.0,
        'stocks': 12,
      },
    ];

    final portfolio = portfolios[index];

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: InkWell(
        onTap: () {
          // TODO: Navigate to portfolio details
        },
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          portfolio['name'] as String,
                          style:
                              Theme.of(context).textTheme.titleMedium?.copyWith(
                                    fontWeight: FontWeight.bold,
                                  ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          portfolio['description'] as String,
                          style:
                              Theme.of(context).textTheme.bodySmall?.copyWith(
                                    color: Colors.grey,
                                  ),
                        ),
                      ],
                    ),
                  ),
                  _buildRiskBadge(context, portfolio['risk'] as String),
                ],
              ),
              const SizedBox(height: 16),
              const Divider(),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _buildMetric(
                    context,
                    'CAGR',
                    '${portfolio['cagr']}%',
                    Colors.green,
                  ),
                  _buildMetric(
                    context,
                    'Min. Investment',
                    Formatters.formatCompactCurrency(
                        portfolio['minInvestment'] as double),
                    null,
                  ),
                  _buildMetric(
                    context,
                    'Stocks',
                    '${portfolio['stocks']}',
                    null,
                  ),
                ],
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    // TODO: Handle subscription
                  },
                  child: const Text('Invest Now'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildRiskBadge(BuildContext context, String risk) {
    Color color;
    switch (risk.toLowerCase()) {
      case 'low':
        color = Colors.green;
        break;
      case 'medium':
        color = Colors.orange;
        break;
      case 'high':
        color = Colors.red;
        break;
      default:
        color = Colors.grey;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color),
      ),
      child: Text(
        risk,
        style: TextStyle(
          color: color,
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  Widget _buildMetric(
      BuildContext context, String label, String value, Color? valueColor) {
    return Column(
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
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
                color: valueColor,
              ),
        ),
      ],
    );
  }
}
