/// Custom API exception class
class ApiException implements Exception {
  final String message;
  final int? statusCode;
  final dynamic data;

  ApiException({
    required this.message,
    this.statusCode,
    this.data,
  });

  factory ApiException.network() {
    return ApiException(
      message: 'No internet connection. Please check your network.',
      statusCode: -1,
    );
  }

  factory ApiException.timeout() {
    return ApiException(
      message: 'Request timed out. Please try again.',
      statusCode: -2,
    );
  }

  factory ApiException.server(int statusCode, String message) {
    return ApiException(
      message: message,
      statusCode: statusCode,
    );
  }

  factory ApiException.unauthorized() {
    return ApiException(
      message: 'Session expired. Please login again.',
      statusCode: 401,
    );
  }

  factory ApiException.notFound(String resource) {
    return ApiException(
      message: '$resource not found.',
      statusCode: 404,
    );
  }

  factory ApiException.validation(String message) {
    return ApiException(
      message: message,
      statusCode: 422,
    );
  }

  bool get isNetworkError => statusCode == -1;
  bool get isTimeout => statusCode == -2;
  bool get isUnauthorized => statusCode == 401;
  bool get isServerError => statusCode != null && statusCode! >= 500;

  @override
  String toString() => 'ApiException: $message (status: $statusCode)';
}

/// Result wrapper for API calls
class Result<T> {
  final T? data;
  final ApiException? error;

  Result._({this.data, this.error});

  factory Result.success(T data) => Result._(data: data);
  factory Result.failure(ApiException error) => Result._(error: error);

  bool get isSuccess => error == null;
  bool get isFailure => error != null;

  R when<R>({
    required R Function(T data) success,
    required R Function(ApiException error) failure,
  }) {
    if (isSuccess) {
      return success(data as T);
    } else {
      return failure(error!);
    }
  }
}
