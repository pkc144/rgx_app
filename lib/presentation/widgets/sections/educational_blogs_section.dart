import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Educational Blogs Section matching React Native EducationalBlogs component
class EducationalBlogsSection extends ConsumerWidget {
  final bool showAll;

  const EducationalBlogsSection({
    super.key,
    this.showAll = false,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // TODO: Replace with actual blogs from provider
    final List<Map<String, dynamic>> blogs = [
      {
        'title': 'Understanding Market Trends',
        'description': 'Learn how to analyze market trends effectively',
        'image': '',
        'date': '2024-01-15',
      },
      {
        'title': 'Investment Strategies for 2024',
        'description': 'Top strategies to maximize your returns',
        'image': '',
        'date': '2024-01-10',
      },
    ];

    if (blogs.isEmpty) {
      return const SizedBox.shrink();
    }

    if (showAll) {
      return _buildFullList(context, blogs);
    }

    return _buildHomeSection(context, blogs);
  }

  Widget _buildHomeSection(BuildContext context, List<Map<String, dynamic>> blogs) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Educational Blogs',
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
          height: 180,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 12),
            itemCount: blogs.length,
            itemBuilder: (context, index) {
              return _buildBlogCard(context, blogs[index]);
            },
          ),
        ),
      ],
    );
  }

  Widget _buildFullList(BuildContext context, List<Map<String, dynamic>> blogs) {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: blogs.length,
      itemBuilder: (context, index) {
        return Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: _buildBlogCard(context, blogs[index], isFullWidth: true),
        );
      },
    );
  }

  Widget _buildBlogCard(BuildContext context, Map<String, dynamic> blog, {bool isFullWidth = false}) {
    final cardWidth = isFullWidth ? double.infinity : MediaQuery.of(context).size.width * 0.7;

    return Container(
      width: cardWidth,
      margin: isFullWidth ? EdgeInsets.zero : const EdgeInsets.symmetric(horizontal: 4),
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
          Container(
            height: 100,
            decoration: BoxDecoration(
              color: const Color(0xFFF5F5F5),
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(12),
                topRight: Radius.circular(12),
              ),
            ),
            child: const Center(
              child: Icon(
                Icons.article_outlined,
                size: 40,
                color: Colors.grey,
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  blog['title'],
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
                  blog['date'],
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
