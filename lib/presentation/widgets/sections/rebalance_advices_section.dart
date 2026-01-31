import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Rebalance Advices Section matching React Native RebalanceAdvices component
class RebalanceAdvicesSection extends ConsumerWidget {
  final String type;

  const RebalanceAdvicesSection({
    super.key,
    required this.type,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // TODO: Replace with actual rebalance advices from provider
    final List<Map<String, dynamic>> rebalanceAdvices = [];

    if (rebalanceAdvices.isEmpty) {
      if (type == 'home') {
        return const SizedBox.shrink();
      }
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.sync_outlined,
              size: 64,
              color: Colors.grey.shade400,
            ),
            const SizedBox(height: 16),
            const Text(
              'No Rebalance Advices Found!',
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

    if (type == 'home') {
      return _buildHomeSection(context, rebalanceAdvices);
    } else {
      return _buildFullList(context, rebalanceAdvices);
    }
  }

  Widget _buildHomeSection(BuildContext context, List<Map<String, dynamic>> advices) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Rebalance Recommendations',
                style: TextStyle(
                  fontSize: 20,
                  fontFamily: 'Satoshi',
                  fontWeight: FontWeight.w500,
                  color: Colors.black,
                ),
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
        SizedBox(
          height: 150,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 12),
            itemCount: advices.length,
            itemBuilder: (context, index) {
              return _buildRebalanceCard(context, advices[index]);
            },
          ),
        ),
      ],
    );
  }

  Widget _buildFullList(BuildContext context, List<Map<String, dynamic>> advices) {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: advices.length,
      itemBuilder: (context, index) {
        return Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: _buildRebalanceCard(context, advices[index], isFullWidth: true),
        );
      },
    );
  }

  Widget _buildRebalanceCard(BuildContext context, Map<String, dynamic> advice, {bool isFullWidth = false}) {
    final cardWidth = isFullWidth ? double.infinity : MediaQuery.of(context).size.width * 0.8;

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
      child: const Center(
        child: Text(
          'Rebalance Card',
          style: TextStyle(
            fontFamily: 'Poppins',
            fontSize: 14,
          ),
        ),
      ),
    );
  }
}
