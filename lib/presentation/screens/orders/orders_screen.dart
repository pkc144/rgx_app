import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../providers/config_provider.dart';

/// Orders screen matching React Native design
class OrdersScreen extends ConsumerStatefulWidget {
  const OrdersScreen({super.key});

  @override
  ConsumerState<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends ConsumerState<OrdersScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  int _selectedIndex = 0;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _tabController.addListener(() {
      setState(() {
        _selectedIndex = _tabController.index;
      });
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final config = ref.watch(appConfigProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFEFF0EE),
      body: Column(
        children: [
          // Custom Tab Bar matching RN design
          Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  config.primaryColor,
                  config.secondaryColor,
                ],
              ),
              borderRadius: const BorderRadius.only(
                bottomLeft: Radius.circular(20),
                bottomRight: Radius.circular(20),
              ),
            ),
            child: SafeArea(
              bottom: false,
              child: Column(
                children: [
                  // Tab buttons
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                    child: Row(
                      children: [
                        Expanded(
                          child: _buildTabButton(
                            title: 'Orders Placed',
                            isSelected: _selectedIndex == 0,
                            isLeft: true,
                            onTap: () => _tabController.animateTo(0),
                          ),
                        ),
                        Expanded(
                          child: _buildTabButton(
                            title: 'Rejected Orders',
                            isSelected: _selectedIndex == 1,
                            isLeft: false,
                            onTap: () => _tabController.animateTo(1),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Tab content
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _buildPlacedOrdersList(),
                _buildRejectedOrdersList(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTabButton({
    required String title,
    required bool isSelected,
    required bool isLeft,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 44,
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF2CA327) : Colors.white,
          border: Border.all(
            color: isSelected ? const Color(0xFF2CA327) : const Color(0xFFE6E6E6),
          ),
          borderRadius: BorderRadius.horizontal(
            left: isLeft ? const Radius.circular(4) : Radius.zero,
            right: isLeft ? Radius.zero : const Radius.circular(4),
          ),
        ),
        child: Center(
          child: Text(
            title,
            style: TextStyle(
              color: isSelected ? Colors.white : const Color(0xFF212121),
              fontSize: 16,
              fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
              fontFamily: 'Satoshi',
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildPlacedOrdersList() {
    // TODO: Implement with actual order data from provider
    return _buildEmptyState(
      icon: LucideIcons.shoppingCart,
      title: 'No orders placed',
      subtitle: 'Your placed orders will appear here',
    );
  }

  Widget _buildRejectedOrdersList() {
    // TODO: Implement with actual rejected orders data from provider
    return _buildEmptyState(
      icon: LucideIcons.alertCircle,
      title: 'No rejected orders',
      subtitle: 'Rejected orders from the last 7 days will appear here',
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
          Icon(
            icon,
            size: 64,
            color: Colors.grey.shade400,
          ),
          const SizedBox(height: 16),
          Text(
            title,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: Color(0xFF424242),
              fontFamily: 'Satoshi',
            ),
          ),
          const SizedBox(height: 8),
          Text(
            subtitle,
            style: const TextStyle(
              fontSize: 14,
              color: Color(0xFF9E9E9E),
              fontFamily: 'Satoshi',
            ),
          ),
        ],
      ),
    );
  }
}
