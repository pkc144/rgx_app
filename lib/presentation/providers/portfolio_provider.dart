import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../services/broker/broker_service.dart';
import '../../data/models/portfolio_model.dart';
import '../../data/models/user_model.dart';
import 'auth_provider.dart';

/// Portfolio state
class PortfolioState {
  final bool isLoading;
  final PortfolioModel? portfolio;
  final List<HoldingModel> holdings;
  final List<PositionModel> positions;
  final String? error;

  PortfolioState({
    this.isLoading = false,
    this.portfolio,
    this.holdings = const [],
    this.positions = const [],
    this.error,
  });

  PortfolioState copyWith({
    bool? isLoading,
    PortfolioModel? portfolio,
    List<HoldingModel>? holdings,
    List<PositionModel>? positions,
    String? error,
  }) {
    return PortfolioState(
      isLoading: isLoading ?? this.isLoading,
      portfolio: portfolio ?? this.portfolio,
      holdings: holdings ?? this.holdings,
      positions: positions ?? this.positions,
      error: error,
    );
  }

  double get totalInvestment => holdings.fold(
        0.0,
        (sum, h) => sum + (h.investedValue ?? 0),
      );

  double get currentValue => holdings.fold(
        0.0,
        (sum, h) => sum + (h.currentValue ?? 0),
      );

  double get totalPnl => currentValue - totalInvestment;

  double get totalPnlPercent =>
      totalInvestment > 0 ? (totalPnl / totalInvestment) * 100 : 0;

  double get dayPnl => holdings.fold(
        0.0,
        (sum, h) => sum + ((h.dayChange ?? 0) * (h.quantity ?? 0)),
      );
}

/// Portfolio provider
final portfolioProvider =
    StateNotifierProvider<PortfolioNotifier, PortfolioState>((ref) {
  final brokerService = ref.read(brokerServiceProvider);
  final user = ref.watch(currentUserProvider);
  return PortfolioNotifier(brokerService, user);
});

/// Holdings provider
final holdingsProvider = Provider<List<HoldingModel>>((ref) {
  return ref.watch(portfolioProvider).holdings;
});

/// Positions provider
final positionsProvider = Provider<List<PositionModel>>((ref) {
  return ref.watch(portfolioProvider).positions;
});

/// Portfolio notifier
class PortfolioNotifier extends StateNotifier<PortfolioState> {
  final BrokerService _brokerService;
  final UserModel? _user;

  PortfolioNotifier(this._brokerService, this._user)
      : super(PortfolioState()) {
    if (_user != null) {
      loadPortfolio();
    }
  }

  Future<void> loadPortfolio() async {
    final connectedBrokers = _user?.brokerConnections
            ?.where((b) => b.isActive == true)
            .map((b) => b.brokerCode!)
            .toList() ??
        [];

    if (connectedBrokers.isEmpty) {
      state = state.copyWith(isLoading: false);
      return;
    }

    state = state.copyWith(isLoading: true, error: null);

    final holdingsResult = await _brokerService.getAllHoldings(connectedBrokers);

    holdingsResult.when(
      success: (holdings) {
        state = state.copyWith(
          isLoading: false,
          holdings: holdings,
        );
      },
      failure: (error) {
        state = state.copyWith(
          isLoading: false,
          error: error.message,
        );
      },
    );
  }

  Future<void> loadPositions(String brokerCode) async {
    state = state.copyWith(isLoading: true);

    final result = await _brokerService.getPositions(brokerCode);

    result.when(
      success: (positions) {
        state = state.copyWith(
          isLoading: false,
          positions: positions,
        );
      },
      failure: (error) {
        state = state.copyWith(
          isLoading: false,
          error: error.message,
        );
      },
    );
  }

  Future<void> refresh() async {
    await loadPortfolio();
  }
}
