import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../providers/config_provider.dart';
import '../../providers/portfolio_provider.dart';
import '../../widgets/cards/stock_advice_card.dart';
import '../../widgets/cards/model_portfolio_card.dart';
import '../../widgets/sections/knowledge_hub_section.dart';

/// Home screen matching the React Native design
class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  bool _isRefreshing = false;
  bool _seeAllBespoke = false;
  bool _seeAllMP = false;

  // Mock data - replace with actual providers
  final List<Map<String, dynamic>> _stockRecommendations = [
    {
      'symbol': 'RELIANCE',
      'type': 'BUY',
      'exchange': 'NSE',
      'price': 2450.50,
      'quantity': 10,
      'orderType': 'MARKET',
      'advisedRangeLower': 2400.0,
      'advisedRangeHigher': 2500.0,
      'stopLoss': 2350.0,
      'profitTarget': 2650.0,
      'date': DateTime.now(),
      'tradeId': '1',
    },
    {
      'symbol': 'TCS',
      'type': 'BUY',
      'exchange': 'NSE',
      'price': 3850.00,
      'quantity': 5,
      'orderType': 'LIMIT',
      'advisedRangeLower': 3800.0,
      'advisedRangeHigher': 3900.0,
      'stopLoss': 3750.0,
      'profitTarget': 4100.0,
      'date': DateTime.now().subtract(const Duration(hours: 2)),
      'tradeId': '2',
    },
    {
      'symbol': 'INFY',
      'type': 'SELL',
      'exchange': 'NSE',
      'price': 1520.00,
      'quantity': 15,
      'orderType': 'MARKET',
      'advisedRangeLower': 1500.0,
      'advisedRangeHigher': 1550.0,
      'stopLoss': 1580.0,
      'profitTarget': 1420.0,
      'date': DateTime.now().subtract(const Duration(hours: 5)),
      'tradeId': '3',
    },
  ];

  final List<Map<String, dynamic>> _modelPortfolios = [
    {
      'name': 'Growth Portfolio',
      'description': 'High growth stocks for long-term wealth creation',
      'cagr': 24.5,
      'minInvestment': 50000,
      'riskLevel': 'AGGRESSIVE',
      'stockCount': 12,
    },
    {
      'name': 'Value Portfolio',
      'description': 'Undervalued stocks with strong fundamentals',
      'cagr': 18.2,
      'minInvestment': 25000,
      'riskLevel': 'MODERATE',
      'stockCount': 8,
    },
    {
      'name': 'Dividend Portfolio',
      'description': 'Consistent dividend paying stocks',
      'cagr': 12.8,
      'minInvestment': 100000,
      'riskLevel': 'CONSERVATIVE',
      'stockCount': 15,
    },
  ];

  Future<void> _onRefresh() async {
    setState(() => _isRefreshing = true);
    // TODO: Refresh data from providers
    await Future.delayed(const Duration(seconds: 1));
    setState(() => _isRefreshing = false);
  }

  @override
  Widget build(BuildContext context) {
    final config = ref.watch(appConfigProvider);

    // If viewing all bespoke recommendations
    if (_seeAllBespoke) {
      return _buildSeeAllScreen(
        title: 'Recommendations',
        onBack: () => setState(() => _seeAllBespoke = false),
        child: _buildAllRecommendations(),
      );
    }

    // If viewing all model portfolios
    if (_seeAllMP) {
      return _buildSeeAllScreen(
        title: 'Model Portfolios',
        onBack: () => setState(() => _seeAllMP = false),
        child: _buildAllModelPortfolios(),
      );
    }

    // Main home screen
    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _onRefresh,
          color: config.primaryColor,
          child: CustomScrollView(
            slivers: [
              // Model Portfolios Section
              SliverToBoxAdapter(
                child: _buildSectionHeader(
                  title: 'Model Portfolios',
                  subtitle: 'Ranked based on user feedbacks',
                  onViewAll: () => setState(() => _seeAllMP = true),
                ),
              ),
              SliverToBoxAdapter(
                child: _buildModelPortfoliosCarousel(),
              ),

              // Stock Recommendations Section
              SliverToBoxAdapter(
                child: _buildSectionHeader(
                  title: 'Recommendations',
                  subtitle: 'Bespoke Active Recommendations',
                  onViewAll: () => setState(() => _seeAllBespoke = true),
                ),
              ),
              SliverToBoxAdapter(
                child: _buildRecommendationsCarousel(),
              ),

              // Knowledge Hub Section
              const SliverToBoxAdapter(
                child: Padding(
                  padding: EdgeInsets.only(top: 16),
                  child: KnowledgeHubSection(),
                ),
              ),

              // Bottom padding
              const SliverToBoxAdapter(
                child: SizedBox(height: 100),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSectionHeader({
    required String title,
    required String subtitle,
    required VoidCallback onViewAll,
  }) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontFamily: 'Satoshi',
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF212121),
                ),
              ),
              const SizedBox(height: 2),
              Text(
                subtitle,
                style: const TextStyle(
                  fontFamily: 'Satoshi',
                  fontSize: 12,
                  color: Color(0xFF757575),
                ),
              ),
            ],
          ),
          TextButton(
            onPressed: onViewAll,
            style: TextButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              backgroundColor: const Color(0xFFF0F0F0),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
            ),
            child: const Text(
              'View All',
              style: TextStyle(
                fontFamily: 'Satoshi',
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: Color(0xFF424242),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildModelPortfoliosCarousel() {
    return SizedBox(
      height: 180,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 12),
        itemCount: _modelPortfolios.length,
        itemBuilder: (context, index) {
          final portfolio = _modelPortfolios[index];
          return Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4),
            child: ModelPortfolioCard(
              name: portfolio['name'],
              description: portfolio['description'],
              cagr: portfolio['cagr'],
              minInvestment: portfolio['minInvestment'].toDouble(),
              riskLevel: portfolio['riskLevel'],
              stockCount: portfolio['stockCount'],
              onTap: () {
                // TODO: Navigate to portfolio details
              },
            ),
          );
        },
      ),
    );
  }

  Widget _buildRecommendationsCarousel() {
    return SizedBox(
      height: 280,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 12),
        itemCount: _stockRecommendations.length,
        itemBuilder: (context, index) {
          final stock = _stockRecommendations[index];
          return Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4),
            child: SizedBox(
              width: MediaQuery.of(context).size.width * 0.85,
              child: StockAdviceCard(
                symbol: stock['symbol'],
                type: stock['type'],
                exchange: stock['exchange'],
                price: stock['price'],
                quantity: stock['quantity'],
                orderType: stock['orderType'],
                advisedRangeLower: stock['advisedRangeLower'],
                advisedRangeHigher: stock['advisedRangeHigher'],
                stopLoss: stock['stopLoss'],
                profitTarget: stock['profitTarget'],
                date: stock['date'],
                onAddToCart: () {
                  // TODO: Add to cart
                },
                onTradeNow: () {
                  // TODO: Trade now
                },
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildSeeAllScreen({
    required String title,
    required VoidCallback onBack,
    required Widget child,
  }) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowLeft, color: Colors.black),
          onPressed: onBack,
        ),
        title: Text(
          title,
          style: const TextStyle(
            fontFamily: 'Satoshi',
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: Color(0xFF212121),
          ),
        ),
      ),
      body: child,
    );
  }

  Widget _buildAllRecommendations() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _stockRecommendations.length,
      itemBuilder: (context, index) {
        final stock = _stockRecommendations[index];
        return Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: StockAdviceCard(
            symbol: stock['symbol'],
            type: stock['type'],
            exchange: stock['exchange'],
            price: stock['price'],
            quantity: stock['quantity'],
            orderType: stock['orderType'],
            advisedRangeLower: stock['advisedRangeLower'],
            advisedRangeHigher: stock['advisedRangeHigher'],
            stopLoss: stock['stopLoss'],
            profitTarget: stock['profitTarget'],
            date: stock['date'],
            onAddToCart: () {},
            onTradeNow: () {},
          ),
        );
      },
    );
  }

  Widget _buildAllModelPortfolios() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _modelPortfolios.length,
      itemBuilder: (context, index) {
        final portfolio = _modelPortfolios[index];
        return Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: ModelPortfolioCard(
            name: portfolio['name'],
            description: portfolio['description'],
            cagr: portfolio['cagr'],
            minInvestment: portfolio['minInvestment'].toDouble(),
            riskLevel: portfolio['riskLevel'],
            stockCount: portfolio['stockCount'],
            isHorizontal: false,
            onTap: () {},
          ),
        );
      },
    );
  }
}
