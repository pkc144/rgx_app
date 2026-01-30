/// Supported broker configurations
enum BrokerType {
  zerodha('zerodha', 'Zerodha', 'assets/icons/brokers/zerodha.png'),
  angelOne('angelone', 'Angel One', 'assets/icons/brokers/angelone.png'),
  upstox('upstox', 'Upstox', 'assets/icons/brokers/upstox.png'),
  icicidirect('icicidirect', 'ICICI Direct', 'assets/icons/brokers/icici.png'),
  hdfcSec('hdfcsec', 'HDFC Securities', 'assets/icons/brokers/hdfc.png'),
  iifl('iifl', 'IIFL Securities', 'assets/icons/brokers/iifl.png'),
  kotak('kotak', 'Kotak Securities', 'assets/icons/brokers/kotak.png'),
  dhan('dhan', 'Dhan', 'assets/icons/brokers/dhan.png'),
  aliceBlue('aliceblue', 'Alice Blue', 'assets/icons/brokers/aliceblue.png'),
  fyers('fyers', 'Fyers', 'assets/icons/brokers/fyers.png'),
  motilalOswal('motilaloswal', 'Motilal Oswal', 'assets/icons/brokers/motilal.png');

  final String code;
  final String displayName;
  final String iconPath;

  const BrokerType(this.code, this.displayName, this.iconPath);

  static BrokerType? fromCode(String code) {
    try {
      return BrokerType.values.firstWhere(
        (b) => b.code.toLowerCase() == code.toLowerCase(),
      );
    } catch (_) {
      return null;
    }
  }
}

/// Order types
enum OrderType {
  market('MARKET'),
  limit('LIMIT'),
  sl('SL'),
  slm('SL-M');

  final String value;
  const OrderType(this.value);
}

/// Transaction types
enum TransactionType {
  buy('BUY'),
  sell('SELL');

  final String value;
  const TransactionType(this.value);
}

/// Product types
enum ProductType {
  cnc('CNC'),       // Cash and Carry (Delivery)
  mis('MIS'),       // Margin Intraday Square-off
  nrml('NRML');     // Normal

  final String value;
  const ProductType(this.value);
}

/// Order status
enum OrderStatus {
  pending('PENDING'),
  open('OPEN'),
  complete('COMPLETE'),
  cancelled('CANCELLED'),
  rejected('REJECTED'),
  modified('MODIFIED');

  final String value;
  const OrderStatus(this.value);

  static OrderStatus fromString(String status) {
    return OrderStatus.values.firstWhere(
      (e) => e.value.toLowerCase() == status.toLowerCase(),
      orElse: () => OrderStatus.pending,
    );
  }
}
