import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Best Performers Section matching React Native BestPerformers component
class BestPerformersSection extends ConsumerWidget {
  const BestPerformersSection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // TODO: Replace with actual best performers from provider
    final List<Map<String, dynamic>> performers = [];

    if (performers.isEmpty) {
      return const SizedBox.shrink();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Best Performers',
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
          height: 120,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 12),
            itemCount: performers.length,
            itemBuilder: (context, index) {
              return _buildPerformerCard(context, performers[index]);
            },
          ),
        ),
      ],
    );
  }

  Widget _buildPerformerCard(BuildContext context, Map<String, dynamic> performer) {
    final isPositive = (performer['change'] ?? 0) >= 0;

    return Container(
      width: 150,
      margin: const EdgeInsets.symmetric(horizontal: 4),
      padding: const EdgeInsets.all(12),
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
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            performer['symbol'] ?? '',
            style: const TextStyle(
              fontSize: 16,
              fontFamily: 'Poppins',
              fontWeight: FontWeight.w600,
              color: Colors.black,
            ),
          ),
          Text(
            '₹${performer['price'] ?? 0}',
            style: const TextStyle(
              fontSize: 14,
              fontFamily: 'Poppins',
              fontWeight: FontWeight.w500,
              color: Colors.black,
            ),
          ),
          Row(
            children: [
              Icon(
                isPositive ? Icons.arrow_upward : Icons.arrow_downward,
                size: 14,
                color: isPositive ? const Color(0xFF16A085) : const Color(0xFFEA2D3F),
              ),
              Text(
                '${performer['change'] ?? 0}%',
                style: TextStyle(
                  fontSize: 12,
                  fontFamily: 'Poppins',
                  fontWeight: FontWeight.w500,
                  color: isPositive ? const Color(0xFF16A085) : const Color(0xFFEA2D3F),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
