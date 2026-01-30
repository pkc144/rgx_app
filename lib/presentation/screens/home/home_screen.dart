import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../providers/auth_provider.dart';
import '../../providers/config_provider.dart';
import '../../providers/portfolio_provider.dart';
import '../../../core/utils/formatters.dart';
import '../../widgets/cards/stock_advice_card.dart';
import '../../widgets/cards/portfolio_summary_card.dart';

/// Home screen with stock advice and portfolio overview
class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final config = ref.watch(appConfigProvider);
    final user = ref.watch(currentUserProvider);
    final portfolioState = ref.watch(portfolioProvider);

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Hello, ${user?.name?.split(' ').first ?? 'User'}',
              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.normal),
            ),
            Text(
              config.appName,
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.bell),
            onPressed: () {
              // TODO: Navigate to notifications
            },
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Advice'),
            Tab(text: 'Watchlist'),
            Tab(text: 'Explore'),
          ],
        ),
      ),
      body: Column(
        children: [
          // Portfolio summary card
          if (portfolioState.holdings.isNotEmpty)
            Padding(
              padding: const EdgeInsets.all(16),
              child: PortfolioSummaryCard(
                totalValue: portfolioState.currentValue,
                totalPnl: portfolioState.totalPnl,
                totalPnlPercent: portfolioState.totalPnlPercent,
                dayPnl: portfolioState.dayPnl,
              ),
            ),

          // Tab content
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _buildAdviceTab(),
                _buildWatchlistTab(),
                _buildExploreTab(),
              ],
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          // TODO: Open advice cart
        },
        icon: const Icon(LucideIcons.shoppingCart),
        label: const Text('Cart'),
        backgroundColor: config.primaryColor,
      ),
    );
  }

  Widget _buildAdviceTab() {
    return RefreshIndicator(
      onRefresh: () async {
        // TODO: Refresh advice
      },
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: 5, // Placeholder count
        itemBuilder: (context, index) {
          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: StockAdviceCard(
              symbol: 'RELIANCE',
              companyName: 'Reliance Industries Ltd.',
              adviceType: index % 2 == 0 ? 'BUY' : 'SELL',
              currentPrice: 2450.50,
              targetPrice: 2650.00,
              stopLoss: 2350.00,
              onTap: () {
                // TODO: Open advice details
              },
              onAddToCart: () {
                // TODO: Add to cart
              },
            ),
          );
        },
      ),
    );
  }

  Widget _buildWatchlistTab() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            LucideIcons.star,
            size: 64,
            color: Colors.grey.shade400,
          ),
          const SizedBox(height: 16),
          Text(
            'Your watchlist is empty',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: Colors.grey,
                ),
          ),
          const SizedBox(height: 8),
          Text(
            'Add stocks to track them here',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Colors.grey,
                ),
          ),
        ],
      ),
    );
  }

  Widget _buildExploreTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _buildExploreSection(
          title: 'Knowledge Hub',
          icon: LucideIcons.bookOpen,
          onTap: () {
            // TODO: Navigate to knowledge hub
          },
        ),
        _buildExploreSection(
          title: 'Latest Blogs',
          icon: LucideIcons.fileText,
          onTap: () {
            // TODO: Navigate to blogs
          },
        ),
        _buildExploreSection(
          title: 'Video Tutorials',
          icon: LucideIcons.playCircle,
          onTap: () {
            // TODO: Navigate to videos
          },
        ),
        _buildExploreSection(
          title: 'Market Analysis',
          icon: LucideIcons.trendingUp,
          onTap: () {
            // TODO: Navigate to analysis
          },
        ),
      ],
    );
  }

  Widget _buildExploreSection({
    required String title,
    required IconData icon,
    required VoidCallback onTap,
  }) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: Icon(icon),
        title: Text(title),
        trailing: const Icon(LucideIcons.chevronRight),
        onTap: onTap,
      ),
    );
  }
}
