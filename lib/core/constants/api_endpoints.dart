import '../config/env_config.dart';

/// API endpoint constants
class ApiEndpoints {
  static String get baseUrl => EnvConfig.nodeServerUrl;
  static String get ccxtBaseUrl => EnvConfig.ccxtServerUrl;
  static String get websocketUrl => EnvConfig.websocketUrl;

  // Auth
  static const String login = 'api/auth/login';
  static const String signup = 'api/auth/signup';
  static const String verifyEmail = 'api/auth/verify-email';
  static const String resetPassword = 'api/auth/reset-password';
  static const String googleSignIn = 'api/auth/google';
  static const String appleSignIn = 'api/auth/apple';

  // User
  static const String userProfile = 'api/user/profile';
  static const String updateProfile = 'api/user/update';
  static const String userHoldings = 'api/user/holdings';
  static const String userOrders = 'api/user/orders';

  // Advisor
  static const String advisorConfig = 'api/app-advisor/get';
  static const String advisorList = 'api/advisors/list';
  static const String changeAdvisor = 'api/user/change-advisor';

  // Stock Advice
  static const String stockAdvice = 'api/advice/stocks';
  static const String adviceHistory = 'api/advice/history';
  static const String executeAdvice = 'api/advice/execute';

  // Model Portfolio
  static const String modelPortfolios = 'api/model-portfolio/list';
  static const String modelPortfolioDetails = 'api/model-portfolio/details';
  static const String subscribeModelPortfolio = 'api/model-portfolio/subscribe';
  static const String modelPortfolioPerformance = 'api/model-portfolio/performance';

  // Bespoke Plans
  static const String bespokePlans = 'api/bespoke/plans';
  static const String bespokeSubscribe = 'api/bespoke/subscribe';
  static const String bespokePerformance = 'api/bespoke/performance';

  // Portfolio
  static const String portfolio = 'api/portfolio';
  static const String portfolioHoldings = 'api/portfolio/holdings';
  static const String portfolioPositions = 'api/portfolio/positions';

  // Orders
  static const String orders = 'api/orders';
  static const String orderBook = 'api/orders/book';
  static const String cancelOrder = 'api/orders/cancel';
  static const String orderStatus = 'api/orders/status';

  // Broker
  static const String brokerConnect = 'api/broker/connect';
  static const String brokerDisconnect = 'api/broker/disconnect';
  static const String brokerStatus = 'api/broker/status';
  static const String brokerCredentials = 'api/broker/credentials';

  // Payments
  static const String createPaymentOrder = 'api/payment/create-order';
  static const String verifyPayment = 'api/payment/verify';
  static const String paymentHistory = 'api/payment/history';
  static const String subscriptions = 'api/payment/subscriptions';

  // Notifications
  static const String notifications = 'api/notifications';
  static const String registerFcmToken = 'api/notifications/register-token';
  static const String notificationSettings = 'api/notifications/settings';

  // Knowledge Hub
  static const String blogs = 'api/knowledge/blogs';
  static const String videos = 'api/knowledge/videos';
  static const String courses = 'api/knowledge/courses';

  // CCXT Broker endpoints
  static const String ccxtConnect = 'api/broker/connect';
  static const String ccxtOrderBook = 'api/broker/orderbook';
  static const String ccxtPlaceOrder = 'api/broker/place-order';
  static const String ccxtCancelOrder = 'api/broker/cancel-order';
  static const String ccxtHoldings = 'api/broker/holdings';
  static const String ccxtPositions = 'api/broker/positions';
}
