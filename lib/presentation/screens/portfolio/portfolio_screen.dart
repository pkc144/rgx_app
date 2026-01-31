import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../providers/config_provider.dart';
import '../../providers/portfolio_provider.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/theme/app_theme.dart';
import '../../widgets/cards/holding_card.dart';

/// Portfolio screen - EXACT replica of React Native PortfolioScreen.js
/// Key styles from RN:
/// - container: flex 1, backgroundColor '#fff'
/// - CustomToolbar at top
/// - PortfolioCard showing total values
/// - ButtonSwitch for Bespoke/Model Portfolio tabs
/// - Holdings/Positions tabs inside Bespoke view
class PortfolioScreen extends ConsumerStatefulWidget {
  const PortfolioScreen({super.key});

  @override
  ConsumerState<PortfolioScreen> createState() => _PortfolioScreenState();
}

class _PortfolioScreenState extends ConsumerState<PortfolioScreen>
    with SingleTickerProviderStateMixin {
  int _selectedInnerTab = 0; // 0: Bespoke, 1: Model Portfolio
  int _tabIndex = 0; // 0: Holdings, 1: Positions
  bool _isRefreshing = false;

  Future<void> _onRefresh() async {
    setState(() => _isRefreshing = true);
    await ref.read(portfolioProvider.notifier).refresh();
    setState(() => _isRefreshing = false);
  }

  @override
  Widget build(BuildContext context) {
    final config = ref.watch(appConfigProvider);
    final portfolioState = ref.watch(portfolioProvider);

    return Scaffold(
      // RN: backgroundColor: '#fff'
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Column(
          children: [
            // ========== CUSTOM TOOLBAR ==========
            _buildToolbar(config),

            // ========== MAIN CONTENT ==========
            Expanded(
              child: Column(
                children: [
                  // ========== PORTFOLIO CARD ==========
                  _buildPortfolioCard(portfolioState),

                  // ========== TAB SWITCH (BESPOKE / MODEL PORTFOLIO) ==========
                  _buildMainTabSwitch(),

                  // ========== SUMMARY ROW ==========
                  _buildSummaryRow(portfolioState),

                  // ========== HOLDINGS/POSITIONS TABS (for Bespoke) ==========
                  if (_selectedInnerTab == 0) _buildHoldingsPositionsTabs(portfolioState),

                  // ========== TAB CONTENT ==========
                  Expanded(
                    child: _buildTabContent(portfolioState),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildToolbar(dynamic config) {
    // RN: toolbar backgroundColor: '#FDFDFD', paddingHorizontal: 10, paddingVertical: 10
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
      color: const Color(0xFFFDFDFD),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              GestureDetector(
                onTap: () => Navigator.pop(context),
                child: const Icon(
                  LucideIcons.arrowLeft,
                  color: Color(0xFF002A5C),
                  size: 23,
                ),
              ),
              const SizedBox(width: 10),
              config.logoPath.isNotEmpty
                  ? Image.asset(
                      config.logoPath,
                      width: 128,
                      height: 28,
                      fit: BoxFit.contain,
                      errorBuilder: (_, __, ___) => Text(
                        'Portfolio',
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF002A5C),
                          fontFamily: 'Poppins',
                        ),
                      ),
                    )
                  : const Text(
                      'Portfolio',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF002A5C),
                        fontFamily: 'Poppins',
                      ),
                    ),
            ],
          ),
          GestureDetector(
            onTap: _onRefresh,
            child: const Icon(
              LucideIcons.refreshCw,
              size: 18,
              color: Colors.black,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPortfolioCard(PortfolioState portfolioState) {
    // RN: stickyCard padding: 18, borderRadius: 20, marginHorizontal: 10, backgroundColor: '#C84444'
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 10),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: const Color(0xFF000000),
        borderRadius: BorderRadius.circular(20),
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
                      fontSize: 14,
                      fontFamily: 'Poppins',
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '₹${Formatters.formatCurrency(portfolioState.currentValue)}',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      fontFamily: 'Poppins',
                    ),
                  ),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  const Text(
                    "Today's P&L",
                    style: TextStyle(
                      color: Colors.white70,
                      fontSize: 14,
                      fontFamily: 'Poppins',
                    ),
                  ),
                  const SizedBox(height: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: portfolioState.dayPnl >= 0
                          ? const Color(0xFF73BE4A)
                          : const Color(0xFFcf3a49),
                      borderRadius: BorderRadius.circular(15),
                    ),
                    child: Text(
                      '${portfolioState.dayPnl >= 0 ? '+' : ''}${Formatters.formatPercent(portfolioState.totalPnlPercent)}',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 14,
                        fontFamily: 'Poppins',
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 15),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Total P&L',
                    style: TextStyle(
                      color: Colors.white70,
                      fontSize: 12,
                      fontFamily: 'Poppins',
                    ),
                  ),
                  Text(
                    '₹${Formatters.formatCurrency(portfolioState.totalPnl)}',
                    style: TextStyle(
                      color: portfolioState.totalPnl >= 0
                          ? const Color(0xFF73BE4A)
                          : const Color(0xFFcf3a49),
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      fontFamily: 'Poppins',
                    ),
                  ),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  const Text(
                    'Invested',
                    style: TextStyle(
                      color: Colors.white70,
                      fontSize: 12,
                      fontFamily: 'Poppins',
                    ),
                  ),
                  Text(
                    '₹${Formatters.formatCurrency(portfolioState.totalInvestment)}',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      fontFamily: 'Poppins',
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMainTabSwitch() {
    // RN: ButtonSwitch with Bespoke/Model Portfolio
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 10, vertical: 15),
      height: 55,
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: const Color(0xFFF5F5F5),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: [
          Expanded(
            child: GestureDetector(
              onTap: () => setState(() => _selectedInnerTab = 0),
              child: Container(
                decoration: BoxDecoration(
                  color: _selectedInnerTab == 0 ? Colors.white : Colors.transparent,
                  borderRadius: BorderRadius.circular(6),
                  border: _selectedInnerTab == 0
                      ? Border.all(color: const Color(0xFFE6E6E6))
                      : null,
                ),
                child: Center(
                  child: Text(
                    'Bespoke',
                    style: TextStyle(
                      color: _selectedInnerTab == 0
                          ? const Color(0xFF000000)
                          : const Color(0xFF1D1D1DB2),
                      fontSize: 14,
                      fontFamily: 'Poppins',
                      fontWeight: _selectedInnerTab == 0 ? FontWeight.w500 : FontWeight.w400,
                    ),
                  ),
                ),
              ),
            ),
          ),
          Expanded(
            child: GestureDetector(
              onTap: () => setState(() => _selectedInnerTab = 1),
              child: Container(
                decoration: BoxDecoration(
                  color: _selectedInnerTab == 1 ? Colors.white : Colors.transparent,
                  borderRadius: BorderRadius.circular(6),
                  border: _selectedInnerTab == 1
                      ? Border.all(color: const Color(0xFFE6E6E6))
                      : null,
                ),
                child: Center(
                  child: Text(
                    'Model Portfolio',
                    style: TextStyle(
                      color: _selectedInnerTab == 1
                          ? const Color(0xFF000000)
                          : const Color(0xFF1D1D1DB2),
                      fontSize: 14,
                      fontFamily: 'Poppins',
                      fontWeight: _selectedInnerTab == 1 ? FontWeight.w500 : FontWeight.w400,
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryRow(PortfolioState portfolioState) {
    // RN: flexDirection: 'row', justifyContent: 'space-between', padding: 15
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 15),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                decoration: const BoxDecoration(
                  border: Border(
                    bottom: BorderSide(
                      color: Colors.black,
                      width: 1,
                      style: BorderStyle.solid,
                    ),
                  ),
                ),
                child: Text(
                  '${portfolioState.holdings.length} Stocks',
                  style: const TextStyle(
                    color: Colors.grey,
                    fontFamily: 'Poppins',
                    fontSize: 12,
                  ),
                ),
              ),
              Row(
                children: [
                  Text(
                    '₹${Formatters.formatCompactCurrency(portfolioState.currentValue)}',
                    style: const TextStyle(
                      color: Color(0xFF000000),
                      fontFamily: 'Poppins',
                      fontWeight: FontWeight.w500,
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Text(
                    '${portfolioState.totalPnlPercent >= 0 ? '+' : ''}${portfolioState.totalPnlPercent.toStringAsFixed(0)}%',
                    style: TextStyle(
                      color: portfolioState.totalPnlPercent >= 0
                          ? const Color(0xFF16A085)
                          : const Color(0xFFE6626F),
                      fontFamily: 'Poppins',
                      fontWeight: FontWeight.w500,
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
            ],
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              const Text(
                'Current Value',
                style: TextStyle(
                  color: Colors.grey,
                  fontFamily: 'Poppins',
                  fontSize: 12,
                ),
              ),
              Row(
                children: [
                  Icon(
                    LucideIcons.arrowLeftRight,
                    size: 14,
                    color: const Color(0xFF4C8FF3),
                  ),
                  const SizedBox(width: 4),
                  const Text(
                    'All Time Returns',
                    style: TextStyle(
                      color: Color(0xFF4C8FF3),
                      fontFamily: 'Poppins',
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildHoldingsPositionsTabs(PortfolioState portfolioState) {
    // RN: tabContainer - flexDirection: 'row', justifyContent: 'space-around', borderTopLeftRadius: 20
    return Container(
      margin: const EdgeInsets.only(top: 16),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(20),
          topRight: Radius.circular(20),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black12,
            blurRadius: 2,
            offset: Offset(0, -1),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: GestureDetector(
              onTap: () => setState(() => _tabIndex = 0),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 10),
                decoration: BoxDecoration(
                  border: Border(
                    bottom: BorderSide(
                      color: _tabIndex == 0 ? Colors.black : Colors.transparent,
                      width: 2,
                    ),
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      'Holdings',
                      style: TextStyle(
                        fontSize: 15,
                        color: _tabIndex == 0 ? Colors.black : Colors.grey,
                        fontFamily: 'Poppins',
                        fontWeight: _tabIndex == 0 ? FontWeight.w500 : FontWeight.w400,
                      ),
                    ),
                    if (portfolioState.holdings.isNotEmpty) ...[
                      const SizedBox(width: 5),
                      Container(
                        width: 20,
                        height: 20,
                        decoration: BoxDecoration(
                          color: _tabIndex == 0 ? Colors.red : Colors.grey,
                          shape: BoxShape.circle,
                        ),
                        child: Center(
                          child: Text(
                            '${portfolioState.holdings.length}',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ),
          Expanded(
            child: GestureDetector(
              onTap: () => setState(() => _tabIndex = 1),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 10),
                decoration: BoxDecoration(
                  border: Border(
                    bottom: BorderSide(
                      color: _tabIndex == 1 ? Colors.black : Colors.transparent,
                      width: 2,
                    ),
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      'Positions',
                      style: TextStyle(
                        fontSize: 15,
                        color: _tabIndex == 1 ? Colors.black : Colors.grey,
                        fontFamily: 'Poppins',
                        fontWeight: _tabIndex == 1 ? FontWeight.w500 : FontWeight.w400,
                      ),
                    ),
                    if (portfolioState.positions.isNotEmpty) ...[
                      const SizedBox(width: 5),
                      Container(
                        width: 20,
                        height: 20,
                        decoration: BoxDecoration(
                          color: _tabIndex == 1 ? Colors.red : Colors.grey,
                          shape: BoxShape.circle,
                        ),
                        child: Center(
                          child: Text(
                            '${portfolioState.positions.length}',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTabContent(PortfolioState portfolioState) {
    if (_selectedInnerTab == 1) {
      // Model Portfolio tab
      return _buildModelPortfolioContent();
    }

    // Bespoke tab - Holdings/Positions
    if (_tabIndex == 0) {
      return _buildHoldingsContent(portfolioState);
    } else {
      return _buildPositionsContent(portfolioState);
    }
  }

  Widget _buildHoldingsContent(PortfolioState portfolioState) {
    if (portfolioState.isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (portfolioState.holdings.isEmpty) {
      return _buildEmptyState(
        icon: LucideIcons.candlestickChart,
        title: 'No Holdings Data',
        subtitle: 'Place Orders now to seize opportunities & book profits',
      );
    }

    return RefreshIndicator(
      onRefresh: _onRefresh,
      child: ListView.builder(
        padding: EdgeInsets.zero,
        itemCount: portfolioState.holdings.length,
        itemBuilder: (context, index) {
          final holding = portfolioState.holdings[index];
          return HoldingCard(holding: holding);
        },
      ),
    );
  }

  Widget _buildPositionsContent(PortfolioState portfolioState) {
    if (portfolioState.isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (portfolioState.positions.isEmpty) {
      return _buildEmptyState(
        icon: LucideIcons.candlestickChart,
        title: 'No Portfolio Data',
        subtitle: 'Place Orders now to seize opportunities & book profits',
      );
    }

    return RefreshIndicator(
      onRefresh: _onRefresh,
      child: ListView.builder(
        padding: EdgeInsets.zero,
        itemCount: portfolioState.positions.length,
        itemBuilder: (context, index) {
          final position = portfolioState.positions[index];
          return _buildPositionCard(position);
        },
      ),
    );
  }

  Widget _buildPositionCard(dynamic position) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(
          bottom: BorderSide(color: Color(0xFFEBEBEB), width: 1),
        ),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Text(
                    'Qty. ',
                    style: TextStyle(
                      fontSize: 12,
                      color: Color(0xFFA0A0A0),
                      fontFamily: 'Poppins',
                    ),
                  ),
                  Text(
                    '${position.quantity ?? 0}',
                    style: const TextStyle(
                      fontSize: 14,
                      color: Color(0xFF6791EA),
                      fontFamily: 'Poppins',
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const Text(
                    ' • ',
                    style: TextStyle(
                      color: Colors.black,
                      fontFamily: 'Poppins',
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const Text(
                    'Avg. ',
                    style: TextStyle(
                      fontSize: 12,
                      color: Color(0xFFA0A0A0),
                      fontFamily: 'Poppins',
                    ),
                  ),
                  Text(
                    '₹${position.avgPrice ?? 0}',
                    style: const TextStyle(
                      fontSize: 12,
                      color: Colors.black,
                      fontFamily: 'Poppins',
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: position.type == 'BUY'
                      ? const Color(0xFFF0FFE8)
                      : const Color(0xFFFDEAEC),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  position.type ?? 'BUY',
                  style: TextStyle(
                    color: position.type == 'BUY'
                        ? const Color(0xFF73BE4A)
                        : const Color(0xFFcf3a49),
                    fontSize: 14,
                    fontFamily: 'Poppins',
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 5),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                position.symbol ?? '',
                style: const TextStyle(
                  fontSize: 16,
                  fontFamily: 'Poppins',
                  fontWeight: FontWeight.w500,
                  color: Color(0xFF333333),
                ),
              ),
              Text(
                '${(position.pnl ?? 0) >= 0 ? '+' : ''}₹${(position.pnl ?? 0).toStringAsFixed(2)}',
                style: TextStyle(
                  fontSize: 16,
                  color: (position.pnl ?? 0) >= 0
                      ? const Color(0xFF16A085)
                      : const Color(0xFFE6626F),
                  fontFamily: 'Poppins',
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
          const SizedBox(height: 5),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                position.exchange ?? 'NSE',
                style: const TextStyle(
                  fontSize: 14,
                  color: Color(0xFFA0A0A0),
                  fontFamily: 'Poppins',
                ),
              ),
              Row(
                children: [
                  const Text(
                    'LTP ',
                    style: TextStyle(
                      fontSize: 14,
                      color: Color(0xFFA0A0A0),
                      fontFamily: 'Poppins',
                    ),
                  ),
                  Text(
                    '₹${position.ltp ?? 0}',
                    style: const TextStyle(
                      fontSize: 14,
                      color: Colors.black,
                      fontFamily: 'Poppins',
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildModelPortfolioContent() {
    return _buildEmptyState(
      icon: LucideIcons.candlestickChart,
      title: 'No Model Portfolio',
      subtitle: 'Subscribe to Model Portfolios to see them here',
    );
  }

  Widget _buildEmptyState({
    required IconData icon,
    required String title,
    required String subtitle,
  }) {
    // RN: alignItems: 'center', marginTop: 20
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: const Color(0xFFEBECEF),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, size: 40, color: Colors.black),
          ),
          const SizedBox(height: 10),
          Text(
            title,
            style: const TextStyle(
              fontFamily: 'Poppins',
              fontWeight: FontWeight.w600,
              color: Colors.black,
              fontSize: 18,
            ),
          ),
          const SizedBox(height: 8),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 80),
            child: Text(
              subtitle,
              style: const TextStyle(
                fontFamily: 'Poppins',
                fontWeight: FontWeight.w500,
                color: Colors.grey,
              ),
              textAlign: TextAlign.center,
            ),
          ),
        ],
      ),
    );
  }
}
