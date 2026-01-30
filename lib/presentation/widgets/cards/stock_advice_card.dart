import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

/// Stock advice card matching React Native StockCard design
class StockAdviceCard extends StatelessWidget {
  final String symbol;
  final String type; // BUY or SELL
  final String exchange;
  final double price;
  final int quantity;
  final String orderType; // MARKET or LIMIT
  final double? advisedRangeLower;
  final double? advisedRangeHigher;
  final double? stopLoss;
  final double? profitTarget;
  final DateTime date;
  final double? currentPrice;
  final bool isSelected;
  final bool isCancelled;
  final bool isEdited;
  final VoidCallback? onAddToCart;
  final VoidCallback? onTradeNow;
  final VoidCallback? onTap;

  const StockAdviceCard({
    super.key,
    required this.symbol,
    required this.type,
    this.exchange = 'NSE',
    required this.price,
    this.quantity = 1,
    this.orderType = 'MARKET',
    this.advisedRangeLower,
    this.advisedRangeHigher,
    this.stopLoss,
    this.profitTarget,
    required this.date,
    this.currentPrice,
    this.isSelected = false,
    this.isCancelled = false,
    this.isEdited = false,
    this.onAddToCart,
    this.onTradeNow,
    this.onTap,
  });

  bool get isBuy => type.toUpperCase() == 'BUY';

  String _formatCurrency(double value) {
    return NumberFormat.currency(
      locale: 'en_IN',
      symbol: '₹',
      decimalDigits: 2,
    ).format(value);
  }

  String _getRecommendedRange() {
    if (advisedRangeLower != null && advisedRangeHigher != null) {
      return '₹$advisedRangeLower - ₹$advisedRangeHigher';
    } else if (advisedRangeLower != null) {
      return '₹$advisedRangeLower';
    } else if (advisedRangeHigher != null) {
      return '₹$advisedRangeHigher';
    }
    return 'NA - use other details';
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: isCancelled
              ? Border.all(color: Colors.red.shade300, width: 1.5)
              : isEdited
                  ? Border.all(color: Colors.orange.shade300, width: 1.5)
                  : null,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.08),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Stack(
          children: [
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header: Symbol + Action Badge
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          symbol,
                          style: const TextStyle(
                            fontFamily: 'Satoshi',
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF212121),
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      _buildActionBadge(),
                    ],
                  ),

                  const SizedBox(height: 4),

                  // Current Price / LTP
                  Text(
                    currentPrice != null
                        ? _formatCurrency(currentPrice!)
                        : _formatCurrency(price),
                    style: const TextStyle(
                      fontFamily: 'Satoshi',
                      fontSize: 22,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF424242),
                    ),
                  ),

                  const SizedBox(height: 12),

                  // Order Type and Recommended Range Row
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      // Left: Order Type with Price
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '$type AT $orderType PRICE',
                            style: const TextStyle(
                              fontFamily: 'Satoshi',
                              fontSize: 11,
                              fontWeight: FontWeight.w500,
                              color: Color(0xFF9E9E9E),
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            orderType == 'LIMIT'
                                ? _formatCurrency(price)
                                : 'MARKET',
                            style: const TextStyle(
                              fontFamily: 'Satoshi',
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFF424242),
                            ),
                          ),
                        ],
                      ),
                      // Right: Recommended Range
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          const Text(
                            'Recommended Range',
                            style: TextStyle(
                              fontFamily: 'Satoshi',
                              fontSize: 11,
                              fontWeight: FontWeight.w500,
                              color: Color(0xFF9E9E9E),
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            _getRecommendedRange(),
                            style: const TextStyle(
                              fontFamily: 'Satoshi',
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFF424242),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),

                  const SizedBox(height: 12),

                  // SL/PT Row
                  if (stopLoss != null || profitTarget != null)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: Row(
                        children: [
                          if (stopLoss != null) ...[
                            const Text(
                              'SL ',
                              style: TextStyle(
                                fontFamily: 'Satoshi',
                                fontSize: 12,
                                color: Color(0xFFE53935),
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                            Text(
                              _formatCurrency(stopLoss!),
                              style: const TextStyle(
                                fontFamily: 'Satoshi',
                                fontSize: 12,
                                color: Color(0xFF424242),
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                          if (stopLoss != null && profitTarget != null)
                            const SizedBox(width: 16),
                          if (profitTarget != null) ...[
                            const Text(
                              'PT ',
                              style: TextStyle(
                                fontFamily: 'Satoshi',
                                fontSize: 12,
                                color: Color(0xFF4CAF50),
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                            Text(
                              _formatCurrency(profitTarget!),
                              style: const TextStyle(
                                fontFamily: 'Satoshi',
                                fontSize: 12,
                                color: Color(0xFF424242),
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),

                  // Date/Time
                  Text(
                    '${DateFormat('do MMM yyyy').format(date)} | ${DateFormat('h:mm a').format(date)}',
                    style: const TextStyle(
                      fontFamily: 'Satoshi',
                      fontSize: 11,
                      color: Color(0xFF9E9E9E),
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Action Buttons
                  if (!isCancelled)
                    Row(
                      children: [
                        // Add to Cart Button
                        Expanded(
                          child: OutlinedButton(
                            onPressed: onAddToCart,
                            style: OutlinedButton.styleFrom(
                              backgroundColor:
                                  isSelected ? const Color(0xFF424242) : Colors.white,
                              side: BorderSide(
                                color: isSelected
                                    ? const Color(0xFF424242)
                                    : const Color(0xFFE0E0E0),
                              ),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8),
                              ),
                              padding: const EdgeInsets.symmetric(vertical: 12),
                            ),
                            child: Text(
                              isSelected ? 'Remove' : 'Add to Cart',
                              style: TextStyle(
                                fontFamily: 'Satoshi',
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: isSelected
                                    ? Colors.white
                                    : const Color(0xFF424242),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        // Trade Now Button
                        Expanded(
                          child: ElevatedButton(
                            onPressed: onTradeNow,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: isBuy
                                  ? const Color(0xFF4CAF50)
                                  : const Color(0xFFE53935),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8),
                              ),
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              elevation: 0,
                            ),
                            child: const Text(
                              'Trade Now',
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
                    )
                  else
                    // Cancelled state
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      decoration: BoxDecoration(
                        color: Colors.grey.shade200,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Text(
                        'Cancelled',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontFamily: 'Satoshi',
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF757575),
                        ),
                      ),
                    ),
                ],
              ),
            ),

            // Status Badge (Cancelled/Edited)
            if (isCancelled || isEdited)
              Positioned(
                top: 8,
                right: 8,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: isCancelled ? Colors.red : Colors.orange,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    isCancelled ? 'CANCELLED' : 'EDITED',
                    style: const TextStyle(
                      fontFamily: 'Satoshi',
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionBadge() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: isBuy
            ? const Color(0xFF4CAF50).withOpacity(0.15)
            : const Color(0xFFE53935).withOpacity(0.15),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        type.toUpperCase(),
        style: TextStyle(
          fontFamily: 'Satoshi',
          fontSize: 12,
          fontWeight: FontWeight.bold,
          color: isBuy ? const Color(0xFF4CAF50) : const Color(0xFFE53935),
        ),
      ),
    );
  }
}
