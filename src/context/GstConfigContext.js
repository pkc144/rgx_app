import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import Config from 'react-native-config';
import { generateToken } from '../utils/SecurityTokenManager';
import { useTrade } from '../screens/TradeContext';

const GstConfigContext = createContext({
  gstConfigure: false,
  gstWithTextConfigure: false,
  isLoading: true,
});

export const useGstConfig = () => useContext(GstConfigContext);

export const GstConfigProvider = ({ children }) => {
  const [gstConfigure, setGstConfigure] = useState(false);
  const [gstWithTextConfigure, setGstWithTextConfigure] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { configData } = useTrade();

  useEffect(() => {
    const fetchGstConfig = async () => {
      try {
        const baseUrl =
          Config.REACT_APP_NODE_SERVER_API_URL || 'https://server.alphaquark.in/';
        const subdomain =
          Config.REACT_APP_ADVISOR_SUBDOMAIN ||
          Config.REACT_APP_HEADER_NAME ||
          'rgxresearch';

        const headers = {
          'Content-Type': 'application/json',
          'X-Advisor-Subdomain':
            Config.REACT_APP_X_ADVISOR_SUBDOMAIN ||
            Config.REACT_APP_HEADER_NAME ||
            subdomain,
          'aq-encrypted-key':
            Config.REACT_APP_AQ_ENCRYPTED_KEY ||
            generateToken(Config.REACT_APP_AQ_KEYS, Config.REACT_APP_AQ_SECRET),
        };

        const response = await axios.get(
          `${baseUrl}api/adminControl/get-gst-config`,
          { headers },
        );

        console.log('🔍 GST Config API raw response:', JSON.stringify(response.data));

        // Backend returns: { success, gstConfig: { gst_configure, gst_with_text_configure } }
        const gstConfig = response.data?.gstConfig;

        if (gstConfig) {
          const gst = gstConfig.gst_configure === true || gstConfig.gst_configure === 'true';
          const gstWithText = gstConfig.gst_with_text_configure === true || gstConfig.gst_with_text_configure === 'true';
          console.log('✅ GST Config parsed:', { gst_configure: gst, gst_with_text_configure: gstWithText });
          setGstConfigure(gst);
          setGstWithTextConfigure(gstWithText);
        }
      } catch (error) {
        console.warn('❌ GST config API failed, using fallback:', error.message, error.response?.status);
        // Fallback to configData from TradeContext
        const fallback = configData?.config?.REACT_APP_ADVISOR_GST_CONFIGURE;
        console.log('⚠️ GST fallback value:', fallback);
        setGstConfigure(fallback === 'true' || fallback === true);
        setGstWithTextConfigure(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGstConfig();
  }, [configData]);

  return (
    <GstConfigContext.Provider
      value={{ gstConfigure, gstWithTextConfigure, isLoading }}>
      {children}
    </GstConfigContext.Provider>
  );
};
