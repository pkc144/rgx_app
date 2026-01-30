import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../providers/config_provider.dart';
import '../../providers/portfolio_provider.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/theme/app_theme.dart';
import '../../widgets/cards/holding_card.dart';

/// Portfolio screen showing holdings and positions
class PortfolioScreen extends ConsumerStatefulWidget {
  const PortfolioScreen({super.key});

  @override
  ConsumerState<PortfolioScreen> createState() => _PortfolioScreenState();
}

class _PortfolioScreenState extends ConsumerState<PortfolioScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final config = ref.watch(appConfigProvider);
    final portfolioState = ref.watch(portfolioProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Portfolio'),
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.refreshCw),
            onPressed: () {
              ref.read(portfolioProvider.notifier).refresh();
            },
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Holdings'),
            Tab(text: 'Positions'),
          ],
        ),
      ),
      body: Column(
        children: [
          // Portfolio summary
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: config.gradient,
            ),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Current Value',
                          style: TextStyle(
                            color: Colors.white70,
                            fontSize: 12,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          Formatters.formatCurrency(portfolioState.currentValue),
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        const Text(
                          'Total P&L',
                          style: TextStyle(
                            color: Colors.white70,
                            fontSize: 12,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            Icon(
                              portfolioState.totalPnl >= 0
                                  ? LucideIcons.trendingUp
                                  : LucideIcons.trendingDown,
                              color: portfolioState.totalPnl >= 0
                                  ? StockColors.profit
                                  : StockColors.loss,
                              size: 20,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              Formatters.formatCurrency(portfolioState.totalPnl),
                              style: TextStyle(
                                color: portfolioState.totalPnl >= 0
                                    ? StockColors.profit
                                    : StockColors.loss,
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                        Text(
                          Formatters.formatPercent(portfolioState.totalPnlPercent),
                          style: TextStyle(
                            color: portfolioState.totalPnl >= 0
                                ? StockColors.profit
                                : StockColors.loss,
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _buildSummaryItem(
                      'Invested',
                      Formatters.formatCompactCurrency(
                          portfolioState.totalInvestment),
                    ),
                    _buildSummaryItem(
                      "Day's P&L",
                      Formatters.formatCurrency(portfolioState.dayPnl),
                      valueColor: portfolioState.dayPnl >= 0
                          ? StockColors.profit
                          : StockColors.loss,
                    ),
                    _buildSummaryItem(
                      'Holdings',
                      '${portfolioState.holdings.length}',
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Tab content
          Expanded(
            child: portfolioState.isLoading
                ? const Center(child: CircularProgressIndicator())
                : TabBarView(
                    controller: _tabController,
                    children: [
                      _buildHoldingsTab(portfolioState),
                      _buildPositionsTab(portfolioState),
                    ],
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryItem(String label, String value, {Color? valueColor}) {
    return Column(
      children: [
        Text(
          label,
          style: const TextStyle(
            color: Colors.white70,
            fontSize: 12,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: TextStyle(
            color: valueColor ?? Colors.white,
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }

  Widget _buildHoldingsTab(PortfolioState portfolioState) {
    if (portfolioState.holdings.isEmpty) {
      return _buildEmptyState(
        icon: LucideIcons.briefcase,
        title: 'No holdings yet',
        subtitle: 'Your holdings will appear here once you start investing',
      );
    }

    return RefreshIndicator(
      onRefresh: () => ref.read(portfolioProvider.notifier).refresh(),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: portfolioState.holdings.length,
        itemBuilder: (context, index) {
          final holding = portfolioState.holdings[index];
          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: HoldingCard(holding: holding),
          );
        },
      ),
    );
  }

  Widget _buildPositionsTab(PortfolioState portfolioState) {
    if (portfolioState.positions.isEmpty) {
      return _buildEmptyState(
        icon: LucideIcons.activity,
        title: 'No positions',
        subtitle: 'Your intraday positions will appear here',
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: portfolioState.positions.length,
      itemBuilder: (context, index) {
        final position = portfolioState.positions[index];
        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          child: ListTile(
            title: Text(position.symbol ?? ''),
            subtitle: Text(position.productType ?? ''),
            trailing: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  Formatters.formatCurrency(position.pnl),
                  style: TextStyle(
                    color: StockColors.getPnlColor(position.pnl ?? 0),
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  'Qty: ${position.quantity}',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildEmptyState({
    required IconData icon,
    required String title,
    required String subtitle,
  }) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 64, color: Colors.grey.shade400),
          const SizedBox(height: 16),
          Text(
            title,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: Colors.grey,
                ),
          ),
          const SizedBox(height: 8),
          Text(
            subtitle,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Colors.grey,
                ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}
