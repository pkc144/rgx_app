import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';

/// Knowledge Hub section matching React Native design
class KnowledgeHubSection extends StatelessWidget {
  final String type;

  const KnowledgeHubSection({
    super.key,
    this.type = 'home',
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Section Header
        const Padding(
          padding: EdgeInsets.fromLTRB(16, 8, 16, 12),
          child: Text(
            'Knowledge Hub',
            style: TextStyle(
              fontFamily: 'Satoshi',
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Color(0xFF212121),
            ),
          ),
        ),

        // Grid of knowledge items
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          child: Row(
            children: [
              Expanded(
                child: _buildKnowledgeCard(
                  context,
                  icon: LucideIcons.bookOpen,
                  title: 'Blogs',
                  subtitle: 'Latest articles',
                  color: const Color(0xFF4CAF50),
                  onTap: () {
                    // TODO: Navigate to blogs
                  },
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildKnowledgeCard(
                  context,
                  icon: LucideIcons.video,
                  title: 'Videos',
                  subtitle: 'Educational content',
                  color: const Color(0xFFE53935),
                  onTap: () {
                    // TODO: Navigate to videos
                  },
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 12),

        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          child: Row(
            children: [
              Expanded(
                child: _buildKnowledgeCard(
                  context,
                  icon: LucideIcons.fileText,
                  title: 'PDFs',
                  subtitle: 'Research reports',
                  color: const Color(0xFF0056B7),
                  onTap: () {
                    // TODO: Navigate to PDFs
                  },
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildKnowledgeCard(
                  context,
                  icon: LucideIcons.trendingUp,
                  title: 'Market News',
                  subtitle: 'Stay updated',
                  color: const Color(0xFFFF9800),
                  onTap: () {
                    // TODO: Navigate to news
                  },
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildKnowledgeCard(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String subtitle,
    required Color color,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(
                icon,
                color: color,
                size: 22,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontFamily: 'Satoshi',
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF212121),
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: const TextStyle(
                      fontFamily: 'Satoshi',
                      fontSize: 11,
                      color: Color(0xFF9E9E9E),
                    ),
                  ),
                ],
              ),
            ),
            Icon(
              LucideIcons.chevronRight,
              size: 18,
              color: Colors.grey.shade400,
            ),
          ],
        ),
      ),
    );
  }
}
