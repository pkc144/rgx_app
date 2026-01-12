import React from 'react';
import useModalStore from './modalStore';
import { useTrade } from '../screens/TradeContext';

// Lazy import modals
import IIFLModal from '../components/iiflmodal';
import ICICIUPModal from '../components/BrokerConnectionModal/icicimodal';
import UpstoxModal from '../components/BrokerConnectionModal/upstoxModal';
import AngleOneBookingTrueSheet from '../components/BrokerConnectionModal/AngleoneBookingModal';
import MotilalModal from '../components/BrokerConnectionModal/MotilalModal';
import ZerodhaConnectModal from '../components/BrokerConnectionModal/ZerodhaConnectModal';
import HDFCconnectModal from '../components/BrokerConnectionModal/HDFCconnectModal';
import DhanConnectModal from '../components/BrokerConnectionModal/DhanConnectModal';
import AliceBlueConnect from '../components/BrokerConnectionModal/AliceBlueConnect';
import FyersConnect from '../components/BrokerConnectionModal/FyersConnect';
import KotakModal from '../components/BrokerConnectionModal/KotakModal';
import GrowwConnectModal from '../components/BrokerConnectionModal/GrowwConnectModal';


const ModalManager = () => {
  const visibleModal = useModalStore((state) => state.visibleModal);
  const closeModal = useModalStore((state) => state.closeModal);
  const setShowBrokerModal = useModalStore((state) => state.setShowBrokerModal);
  const { fetchBrokerStatusModal } = useTrade();

  const commonProps = {
    isVisible: true,
    onClose: closeModal,
    setShowBrokerModal,
    fetchBrokerStatusModal,
  };

  const renderModal = () => {
    switch (visibleModal) {
      case 'ICICI':
        return <ICICIUPModal {...commonProps} />;
      case 'Upstox':
        return <UpstoxModal {...commonProps} />;
      case 'Angel One':
        return <AngleOneBookingTrueSheet {...commonProps} />;
      case 'Motilal':
        return <MotilalModal {...commonProps} />;
      case 'Zerodha':
        return <ZerodhaConnectModal {...commonProps} />;
      case 'HDFC':
        return <HDFCconnectModal {...commonProps} />;
      case 'Dhan':
        return <DhanConnectModal {...commonProps} />;
      case 'AliceBlue':
        return <AliceBlueConnect {...commonProps} />;
      case 'Fyers':
        return <FyersConnect {...commonProps} />;
      case 'Kotak':
        return <KotakModal {...commonProps} />;
      case 'Groww':
        return <GrowwConnectModal {...commonProps} />;
      default:
        return null;
    }
  };

  return renderModal();
};

export default ModalManager;
