import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Educational PDF Section matching React Native EducationalPDF component
class EducationalPdfSection extends ConsumerWidget {
  final bool showAll;

  const EducationalPdfSection({
    super.key,
    this.showAll = false,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // TODO: Replace with actual PDFs from provider
    final List<Map<String, dynamic>> pdfs = [];

    if (pdfs.isEmpty) {
      if (showAll) {
        return Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.picture_as_pdf_outlined,
                size: 64,
                color: Colors.grey.shade400,
              ),
              const SizedBox(height: 16),
              const Text(
                'No PDFs Found!',
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
      return const SizedBox.shrink();
    }

    if (showAll) {
      return _buildFullList(context, pdfs);
    }

    return _buildHomeSection(context, pdfs);
  }

  Widget _buildHomeSection(BuildContext context, List<Map<String, dynamic>> pdfs) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Research Reports',
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
            itemCount: pdfs.length,
            itemBuilder: (context, index) {
              return _buildPdfCard(context, pdfs[index]);
            },
          ),
        ),
      ],
    );
  }

  Widget _buildFullList(BuildContext context, List<Map<String, dynamic>> pdfs) {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: pdfs.length,
      itemBuilder: (context, index) {
        return Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: _buildPdfCard(context, pdfs[index], isFullWidth: true),
        );
      },
    );
  }

  Widget _buildPdfCard(BuildContext context, Map<String, dynamic> pdf, {bool isFullWidth = false}) {
    final cardWidth = isFullWidth ? double.infinity : MediaQuery.of(context).size.width * 0.6;

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
      child: Row(
        children: [
          Container(
            width: 50,
            height: 50,
            decoration: BoxDecoration(
              color: const Color(0xFFE53935).withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Icon(
              Icons.picture_as_pdf,
              color: Color(0xFFE53935),
              size: 30,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  pdf['title'] ?? 'PDF Title',
                  style: const TextStyle(
                    fontSize: 14,
                    fontFamily: 'Poppins',
                    fontWeight: FontWeight.w600,
                    color: Colors.black,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Text(
                  pdf['date'] ?? '',
                  style: const TextStyle(
                    fontSize: 11,
                    fontFamily: 'Satoshi',
                    color: Colors.grey,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
