/**
 * Broker display config — single source of truth for which brokers appear
 * in `BrokerSelectionModal` and in what order.
 *
 * To hide a broker: comment out or remove its entry.
 * To reorder: move the entry.
 * To re-enable Angel One: uncomment the entry below.
 *
 * `key` must match the key used by `GlobalUIModals/ModalManager.js` —
 * it is what `openModal(key)` dispatches to route to the per-broker modal.
 */

export const brokerDisplayConfig = [
  {
    name: 'AngelOne',
    key: 'Angel One',
    logo: require('../assets/AngleLogo.png'),
  },
  {
    name: 'Zerodha',
    key: 'Zerodha',
    logo: require('../assets/Zerodha.png'),
  },
  {
    name: 'ICICI',
    key: 'ICICI',
    logo: require('../assets/icici.png'),
  },
  {
    name: 'Upstox',
    key: 'Upstox',
    logo: require('../assets/upstox.png'),
  },
  {
    name: 'Kotak',
    key: 'Kotak',
    logo: require('../assets/kotak_securities.png'),
  },
  {
    name: 'Hdfc',
    key: 'HDFC',
    logo: require('../assets/hdfc_securities.png'),
  },
  {
    name: 'Dhan',
    key: 'Dhan',
    logo: require('../assets/dhan.png'),
  },
  {
    name: 'AliceBlue',
    key: 'AliceBlue',
    logo: require('../assets/aliceblue.png'),
  },
  {
    name: 'Fyers',
    key: 'Fyers',
    logo: require('../assets/fyers.png'),
  },
  {
    // IIFL Securities — added to the picker 2026-07-13 (matches web
    // AllBrokerList). Fully wired: normalizeBrokerKey('IIFL Securities') → 'IIFL'
    // → <IIFLModal> in BrokerConnectModalDispatch. Motilal Oswal was removed
    // here the same day (de-listed on web 2026-06-13); its dispatch case +
    // normalize stay for already-connected users.
    name: 'IIFL Securities',
    key: 'IIFL Securities',
    logo: require('../assets/iifl.png'),
  },
  {
    name: 'Groww',
    key: 'Groww',
    logo: require('../assets/GrowwIcon.png'),
  },
  {
    name: 'Axis Securities',
    key: 'Axis Securities',
    logo: require('../assets/axis.png'),
  },
  {
    name: 'Arihant Capital',
    key: 'Arihant Capital',
    logo: require('../assets/arihant.png'),
  },
  {
    name: 'DefinEdge',
    key: 'DefinEdge Securities',
    logo: require('../assets/definedge.png'),
  },
];

export default brokerDisplayConfig;
