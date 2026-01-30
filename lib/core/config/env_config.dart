import 'package:flutter_dotenv/flutter_dotenv.dart';

/// Environment configuration loaded from .env file
class EnvConfig {
  static String get domain => dotenv.env['REACT_APP_DOMAIN'] ?? 'https://prod.alphaquark.in';
  static String get advisorSubdomain => dotenv.env['REACT_APP_ADVISOR_SUBDOMAIN'] ?? 'rgxresearch';
  static String get appVariant => dotenv.env['APP_VARIANT'] ?? 'rgxresearch';
  static String get advisorRaCode => dotenv.env['ADVISOR_RA_CODE'] ?? 'rgxresearch';
  static String get advisorSpecificTag => dotenv.env['REACT_APP_ADVISOR_SPECIFIC_TAG'] ?? 'EquityPro by RGXResearch';
  static String get whiteLabelText => dotenv.env['REACT_APP_WHITE_LABEL_TEXT'] ?? 'EquityPro by RGXResearch';

  // API URLs
  static String get nodeServerUrl => dotenv.env['REACT_APP_NODE_SERVER_API_URL'] ?? 'https://server.alphaquark.in/';
  static String get ccxtServerUrl => dotenv.env['REACT_APP_CCXT_SERVER_API_URL'] ?? 'https://ccxtprod.alphaquark.in/';
  static String get websocketUrl => dotenv.env['REACT_APP_CCXT_SERVER_WEBSOCKET_URL'] ?? 'https://websocket.alphaquark.in/';
  static String get websocketLtpUrl => dotenv.env['REACT_APP_WEBSOCKET_LISTENING_URL'] ?? 'wss://websocket.alphaquark.in/ltp';

  // Broker API Keys
  static String get zerodhaApiKey => dotenv.env['REACT_APP_ZERODHA_API_KEY'] ?? '';
  static String get angelOneApiKey => dotenv.env['REACT_APP_ANGEL_ONE_API_KEY'] ?? '';
  static String get brokerRedirectUrl => dotenv.env['REACT_APP_BROKER_CONNECT_REDIRECT_URL'] ?? '';

  // Payment
  static String get razorpayApiKey => dotenv.env['REACT_APP_RAZORPAY_LIVE_API_KEY'] ?? '';
  static bool get cashfreeEnabled => dotenv.env['REACT_APP_CASHFREE_PAYMENT'] == 'true';

  // Notifications
  static bool get whatsappNotification => dotenv.env['REACT_APP_WHATSAPP_NOTIFICATION'] == 'true';
  static bool get emailNotification => dotenv.env['REACT_APP_EMAIL_NOTIFICATION'] == 'true';
  static bool get telegramNotification => dotenv.env['REACT_APP_TELEGRAM_NOTIFICATION'] == 'true';

  // Firebase
  static String get firebaseApiKey => dotenv.env['REACT_APP_FIREBASE_API_KEY'] ?? '';
  static String get firebaseAuthDomain => dotenv.env['REACT_APP_FIREBASE_AUTH_DOMAIN'] ?? '';
  static String get firebaseProjectId => dotenv.env['REACT_APP_FIREBASE_PROJECT_ID'] ?? '';
  static String get firebaseStorageBucket => dotenv.env['REACT_APP_FIREBASE_STORAGE_BUCKET'] ?? '';
  static String get firebaseMessagingSenderId => dotenv.env['REACT_APP_FIREBASE_MESSAGING_SENDER_ID'] ?? '';
  static String get firebaseAppId => dotenv.env['REACT_APP_FIREBASE_APP_ID'] ?? '';

  // Google Sign In
  static String get googleWebClientId => dotenv.env['GOOGLE_WEB_CLIENT_ID'] ?? '';

  // Security
  static String get aqKeys => dotenv.env['REACT_APP_AQ_KEYS'] ?? '';
  static String get aqSecret => dotenv.env['REACT_APP_AQ_SECRET'] ?? '';

  // App Settings
  static int get adviceShowLatestDays => int.tryParse(dotenv.env['REACT_APP_ADVICE_SHOW_LATEST_DAYS'] ?? '15') ?? 15;
  static bool get testMode => dotenv.env['REACT_APP_TEST_MODE'] == 'true';
  static bool get derivativeStatus => dotenv.env['REACT_APP_DERIVATIVE_STATUS'] == 'true';

  // URLs
  static String get websiteUrl => dotenv.env['REACT_APP_WEBSITE_URL'] ?? 'https://equitypro.co.in';
  static String get termsUrl => dotenv.env['REACT_APP_ADVISOR_TERMS_AND_CONDITION'] ?? '';
  static String get privacyUrl => dotenv.env['REACT_APP_ADVISOR_PRIVACY_POLICY'] ?? '';
  static String get contactEmail => dotenv.env['REACT_APP_CONTACT_ADVISOR_EMAIL'] ?? 'hello@alphaquark.in';
}
