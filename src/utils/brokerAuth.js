/**
 * Broker Authentication Utilities (React Native)
 *
 * Handles OAuth flow with centralized callback URL
 * Supports state parameter for multi-tenant routing
 *
 * Adapted from web version for React Native:
 * - Uses deep link scheme (rgxapp://) instead of window.location.origin
 * - Uses Linking.openURL for redirects instead of window.location.href
 * - Uses react-native-config for environment variables
 */

import { Linking } from 'react-native';
import axios from 'axios';
import Config from './safeConfig';
import { getAdvisorSubdomain } from './variantHelper';

const BROKER_CALLBACK_URL = 'https://alphaquark.in/api/deploy/broker/callback';
const BROKER_REGISTER_URL = 'https://alphaquark.in/api/deploy/broker/register';

const DEEP_LINK_SCHEME = 'rgxapp://';

/**
 * Generate a unique nonce for callback tracking
 */
const generateNonce = () => {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15) +
    Date.now().toString(36)
  );
};

/**
 * Generate state parameter for OAuth
 * Contains origin info for callback routing
 * Uses deep link scheme instead of window.location.origin
 */
export const generateState = (broker, returnPath = '/stock-recommendation') => {
  const stateData = {
    origin: DEEP_LINK_SCHEME,
    broker: broker,
    returnPath: returnPath,
    subdomain: getAdvisorSubdomain(),
    timestamp: Date.now(),
    nonce: generateNonce(),
  };
  return btoa(JSON.stringify(stateData));
};

/**
 * Register callback with backend (fallback for brokers that don't pass state)
 * Call this before redirecting to broker OAuth
 * Uses axios instead of fetch for React Native compatibility
 */
export const registerCallback = async (
  broker,
  returnPath = '/stock-recommendation',
) => {
  const nonce = generateNonce();

  try {
    const response = await axios.post(BROKER_REGISTER_URL, {
      origin: DEEP_LINK_SCHEME,
      broker,
      returnPath,
      subdomain: getAdvisorSubdomain(),
      nonce,
    });

    if (response.status === 200) {
      return nonce;
    }
  } catch (error) {
    console.error('Failed to register callback:', error);
  }

  return null;
};

/**
 * Get Angel One login URL with state parameter
 * @param {string} apiKey - Angel One API key
 * @param {string} returnPath - Path to return to after auth (default: /stock-recommendation)
 * @param {boolean} useNonceFallback - Register nonce as fallback if state not returned
 */
export const getAngelOneLoginUrl = async (
  apiKey,
  returnPath = '/stock-recommendation',
  useNonceFallback = true,
) => {
  const state = generateState('angelone', returnPath);

  // Register callback as fallback (in case Angel One doesn't return state)
  if (useNonceFallback) {
    const nonce = await registerCallback('angelone', returnPath);
    if (nonce) {
      // Use nonce as state (simpler, and backend can lookup)
      return `https://smartapi.angelbroking.com/publisher-login?api_key=${apiKey}&state=${nonce}`;
    }
  }

  // Use full state (if Angel One passes it back)
  return `https://smartapi.angelbroking.com/publisher-login?api_key=${apiKey}&state=${encodeURIComponent(state)}`;
};

/**
 * Get Angel One login URL (sync version - no fallback registration)
 */
export const getAngelOneLoginUrlSync = (
  apiKey,
  returnPath = '/stock-recommendation',
) => {
  const state = generateState('angelone', returnPath);
  return `https://smartapi.angelbroking.com/publisher-login?api_key=${apiKey}&state=${encodeURIComponent(state)}`;
};

/**
 * Open broker login URL in external browser via Linking.openURL
 * @param {string} url - The broker OAuth URL to open
 */
export const openBrokerLogin = async (url) => {
  try {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
      return true;
    } else {
      console.error('Cannot open broker login URL:', url);
      return false;
    }
  } catch (error) {
    console.error('Failed to open broker login URL:', error);
    return false;
  }
};

/**
 * Broker configurations
 */
export const BROKER_CONFIGS = {
  'Angel One': {
    getLoginUrl: (apiKey) => getAngelOneLoginUrlSync(apiKey),
    usesState: true,
    oauthProvider: 'smartapi',
  },
  // Add other brokers as needed
};

/**
 * Get the centralized callback URL
 */
export const getBrokerCallbackUrl = () => BROKER_CALLBACK_URL;

export default {
  generateState,
  registerCallback,
  getAngelOneLoginUrl,
  getAngelOneLoginUrlSync,
  openBrokerLogin,
  getBrokerCallbackUrl,
  BROKER_CONFIGS,
};
