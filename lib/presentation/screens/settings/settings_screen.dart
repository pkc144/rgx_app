import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../providers/auth_provider.dart';
import '../../providers/config_provider.dart';
import '../../../core/router/app_router.dart';

/// Settings/More screen
class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final config = ref.watch(appConfigProvider);
    final user = ref.watch(currentUserProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('More'),
      ),
      body: ListView(
        children: [
          // Profile section
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: config.gradient,
            ),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 32,
                  backgroundColor: Colors.white,
                  child: Text(
                    (user?.name?.isNotEmpty == true)
                        ? user!.name!.substring(0, 1).toUpperCase()
                        : 'U',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: config.primaryColor,
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        user?.name ?? 'User',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        user?.email ?? '',
                        style: const TextStyle(
                          color: Colors.white70,
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(LucideIcons.edit, color: Colors.white),
                  onPressed: () {
                    // TODO: Navigate to profile edit
                  },
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Account section
          _buildSection(
            context,
            title: 'Account',
            items: [
              _SettingsItem(
                icon: LucideIcons.user,
                title: 'Profile',
                onTap: () {
                  // TODO: Navigate to profile
                },
              ),
              _SettingsItem(
                icon: LucideIcons.link,
                title: 'Broker Connections',
                onTap: () {
                  // TODO: Navigate to broker connections
                },
              ),
              _SettingsItem(
                icon: LucideIcons.creditCard,
                title: 'Payment History',
                onTap: () {
                  // TODO: Navigate to payment history
                },
              ),
              _SettingsItem(
                icon: LucideIcons.bell,
                title: 'Notifications',
                onTap: () {
                  // TODO: Navigate to notification settings
                },
              ),
            ],
          ),

          const SizedBox(height: 16),

          // Features section
          _buildSection(
            context,
            title: 'Features',
            items: [
              _SettingsItem(
                icon: LucideIcons.briefcase,
                title: 'Model Portfolio',
                onTap: () => context.push(AppRoutes.modelPortfolio),
              ),
              _SettingsItem(
                icon: LucideIcons.target,
                title: 'Bespoke Plans',
                onTap: () => context.push(AppRoutes.bespoke),
              ),
              _SettingsItem(
                icon: LucideIcons.bookOpen,
                title: 'Knowledge Hub',
                onTap: () {
                  // TODO: Navigate to knowledge hub
                },
              ),
            ],
          ),

          const SizedBox(height: 16),

          // Support section
          _buildSection(
            context,
            title: 'Support',
            items: [
              _SettingsItem(
                icon: LucideIcons.helpCircle,
                title: 'Help & Support',
                onTap: () {
                  // TODO: Navigate to help
                },
              ),
              _SettingsItem(
                icon: LucideIcons.fileText,
                title: 'Terms & Conditions',
                onTap: () {
                  // TODO: Open terms
                },
              ),
              _SettingsItem(
                icon: LucideIcons.shield,
                title: 'Privacy Policy',
                onTap: () {
                  // TODO: Open privacy policy
                },
              ),
              _SettingsItem(
                icon: LucideIcons.info,
                title: 'About',
                onTap: () {
                  // TODO: Show about dialog
                },
              ),
            ],
          ),

          const SizedBox(height: 16),

          // Logout
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: OutlinedButton.icon(
              onPressed: () async {
                final confirm = await showDialog<bool>(
                  context: context,
                  builder: (context) => AlertDialog(
                    title: const Text('Logout'),
                    content:
                        const Text('Are you sure you want to logout?'),
                    actions: [
                      TextButton(
                        onPressed: () => Navigator.pop(context, false),
                        child: const Text('Cancel'),
                      ),
                      TextButton(
                        onPressed: () => Navigator.pop(context, true),
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
              icon: const Icon(LucideIcons.logOut),
              label: const Text('Logout'),
              style: OutlinedButton.styleFrom(
                foregroundColor: Colors.red,
                side: const BorderSide(color: Colors.red),
              ),
            ),
          ),

          const SizedBox(height: 32),

          // Version info
          Center(
            child: Text(
              'Version 1.3.2',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.grey,
                  ),
            ),
          ),

          const SizedBox(height: 16),
        ],
      ),
    );
  }

  Widget _buildSection(
    BuildContext context, {
    required String title,
    required List<_SettingsItem> items,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Text(
            title,
            style: Theme.of(context).textTheme.titleSmall?.copyWith(
                  color: Colors.grey,
                  fontWeight: FontWeight.w600,
                ),
          ),
        ),
        Card(
          margin: const EdgeInsets.symmetric(horizontal: 16),
          child: Column(
            children: items.map((item) {
              final isLast = items.last == item;
              return Column(
                children: [
                  ListTile(
                    leading: Icon(item.icon),
                    title: Text(item.title),
                    trailing: const Icon(LucideIcons.chevronRight, size: 20),
                    onTap: item.onTap,
                  ),
                  if (!isLast) const Divider(height: 1, indent: 56),
                ],
              );
            }).toList(),
          ),
        ),
      ],
    );
  }
}

class _SettingsItem {
  final IconData icon;
  final String title;
  final VoidCallback onTap;

  _SettingsItem({
    required this.icon,
    required this.title,
    required this.onTap,
  });
}
