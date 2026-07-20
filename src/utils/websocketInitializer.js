// Add this at the end of the same file or create useWebSocketInitializer.js
import { useEffect } from 'react';

import { useTrade } from '../screens/TradeContext';
import WebSocketManager from '../components/AdviceScreenComponents/DynamicText/WebSocketManager';
import { getAccountEmail } from '../utils/accountEmail';

export const useWebSocketInitializer = () => {
  const { configData } = useTrade();

  useEffect(() => {
    const userEmail = getAccountEmail();

    // Initialize WebSocketManager with config data
    WebSocketManager.initialize(configData, userEmail);
  }, [configData]);
};