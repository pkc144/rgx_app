import React from 'react';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import Config from 'react-native-config';
import useModalStore from './modalStore';
import { useTrade } from '../screens/TradeContext';
import server from '../utils/serverConfig';
import { generateToken } from '../utils/SecurityTokenManager';
import { getAdvisorSubdomain } from '../utils/variantHelper';

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
import AxisConnectModal from '../components/BrokerConnectionModal/AxisConnectModal';


const ModalManager = () => {
  const visibleModal = useModalStore((state) => state.visibleModal);
  const closeModal = useModalStore((state) => state.closeModal);
  const setShowBrokerModal = useModalStore((state) => state.setShowBrokerModal);
  const { fetchBrokerStatusModal, userEmail } = useTrade();

  const onConnectionSuccess = async (brokerName) => {
    // 1. Refresh broker status / user data
    if (fetchBrokerStatusModal) {
      fetchBrokerStatusModal();
    }

    // 2. Send broker connection notification email
    try {
      await axios.post(
        `${server.server.baseUrl}api/comms/broker-connection-email`,
        { email: userEmail, brokerName },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Advisor-Subdomain': getAdvisorSubdomain(),
            'aq-encrypted-key': generateToken(
              Config.REACT_APP_AQ_KEYS,
              Config.REACT_APP_AQ_SECRET,
            ),
          },
        },
      );
    } catch (error) {
      console.error('Error sending broker connection email:', error);
    }

    // 3. Show success toast
    Toast.show({
      type: 'success',
      text1: 'Broker Connected',
      text2: `${brokerName} has been connected successfully.`,
    });
  };

  const commonProps = {
    isVisible: true,
    onClose: closeModal,
    setShowBrokerModal,
    fetchBrokerStatusModal,
    onConnectionSuccess,
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
      case 'IIFL':
      case 'IIFL Securities':
        return <IIFLModal {...commonProps} />;
      case 'Axis':
      case 'Axis Securities':
        return <AxisConnectModal {...commonProps} />;
      default:
        return null;
    }
  };

  return renderModal();
};

export default ModalManager;
