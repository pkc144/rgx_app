import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../presentation/providers/auth_provider.dart';
import '../../presentation/screens/auth/login_screen.dart';
import '../../presentation/screens/auth/signup_screen.dart';
import '../../presentation/screens/auth/splash_screen.dart';
import '../../presentation/screens/home/home_screen.dart';
import '../../presentation/screens/portfolio/portfolio_screen.dart';
import '../../presentation/screens/orders/orders_screen.dart';
import '../../presentation/screens/settings/settings_screen.dart';
import '../../presentation/screens/drawer/model_portfolio_screen.dart';
import '../../presentation/screens/drawer/bespoke_screen.dart';
import '../../presentation/widgets/common/main_scaffold.dart';
import '../../services/auth/auth_service.dart';

/// Route names
class AppRoutes {
  static const splash = '/splash';
  static const login = '/login';
  static const signup = '/signup';
  static const home = '/home';
  static const portfolio = '/portfolio';
  static const orders = '/orders';
  static const settings = '/settings';
  static const modelPortfolio = '/model-portfolio';
  static const bespoke = '/bespoke';
  static const advice = '/advice';
  static const brokerConnect = '/broker-connect';
  static const paymentHistory = '/payment-history';
  static const profile = '/profile';
  static const knowledgeHub = '/knowledge-hub';
}

/// Router provider
final routerProvider = Provider<GoRouter>((ref) {
  final authStatus = ref.watch(authStatusProvider);

  return GoRouter(
    initialLocation: AppRoutes.splash,
    debugLogDiagnostics: true,
    redirect: (context, state) {
      final isLoggedIn = authStatus == AuthStatus.authenticated;
      final isLoggingIn = state.matchedLocation == AppRoutes.login ||
          state.matchedLocation == AppRoutes.signup;
      final isSplash = state.matchedLocation == AppRoutes.splash;

      // Show splash while loading
      if (authStatus == AuthStatus.initial || authStatus == AuthStatus.loading) {
        return isSplash ? null : AppRoutes.splash;
      }

      // Redirect to login if not authenticated
      if (!isLoggedIn && !isLoggingIn) {
        return AppRoutes.login;
      }

      // Redirect to home if already logged in
      if (isLoggedIn && isLoggingIn) {
        return AppRoutes.home;
      }

      return null;
    },
    routes: [
      // Splash
      GoRoute(
        path: AppRoutes.splash,
        builder: (context, state) => const SplashScreen(),
      ),

      // Auth routes
      GoRoute(
        path: AppRoutes.login,
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: AppRoutes.signup,
        builder: (context, state) => const SignupScreen(),
      ),

      // Main app with bottom navigation
      ShellRoute(
        builder: (context, state, child) => MainScaffold(child: child),
        routes: [
          GoRoute(
            path: AppRoutes.home,
            pageBuilder: (context, state) => const NoTransitionPage(
              child: HomeScreen(),
            ),
          ),
          GoRoute(
            path: AppRoutes.portfolio,
            pageBuilder: (context, state) => const NoTransitionPage(
              child: PortfolioScreen(),
            ),
          ),
          GoRoute(
            path: AppRoutes.orders,
            pageBuilder: (context, state) => const NoTransitionPage(
              child: OrdersScreen(),
            ),
          ),
          GoRoute(
            path: AppRoutes.settings,
            pageBuilder: (context, state) => const NoTransitionPage(
              child: SettingsScreen(),
            ),
          ),
        ],
      ),

      // Drawer routes
      GoRoute(
        path: AppRoutes.modelPortfolio,
        builder: (context, state) => const ModelPortfolioScreen(),
      ),
      GoRoute(
        path: AppRoutes.bespoke,
        builder: (context, state) => const BespokeScreen(),
      ),
    ],
    errorBuilder: (context, state) => Scaffold(
      body: Center(
        child: Text('Page not found: ${state.matchedLocation}'),
      ),
    ),
  );
});
