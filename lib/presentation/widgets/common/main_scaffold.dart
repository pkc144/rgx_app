import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../providers/config_provider.dart';
import '../../../core/router/app_router.dart';

/// Main scaffold with bottom navigation
class MainScaffold extends ConsumerStatefulWidget {
  final Widget child;

  const MainScaffold({super.key, required this.child});

  @override
  ConsumerState<MainScaffold> createState() => _MainScaffoldState();
}

class _MainScaffoldState extends ConsumerState<MainScaffold> {
  int _currentIndex = 0;

  static const _routes = [
    AppRoutes.home,
    AppRoutes.portfolio,
    AppRoutes.orders,
    AppRoutes.settings,
  ];

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _updateIndex();
  }

  void _updateIndex() {
    final location = GoRouterState.of(context).matchedLocation;
    final index = _routes.indexOf(location);
    if (index != -1 && index != _currentIndex) {
      setState(() => _currentIndex = index);
    }
  }

  void _onTap(int index) {
    if (index != _currentIndex) {
      setState(() => _currentIndex = index);
      context.go(_routes[index]);
    }
  }

  @override
  Widget build(BuildContext context) {
    final config = ref.watch(appConfigProvider);

    return Scaffold(
      body: widget.child,
      drawer: _buildDrawer(context),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: _onTap,
        type: BottomNavigationBarType.fixed,
        selectedItemColor: config.primaryColor,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(LucideIcons.home),
            label: 'Home',
          ),
          BottomNavigationBarItem(
            icon: Icon(LucideIcons.pieChart),
            label: 'Portfolio',
          ),
          BottomNavigationBarItem(
            icon: Icon(LucideIcons.clipboardList),
            label: 'Orders',
          ),
          BottomNavigationBarItem(
            icon: Icon(LucideIcons.menu),
            label: 'More',
          ),
        ],
      ),
    );
  }

  Widget _buildDrawer(BuildContext context) {
    final config = ref.watch(appConfigProvider);

    return Drawer(
      child: ListView(
        padding: EdgeInsets.zero,
        children: [
          DrawerHeader(
            decoration: BoxDecoration(
              gradient: config.gradient,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                const CircleAvatar(
                  radius: 30,
                  backgroundColor: Colors.white,
                  child: Icon(LucideIcons.user, size: 32),
                ),
                const SizedBox(height: 12),
                Text(
                  config.appName,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
          _DrawerItem(
            icon: LucideIcons.briefcase,
            title: 'Model Portfolio',
            onTap: () {
              Navigator.pop(context);
              context.push(AppRoutes.modelPortfolio);
            },
          ),
          _DrawerItem(
            icon: LucideIcons.target,
            title: 'Bespoke Plans',
            onTap: () {
              Navigator.pop(context);
              context.push(AppRoutes.bespoke);
            },
          ),
          _DrawerItem(
            icon: LucideIcons.link,
            title: 'Broker Connect',
            onTap: () {
              Navigator.pop(context);
              // TODO: Navigate to broker connect
            },
          ),
          _DrawerItem(
            icon: LucideIcons.creditCard,
            title: 'Payment History',
            onTap: () {
              Navigator.pop(context);
              // TODO: Navigate to payment history
            },
          ),
          const Divider(),
          _DrawerItem(
            icon: LucideIcons.bookOpen,
            title: 'Knowledge Hub',
            onTap: () {
              Navigator.pop(context);
              // TODO: Navigate to knowledge hub
            },
          ),
          _DrawerItem(
            icon: LucideIcons.fileText,
            title: 'Terms & Conditions',
            onTap: () {
              Navigator.pop(context);
              // TODO: Open terms
            },
          ),
          _DrawerItem(
            icon: LucideIcons.shield,
            title: 'Privacy Policy',
            onTap: () {
              Navigator.pop(context);
              // TODO: Open privacy policy
            },
          ),
          const Divider(),
          _DrawerItem(
            icon: LucideIcons.logOut,
            title: 'Logout',
            onTap: () {
              Navigator.pop(context);
              // TODO: Handle logout
            },
          ),
        ],
      ),
    );
  }
}

class _DrawerItem extends StatelessWidget {
  final IconData icon;
  final String title;
  final VoidCallback onTap;

  const _DrawerItem({
    required this.icon,
    required this.title,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon),
      title: Text(title),
      onTap: onTap,
    );
  }
}
