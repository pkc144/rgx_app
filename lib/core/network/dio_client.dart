import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../config/env_config.dart';
import '../utils/security_token_manager.dart';
import '../errors/api_exception.dart';

/// Dio HTTP client provider
final dioClientProvider = Provider<DioClient>((ref) {
  return DioClient();
});

/// HTTP client wrapper using Dio
class DioClient {
  late final Dio _dio;
  late final Dio _ccxtDio;

  DioClient() {
    _dio = _createDio(EnvConfig.nodeServerUrl);
    _ccxtDio = _createDio(EnvConfig.ccxtServerUrl);
  }

  Dio _createDio(String baseUrl) {
    final dio = Dio(
      BaseOptions(
        baseUrl: baseUrl,
        connectTimeout: const Duration(seconds: 30),
        receiveTimeout: const Duration(seconds: 30),
        sendTimeout: const Duration(seconds: 30),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    dio.interceptors.addAll([
      _AuthInterceptor(),
      _LoggingInterceptor(),
      _ErrorInterceptor(),
    ]);

    return dio;
  }

  Dio get dio => _dio;
  Dio get ccxtDio => _ccxtDio;

  /// GET request
  Future<Response<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
    bool useCcxt = false,
  }) async {
    try {
      final client = useCcxt ? _ccxtDio : _dio;
      return await client.get<T>(
        path,
        queryParameters: queryParameters,
        options: options,
      );
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  /// POST request
  Future<Response<T>> post<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    bool useCcxt = false,
  }) async {
    try {
      final client = useCcxt ? _ccxtDio : _dio;
      return await client.post<T>(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
      );
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  /// PUT request
  Future<Response<T>> put<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    bool useCcxt = false,
  }) async {
    try {
      final client = useCcxt ? _ccxtDio : _dio;
      return await client.put<T>(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
      );
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  /// DELETE request
  Future<Response<T>> delete<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    bool useCcxt = false,
  }) async {
    try {
      final client = useCcxt ? _ccxtDio : _dio;
      return await client.delete<T>(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
      );
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  ApiException _handleDioError(DioException e) {
    switch (e.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return ApiException.timeout();
      case DioExceptionType.connectionError:
        return ApiException.network();
      case DioExceptionType.badResponse:
        final statusCode = e.response?.statusCode ?? 500;
        final message = _extractErrorMessage(e.response);
        return ApiException.server(statusCode, message);
      case DioExceptionType.cancel:
        return ApiException(message: 'Request cancelled');
      default:
        return ApiException(message: e.message ?? 'Unknown error');
    }
  }

  String _extractErrorMessage(Response? response) {
    if (response?.data is Map) {
      return response?.data['message'] ??
          response?.data['error'] ??
          'Server error';
    }
    return 'Server error';
  }
}

/// Auth interceptor to add security headers
class _AuthInterceptor extends Interceptor {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    // Add advisor subdomain header
    options.headers['X-Advisor-Subdomain'] = EnvConfig.advisorSubdomain;

    // Add security token
    final encryptedKey = SecurityTokenManager.generateToken();
    if (encryptedKey != null) {
      options.headers['aq-encrypted-key'] = encryptedKey;
    }

    handler.next(options);
  }
}

/// Logging interceptor for debugging
class _LoggingInterceptor extends Interceptor {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    // Log request in debug mode
    // debugPrint('REQUEST[${options.method}] => PATH: ${options.path}');
    handler.next(options);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    // debugPrint('RESPONSE[${response.statusCode}] => PATH: ${response.requestOptions.path}');
    handler.next(response);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    // debugPrint('ERROR[${err.response?.statusCode}] => PATH: ${err.requestOptions.path}');
    handler.next(err);
  }
}

/// Error interceptor for global error handling
class _ErrorInterceptor extends Interceptor {
  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    // Handle 401 Unauthorized - trigger logout
    if (err.response?.statusCode == 401) {
      // TODO: Trigger logout via AuthService
    }
    handler.next(err);
  }
}
