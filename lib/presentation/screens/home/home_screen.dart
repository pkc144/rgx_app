import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../providers/config_provider.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/sections/stock_advices_section.dart';
import '../../widgets/sections/rebalance_advices_section.dart';
import '../../widgets/sections/educational_blogs_section.dart';
import '../../widgets/sections/educational_videos_section.dart';
import '../../widgets/sections/educational_pdf_section.dart';
import '../../widgets/sections/best_performers_section.dart';

/// Home screen matching the React Native design exactly
class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  bool _isRefreshing = false;
  bool _isSearchActive = false;
  String _selectedTab = 'All';

  final List<String> _tabs = ['All', 'Bespoke', 'Rebalance', 'Blogs', 'Videos', 'PDF'];

  Future<void> _onRefresh() async {
    setState(() => _isRefreshing = true);
    await Future.delayed(const Duration(seconds: 1));
    setState(() => _isRefreshing = false);
  }

  @override
  Widget build(BuildContext context) {
    final config = ref.watch(appConfigProvider);
    final user = ref.watch(currentUserProvider);

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Column(
          children: [
            // Custom Toolbar - matching RN exactly
            _buildToolbar(config, user),

            // Search and Coin Section
            _buildSearchSection(),

            // Tab Navigation
            _buildTabNavigation(),

            // Tab Content
            Expanded(
              child: _buildTabContent(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildToolbar(dynamic config, dynamic user) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
      color: const Color(0xFFFDFDFD),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          // Left side - Menu and Logo
          Row(
            children: [
              GestureDetector(
                onTap: () {
                  Scaffold.of(context).openDrawer();
                },
                child: Container(
                  padding: const EdgeInsets.all(4),
                  child: const Icon(
                    LucideIcons.alignJustify,
                    color: Color(0xFF002A5C),
                    size: 23,
                  ),
                ),
              ),
              const SizedBox(width: 5),
              // Logo
              config.logoPath.isNotEmpty
                  ? Image.asset(
                      config.logoPath,
                      width: 128,
                      height: 28,
                      fit: BoxFit.contain,
                      errorBuilder: (_, __, ___) => Text(
                        config.appName,
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF002A5C),
                          fontFamily: 'Poppins',
                        ),
                      ),
                    )
                  : Text(
                      config.appName,
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF002A5C),
                        fontFamily: 'Poppins',
                      ),
                    ),
            ],
          ),

          // Right side - Balance/Connect Broker and Bell
          Row(
            children: [
              // Connect Broker Button (shown when not connected)
              Container(
                margin: const EdgeInsets.only(right: 8),
                child: GestureDetector(
                  onTap: () {
                    // TODO: Open broker connection modal
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(5),
                      border: Border.all(
                        color: const Color(0xFF002A5C),
                        width: 1,
                      ),
                    ),
                    child: const Text(
                      'Connect Broker',
                      style: TextStyle(
                        color: Color(0xFF002A5C),
                        fontFamily: 'Poppins',
                        fontSize: 10,
                      ),
                    ),
                  ),
                ),
              ),

              // Bell Icon
              GestureDetector(
                onTap: () {
                  // TODO: Navigate to notifications
                },
                child: const Icon(
                  LucideIcons.bell,
                  size: 18,
                  color: Colors.black,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSearchSection() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 0),
      child: Row(
        children: [
          // Search Bar
          Expanded(
            child: GestureDetector(
              onTap: () {
                setState(() => _isSearchActive = true);
              },
              child: Container(
                height: 40,
                margin: const EdgeInsets.only(left: 10),
                padding: const EdgeInsets.only(left: 10),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8F8F8),
                  borderRadius: BorderRadius.circular(5),
                  border: Border.all(
                    color: const Color(0xFFE6E6E6),
                    width: 0,
                  ),
                ),
                child: Row(
                  children: [
                    const Icon(
                      LucideIcons.search,
                      size: 18,
                      color: Color(0xFF918F8F),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        'Enter "Reliance" to get latest updates',
                        style: TextStyle(
                          fontFamily: 'Satoshi',
                          fontSize: 13,
                          color: const Color(0xFF918F8F),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          // Coin Button
          Container(
            width: 40,
            height: 40,
            margin: const EdgeInsets.symmetric(horizontal: 10),
            decoration: BoxDecoration(
              color: const Color(0xFFFFD700), // gold
              shape: BoxShape.circle,
              border: Border.all(
                color: Colors.white,
                width: 1,
              ),
            ),
            child: const Center(
              child: Text(
                '10',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTabNavigation() {
    return Container(
      height: 65,
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: _tabs.length,
        padding: EdgeInsets.zero,
        itemBuilder: (context, index) {
          final tab = _tabs[index];
          final isSelected = _selectedTab == tab;

          return GestureDetector(
            onTap: () {
              setState(() => _selectedTab = tab);
            },
            child: Container(
              margin: const EdgeInsets.only(left: 10),
              padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 2),
              decoration: BoxDecoration(
                color: isSelected
                    ? const Color(0x1A002A5C) // #002A5C1A
                    : Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: isSelected
                      ? const Color(0xFF000000)
                      : const Color(0xFFE6E6E6),
                  width: isSelected ? 1.5 : 1,
                ),
              ),
              child: Center(
                child: Text(
                  tab,
                  style: TextStyle(
                    fontSize: 12,
                    fontFamily: 'Satoshi',
                    color: isSelected
                        ? const Color(0xFF000000)
                        : const Color(0xFFABABAB),
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildTabContent() {
    return RefreshIndicator(
      onRefresh: _onRefresh,
      child: IndexedStack(
        index: _tabs.indexOf(_selectedTab),
        children: [
          // All Tab
          _buildAllTabContent(),
          // Bespoke Tab
          _buildBespokeTabContent(),
          // Rebalance Tab
          _buildRebalanceTabContent(),
          // Blogs Tab
          _buildBlogsTabContent(),
          // Videos Tab
          _buildVideosTabContent(),
          // PDF Tab
          _buildPdfTabContent(),
        ],
      ),
    );
  }

  Widget _buildAllTabContent() {
    return ListView(
      children: const [
        RebalanceAdvicesSection(type: 'home'),
        StockAdvicesSection(type: 'home'),
        BestPerformersSection(),
        EducationalBlogsSection(),
        EducationalVideosSection(),
        EducationalPdfSection(),
        SizedBox(height: 100),
      ],
    );
  }

  Widget _buildBespokeTabContent() {
    return const StockAdvicesSection(type: 'All');
  }

  Widget _buildRebalanceTabContent() {
    return const RebalanceAdvicesSection(type: 'All');
  }

  Widget _buildBlogsTabContent() {
    return const EducationalBlogsSection(showAll: true);
  }

  Widget _buildVideosTabContent() {
    return const EducationalVideosSection(showAll: true);
  }

  Widget _buildPdfTabContent() {
    return const EducationalPdfSection(showAll: true);
  }
}
