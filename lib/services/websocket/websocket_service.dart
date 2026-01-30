import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;
import '../../core/config/env_config.dart';

/// WebSocket service provider
final websocketServiceProvider = Provider<WebSocketService>((ref) {
  return WebSocketService();
});

/// Live price update model
class LivePriceUpdate {
  final String symbol;
  final double ltp; // Last Traded Price
  final double change;
  final double changePercent;
  final double high;
  final double low;
  final double open;
  final double close;
  final int volume;
  final DateTime timestamp;

  LivePriceUpdate({
    required this.symbol,
    required this.ltp,
    required this.change,
    required this.changePercent,
    required this.high,
    required this.low,
    required this.open,
    required this.close,
    required this.volume,
    required this.timestamp,
  });

  factory LivePriceUpdate.fromJson(Map<String, dynamic> json) {
    return LivePriceUpdate(
      symbol: json['symbol'] ?? '',
      ltp: (json['ltp'] ?? json['lastPrice'] ?? 0).toDouble(),
      change: (json['change'] ?? 0).toDouble(),
      changePercent: (json['changePercent'] ?? json['pChange'] ?? 0).toDouble(),
      high: (json['high'] ?? json['dayHigh'] ?? 0).toDouble(),
      low: (json['low'] ?? json['dayLow'] ?? 0).toDouble(),
      open: (json['open'] ?? 0).toDouble(),
      close: (json['close'] ?? json['previousClose'] ?? 0).toDouble(),
      volume: json['volume'] ?? json['totalTradedVolume'] ?? 0,
      timestamp: DateTime.now(),
    );
  }
}

/// WebSocket service for real-time price updates
class WebSocketService {
  io.Socket? _socket;
  final _priceController = StreamController<LivePriceUpdate>.broadcast();
  final Set<String> _subscribedSymbols = {};
  bool _isConnected = false;
  Timer? _reconnectTimer;
  int _reconnectAttempts = 0;
  static const int _maxReconnectAttempts = 5;

  Stream<LivePriceUpdate> get priceStream => _priceController.stream;
  bool get isConnected => _isConnected;

  /// Connect to WebSocket server
  void connect() {
    if (_socket != null && _isConnected) return;

    _socket = io.io(
      EnvConfig.websocketUrl,
      io.OptionBuilder()
          .setTransports(['websocket'])
          .enableAutoConnect()
          .enableReconnection()
          .setReconnectionAttempts(_maxReconnectAttempts)
          .setReconnectionDelay(1000)
          .build(),
    );

    _setupListeners();
  }

  void _setupListeners() {
    _socket?.onConnect((_) {
      _isConnected = true;
      _reconnectAttempts = 0;
      _cancelReconnectTimer();

      // Re-subscribe to previously subscribed symbols
      if (_subscribedSymbols.isNotEmpty) {
        _socket?.emit('subscribe', _subscribedSymbols.toList());
      }
    });

    _socket?.onDisconnect((_) {
      _isConnected = false;
      _scheduleReconnect();
    });

    _socket?.onConnectError((error) {
      _isConnected = false;
      _scheduleReconnect();
    });

    // Listen for price updates
    _socket?.on('ltp', (data) {
      _handlePriceUpdate(data);
    });

    _socket?.on('price_update', (data) {
      _handlePriceUpdate(data);
    });

    _socket?.on('tick', (data) {
      _handlePriceUpdate(data);
    });
  }

  void _handlePriceUpdate(dynamic data) {
    try {
      if (data is Map<String, dynamic>) {
        final update = LivePriceUpdate.fromJson(data);
        _priceController.add(update);
      } else if (data is List) {
        for (final item in data) {
          if (item is Map<String, dynamic>) {
            final update = LivePriceUpdate.fromJson(item);
            _priceController.add(update);
          }
        }
      }
    } catch (e) {
      // Handle parsing error silently
    }
  }

  void _scheduleReconnect() {
    if (_reconnectAttempts >= _maxReconnectAttempts) return;
    _cancelReconnectTimer();

    final delay = Duration(seconds: (1 << _reconnectAttempts).clamp(1, 30));
    _reconnectTimer = Timer(delay, () {
      _reconnectAttempts++;
      connect();
    });
  }

  void _cancelReconnectTimer() {
    _reconnectTimer?.cancel();
    _reconnectTimer = null;
  }

  /// Subscribe to symbols for price updates
  void subscribe(List<String> symbols) {
    _subscribedSymbols.addAll(symbols);
    if (_isConnected) {
      _socket?.emit('subscribe', symbols);
    }
  }

  /// Unsubscribe from symbols
  void unsubscribe(List<String> symbols) {
    _subscribedSymbols.removeAll(symbols);
    if (_isConnected) {
      _socket?.emit('unsubscribe', symbols);
    }
  }

  /// Subscribe to a single symbol
  void subscribeSymbol(String symbol) {
    subscribe([symbol]);
  }

  /// Unsubscribe from a single symbol
  void unsubscribeSymbol(String symbol) {
    unsubscribe([symbol]);
  }

  /// Get price stream for a specific symbol
  Stream<LivePriceUpdate> getPriceStream(String symbol) {
    subscribeSymbol(symbol);
    return priceStream.where((update) => update.symbol == symbol);
  }

  /// Disconnect WebSocket
  void disconnect() {
    _cancelReconnectTimer();
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
    _isConnected = false;
    _subscribedSymbols.clear();
  }

  /// Dispose resources
  void dispose() {
    disconnect();
    _priceController.close();
  }
}
