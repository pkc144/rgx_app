import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../providers/auth_provider.dart';
import '../../providers/config_provider.dart';
import '../../../core/router/app_router.dart';

/// Account Settings screen matching React Native design
class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final config = ref.watch(appConfigProvider);
    final user = ref.watch(currentUserProvider);

    return Scaffold(
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              config.primaryColor,
              config.secondaryColor,
            ],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              // Header
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                child: Row(
                  children: [
                    GestureDetector(
                      onTap: () => context.pop(),
                      child: const Padding(
                        padding: EdgeInsets.all(4),
                        child: Icon(
                          LucideIcons.chevronLeft,
                          color: Colors.white,
                          size: 24,
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),
                    const Expanded(
                      child: Text(
                        'Account Settings',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w600,
                          color: Colors.white,
                          fontFamily: 'Satoshi',
                        ),
                      ),
                    ),
                    GestureDetector(
                      onTap: () {
                        // TODO: Navigate to notifications
                      },
                      child: Container(
                        width: 32,
                        height: 32,
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.1),
                          shape: BoxShape.circle,
                        ),
                        child: Stack(
                          children: [
                            const Center(
                              child: Icon(
                                LucideIcons.bell,
                                color: Colors.white,
                                size: 18,
                              ),
                            ),
                            Positioned(
                              top: 4,
                              right: 4,
                              child: Container(
                                width: 8,
                                height: 8,
                                decoration: const BoxDecoration(
                                  color: Color(0xFFFF4444),
                                  shape: BoxShape.circle,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              Expanded(
                child: SingleChildScrollView(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Profile Section
                      Padding(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 20,
                          vertical: 24,
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 40,
                              height: 40,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: const Color(0xFFC8C8C8),
                                ),
                              ),
                              child: Center(
                                child: user?.profileImage != null
                                    ? ClipOval(
                                        child: Image.network(
                                          user!.profileImage!,
                                          width: 50,
                                          height: 50,
                                          fit: BoxFit.cover,
                                          errorBuilder: (_, __, ___) => Text(
                                            _getInitials(user.name),
                                            style: const TextStyle(
                                              color: Colors.white,
                                              fontSize: 20,
                                              fontFamily: 'Poppins',
                                            ),
                                          ),
                                        ),
                                      )
                                    : Text(
                                        _getInitials(user?.name),
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontSize: 20,
                                          fontFamily: 'Poppins',
                                        ),
                                      ),
                              ),
                            ),
                            const SizedBox(width: 20),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    user?.name ?? 'User',
                                    style: const TextStyle(
                                      fontSize: 18,
                                      fontWeight: FontWeight.w600,
                                      color: Colors.white,
                                      fontFamily: 'Satoshi',
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    user?.email ?? '',
                                    style: TextStyle(
                                      fontSize: 13,
                                      color: Colors.white.withOpacity(0.7),
                                      fontFamily: 'Satoshi',
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),

                      // Account Section
                      _buildSection(
                        context,
                        ref,
                        title: 'Account',
                        items: [
                          _MenuItem(
                            icon: LucideIcons.link,
                            label: 'Broker Account',
                            onTap: () {
                              // TODO: Navigate to broker settings
                            },
                          ),
                          _MenuItem(
                            icon: LucideIcons.crown,
                            label: 'My Subscription',
                            onTap: () => context.push(AppRoutes.modelPortfolio),
                          ),
                          _MenuItem(
                            icon: LucideIcons.tags,
                            label: 'Change Manager',
                            onTap: () {
                              // TODO: Navigate to change advisor
                            },
                          ),
                        ],
                      ),

                      // Insights Section
                      _buildSection(
                        context,
                        ref,
                        title: 'Insights',
                        items: [
                          _MenuItem(
                            icon: LucideIcons.bookPlus,
                            label: 'Research Report',
                            onTap: () {
                              // TODO: Navigate to research reports
                            },
                          ),
                          _MenuItem(
                            icon: LucideIcons.bookmark,
                            label: 'Watchlists',
                            onTap: () {
                              // TODO: Navigate to watchlists
                            },
                          ),
                          _MenuItem(
                            icon: LucideIcons.receipt,
                            label: 'My Invoices',
                            onTap: () {
                              // TODO: Navigate to payment history
                            },
                          ),
                          _MenuItem(
                            icon: LucideIcons.graduationCap,
                            label: 'Knowledge Hub',
                            onTap: () {
                              // TODO: Navigate to knowledge hub
                            },
                          ),
                        ],
                      ),

                      // Legal Section
                      _buildSection(
                        context,
                        ref,
                        title: 'Legal',
                        items: [
                          _MenuItem(
                            icon: LucideIcons.link,
                            label: 'Privacy Policy',
                            onTap: () {
                              // TODO: Navigate to privacy policy
                            },
                          ),
                          _MenuItem(
                            icon: LucideIcons.link,
                            label: 'Terms & Conditions',
                            onTap: () {
                              // TODO: Navigate to terms
                            },
                          ),
                        ],
                      ),

                      // Logout Section
                      _buildSection(
                        context,
                        ref,
                        title: null,
                        items: [
                          _MenuItem(
                            icon: LucideIcons.logOut,
                            label: 'Log Out',
                            isLogout: true,
                            onTap: () async {
                              final confirm = await showDialog<bool>(
                                context: context,
                                builder: (context) => AlertDialog(
                                  title: const Text('Logout'),
                                  content: const Text(
                                      'Are you sure you want to logout?'),
                                  actions: [
                                    TextButton(
                                      onPressed: () =>
                                          Navigator.pop(context, false),
                                      child: const Text('Cancel'),
                                    ),
                                    TextButton(
                                      onPressed: () =>
                                          Navigator.pop(context, true),
                                      child: const Text('Logout'),
                                    ),
                                  ],
                                ),
                              );

                              if (confirm == true) {
                                await ref.read(authProvider.notifier).logout();
                                if (context.mounted) {
                                  context.go(AppRoutes.login);
                                }
                              }
                            },
                          ),
                        ],
                      ),

                      const SizedBox(height: 32),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _getInitials(String? name) {
    if (name == null || name.isEmpty) return '';
    return name[0].toUpperCase();
  }

  Widget _buildSection(
    BuildContext context,
    WidgetRef ref, {
    String? title,
    required List<_MenuItem> items,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (title != null)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Text(
                title,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: Colors.white.withOpacity(0.6),
                  fontFamily: 'Satoshi',
                ),
              ),
            ),
          if (title != null) const SizedBox(height: 12),
          Container(
            margin: const EdgeInsets.symmetric(horizontal: 16),
            padding: const EdgeInsets.symmetric(horizontal: 16),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.05),
              borderRadius: BorderRadius.circular(5),
              border: Border.all(
                color: Colors.white.withOpacity(0.08),
                width: 0.5,
              ),
            ),
            child: Column(
              children: items.asMap().entries.map((entry) {
                final index = entry.key;
                final item = entry.value;
                final isLast = index == items.length - 1;

                return Container(
                  decoration: BoxDecoration(
                    border: isLast
                        ? null
                        : const Border(
                            bottom: BorderSide(
                              color: Colors.white,
                              width: 0.5,
                            ),
                          ),
                  ),
                  child: Material(
                    color: Colors.transparent,
                    child: InkWell(
                      onTap: item.onTap,
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        child: Row(
                          children: [
                            SizedBox(
                              width: 20,
                              height: 20,
                              child: Icon(
                                item.icon,
                                size: 18,
                                color: item.isLogout
                                    ? const Color(0xFFFF4444)
                                    : Colors.white,
                              ),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Text(
                                item.label,
                                style: const TextStyle(
                                  fontSize: 14,
                                  color: Colors.white,
                                  fontFamily: 'Satoshi',
                                ),
                              ),
                            ),
                            const Icon(
                              LucideIcons.chevronRight,
                              size: 20,
                              color: Colors.white,
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }
}

class _MenuItem {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool isLogout;

  _MenuItem({
    required this.icon,
    required this.label,
    required this.onTap,
    this.isLogout = false,
  });
}
