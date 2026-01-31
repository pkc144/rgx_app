import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Stock Advices Section matching React Native StockAdvices component
class StockAdvicesSection extends ConsumerWidget {
  final String type;

  const StockAdvicesSection({
    super.key,
    required this.type,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // TODO: Replace with actual stock advices from provider
    final List<Map<String, dynamic>> stockAdvices = [
      {
        'symbol': 'RELIANCE',
        'type': 'BUY',
        'exchange': 'NSE',
        'price': 2450.50,
        'quantity': 10,
        'orderType': 'MARKET',
        'advisedRangeLower': 2400.0,
        'advisedRangeHigher': 2500.0,
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
      },
    ];

    if (type == 'home') {
      // Show horizontal carousel for home
      return _buildHomeSection(context, stockAdvices);
    } else {
      // Show full list for All tab
      return _buildFullList(context, stockAdvices);
    }
  }

  Widget _buildHomeSection(BuildContext context, List<Map<String, dynamic>> stocks) {
    if (stocks.isEmpty) {
      return const SizedBox.shrink();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Section Header
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Bespoke Recommendations',
                    style: TextStyle(
                      fontSize: 20,
                      fontFamily: 'Satoshi',
                      fontWeight: FontWeight.w500,
                      color: Colors.black,
                    ),
                  ),
                ],
              ),
              GestureDetector(
                onTap: () {
                  // TODO: Navigate to see all
                },
                child: const Text(
                  'See All',
                  style: TextStyle(
                    fontSize: 14,
                    fontFamily: 'Satoshi',
                    color: Color(0xFF4B8CEE),
                  ),
                ),
              ),
            ],
          ),
        ),

        // Horizontal carousel
        SizedBox(
          height: 200,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 12),
            itemCount: stocks.length,
            itemBuilder: (context, index) {
              final stock = stocks[index];
              return _buildStockCard(context, stock);
            },
          ),
        ),
      ],
    );
  }

  Widget _buildFullList(BuildContext context, List<Map<String, dynamic>> stocks) {
    if (stocks.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.inventory_2_outlined,
              size: 64,
              color: Colors.grey.shade400,
            ),
            const SizedBox(height: 16),
            const Text(
              'No Advices Found!',
              style: TextStyle(
                fontFamily: 'Poppins',
                fontWeight: FontWeight.w500,
                color: Colors.grey,
              ),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: stocks.length,
      itemBuilder: (context, index) {
        final stock = stocks[index];
        return Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: _buildStockCard(context, stock, isFullWidth: true),
        );
      },
    );
  }

  Widget _buildStockCard(BuildContext context, Map<String, dynamic> stock, {bool isFullWidth = false}) {
    final isBuy = stock['type'] == 'BUY';
    final cardWidth = isFullWidth ? double.infinity : MediaQuery.of(context).size.width * 0.86;

    return Container(
      width: cardWidth,
      margin: isFullWidth ? EdgeInsets.zero : const EdgeInsets.symmetric(horizontal: 4),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
        border: Border.all(
          color: const Color(0xFFE6E6E6),
          width: 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header row with symbol and type badge
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                stock['symbol'],
                style: const TextStyle(
                  fontSize: 18,
                  fontFamily: 'Poppins',
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF1A1A1A),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(
                  color: isBuy ? const Color(0xFF29A400) : const Color(0xFFE53935),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  stock['type'],
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontFamily: 'Poppins',
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            '${stock['exchange']} | ${stock['orderType']}',
            style: const TextStyle(
              fontSize: 12,
              fontFamily: 'Satoshi',
              fontWeight: FontWeight.bold,
              color: Colors.grey,
            ),
          ),
          const SizedBox(height: 12),

          // Price info
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Advised Range',
                    style: TextStyle(
                      fontSize: 11,
                      fontFamily: 'Satoshi',
                      color: Colors.grey,
                    ),
                  ),
                  Text(
                    '₹${stock['advisedRangeLower']} - ₹${stock['advisedRangeHigher']}',
                    style: const TextStyle(
                      fontSize: 14,
                      fontFamily: 'Poppins',
                      fontWeight: FontWeight.w500,
                      color: Colors.black,
                    ),
                  ),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  const Text(
                    'Quantity',
                    style: TextStyle(
                      fontSize: 11,
                      fontFamily: 'Satoshi',
                      color: Colors.grey,
                    ),
                  ),
                  Text(
                    '${stock['quantity']}',
                    style: const TextStyle(
                      fontSize: 14,
                      fontFamily: 'Poppins',
                      fontWeight: FontWeight.w500,
                      color: Colors.black,
                    ),
                  ),
                ],
              ),
            ],
          ),
          const Spacer(),

          // Action buttons
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () {
                    // TODO: Add to cart
                  },
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: Color(0xFF002A5C)),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                  child: const Text(
                    'Add to Cart',
                    style: TextStyle(
                      color: Color(0xFF002A5C),
                      fontFamily: 'Poppins',
                      fontSize: 12,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: ElevatedButton(
                  onPressed: () {
                    // TODO: Trade now
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF29A400),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                  child: const Text(
                    'Trade Now',
                    style: TextStyle(
                      color: Colors.white,
                      fontFamily: 'Poppins',
                      fontSize: 12,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
