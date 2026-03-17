// utils/storageUtils.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import server from './serverConfig';
import Config from 'react-native-config';
import {generateToken} from './SecurityTokenManager';
import {getAdvisorSubdomain} from './variantHelper';

// Only 3 keys needed
const STORAGE_KEYS = {
  RA_ID: '@app:raId',
  USER_DATA: '@app:userData',
  ADVISOR_CONFIG: '@app:advisorConfig',
};

// Legacy keys to clean up on first login with new code
const LEGACY_KEYS = [
  '@app:headerName',
  '@app:advisorTag',
  '@app:advisorSpecificTag',
  '@app:advisorLogo',
  '@app:advisorName',
  '@app:appVariant',
  '@app:environment',
  '@app:adviceShowDays',
  '@app:whitelabelText',
  '@app:razorpayKey',
  '@app:configTimestamp',
  '@app:configVersion',
  '@app:modelPortfolio',
  '@app:bespokePlans',
  '@app:digioCheck',
  '@app:digioEnabled',
  '@app:otpBasedAuth',
];

// Store all login data in one atomic multiSet (3 keys only)
export const storeLoginData = async ({raCode, userData, advisorConfig}) => {
  try {
    const normalizedRaCode = raCode?.toUpperCase()?.trim();
    const batchData = [
      [STORAGE_KEYS.RA_ID, normalizedRaCode || ''],
      [STORAGE_KEYS.USER_DATA, JSON.stringify({
        ...userData,
        lastUpdated: new Date().toISOString(),
      })],
      [STORAGE_KEYS.ADVISOR_CONFIG, JSON.stringify(advisorConfig)],
    ];

    await AsyncStorage.multiSet(batchData);

    // Fire-and-forget: clean up legacy keys
    AsyncStorage.multiRemove(LEGACY_KEYS).catch(() => {});

    console.log('Login data stored successfully (3 keys)');
    return true;
  } catch (error) {
    console.error('Error storing login data:', error);
    return false;
  }
};

// Fallback: fetch config via separate API call, then store
export const checkAndFetchAdvisorConfig = async advisorRaCode => {
  try {
    if (!advisorRaCode) {
      return {
        success: false,
        error: 'No advisor RA code provided',
        advisorExists: false,
      };
    }

    const normalizedRaCode = advisorRaCode.toUpperCase().trim();

    const response = await axios.get(
      `${server.server.baseUrl}api/advisor-config-env/getConfig/${normalizedRaCode}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Advisor-Subdomain': 'common',
          'aq-encrypted-key': generateToken(
            Config.REACT_APP_AQ_KEYS,
            Config.REACT_APP_AQ_SECRET,
          ),
        },
        timeout: 15000,
      },
    );

    if (response.data?.msg === 'Advisor not found' || !response.data?.config) {
      return {
        success: false,
        error: 'Advisor not found',
        advisorExists: false,
      };
    }

    // Store config as single key
    await setConfigData(response.data);
    await setRaId(normalizedRaCode);

    return {
      success: true,
      configData: response.data,
      advisorExists: true,
    };
  } catch (error) {
    console.error('Error checking advisor config:', error);

    if (
      error.response?.status === 404 ||
      error.response?.data?.msg === 'Advisor not found'
    ) {
      return {
        success: false,
        error: 'Advisor not found',
        advisorExists: false,
      };
    }

    return {
      success: false,
      error: error.message || 'Network error',
      advisorExists: false,
    };
  }
};

// Get config data — single read, no retries
export const getConfigData = async () => {
  try {
    const configJson = await AsyncStorage.getItem(STORAGE_KEYS.ADVISOR_CONFIG);

    if (configJson) {
      const parsedConfig = JSON.parse(configJson);

      // Ensure Digio config is available at top level for easier access
      const enhancedConfig = {
        ...parsedConfig,
        digioCheck: parsedConfig.digioCheck || parsedConfig?.config?.REACT_APP_DIGIO_CHECK || 'beforePayment',
        digioEnabled: parsedConfig.digioEnabled !== undefined
          ? parsedConfig.digioEnabled
          : true,
        otpBasedAuthentication: parsedConfig.otpBasedAuthentication !== undefined
          ? parsedConfig.otpBasedAuthentication
          : false,
      };

      return enhancedConfig;
    }

    return null;
  } catch (error) {
    console.error('Error retrieving config data:', error);
    return null;
  }
};

// Store config data — single key write
export const setConfigData = async configData => {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEYS.ADVISOR_CONFIG,
      JSON.stringify(configData),
    );
    return true;
  } catch (error) {
    console.error('Error storing config data:', error);
    return false;
  }
};

// Get RA ID — single read
export const getRaId = async () => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.RA_ID);
  } catch (error) {
    console.error('Error retrieving RA ID:', error);
    return null;
  }
};

// Get user data — single read
export const getUserData = async () => {
  try {
    const userDataJson = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
    return userDataJson ? JSON.parse(userDataJson) : null;
  } catch (error) {
    console.error('Error retrieving user data:', error);
    return null;
  }
};

// Store RA ID
export const setRaId = async raId => {
  try {
    if (!raId || typeof raId !== 'string') {
      throw new Error('Invalid RA ID provided');
    }
    await AsyncStorage.setItem(STORAGE_KEYS.RA_ID, raId.toUpperCase().trim());
    return true;
  } catch (error) {
    console.error('Error storing RA ID:', error);
    return false;
  }
};

// Store user data
export const setUserData = async userData => {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEYS.USER_DATA,
      JSON.stringify({
        ...userData,
        lastUpdated: new Date().toISOString(),
      }),
    );
    return true;
  } catch (error) {
    console.error('Error storing user data:', error);
    return false;
  }
};

// Update RA Code and Config (used by ChangeAdvisor / SignUpRADetails)
export const updateRACodeAndConfig = async (newRACode, userEmail) => {
  try {
    if (!newRACode || !userEmail) {
      throw new Error('RA Code and User Email are required');
    }

    const normalizedRACode = newRACode.toUpperCase().trim();
    const normalizedEmail = userEmail.toLowerCase().trim();

    // Step 1: Check if advisor exists and fetch config
    const configResult = await checkAndFetchAdvisorConfig(normalizedRACode);

    if (!configResult.success) {
      return {
        success: false,
        error: configResult.error,
        advisorExists: configResult.advisorExists,
      };
    }

    // Step 2: Update RA code on server
    await axios.put(
      `${server.server.baseUrl}api/user/update/user-details`,
      {
        advisor_ra_code: normalizedRACode,
        email: normalizedEmail,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Advisor-Subdomain': getAdvisorSubdomain(),
          'aq-encrypted-key': generateToken(
            Config.REACT_APP_AQ_KEYS,
            Config.REACT_APP_AQ_SECRET,
          ),
        },
        timeout: 10000,
      },
    );

    // Step 3: Store user data
    await setUserData({
      raId: normalizedRACode,
      email: normalizedEmail,
      profileCompleted: true,
      configFetched: true,
      advisorName: configResult.configData?.advisorName || '',
    });

    return {
      success: true,
      configData: configResult.configData,
      advisorExists: true,
    };
  } catch (error) {
    let errorMessage = 'Failed to update RA Code';

    if (error.response) {
      errorMessage = `Server Error: ${error.response.status} - ${
        error.response.data?.message || error.message
      }`;
    } else if (error.request) {
      errorMessage = 'Network Error: Unable to connect to server';
    } else if (error.code === 'TIMEOUT') {
      errorMessage =
        'Request timed out. Please check your connection and try again.';
    } else {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
      advisorExists: false,
    };
  }
};

// Check if user data is complete — single pass, no retries
export const isUserDataComplete = async () => {
  try {
    const keys = [STORAGE_KEYS.RA_ID, STORAGE_KEYS.USER_DATA, STORAGE_KEYS.ADVISOR_CONFIG];
    const items = await AsyncStorage.multiGet(keys);

    const hasRAId = !!items[0][1];
    const hasUserData = !!items[1][1];
    const hasConfig = !!items[2][1];

    return {
      hasRAId,
      hasUserData,
      hasConfig,
      isComplete: hasRAId && hasUserData && hasConfig,
    };
  } catch (error) {
    console.error('Error checking user data completeness:', error);
    return {
      hasRAId: false,
      hasUserData: false,
      hasConfig: false,
      isComplete: false,
    };
  }
};

// Clear all app data
export const clearAllAppData = async () => {
  try {
    const keys = [...Object.values(STORAGE_KEYS), ...LEGACY_KEYS];
    await AsyncStorage.multiRemove(keys);
    console.log('Cleared all app data successfully');
    return true;
  } catch (error) {
    console.error('Error clearing app data:', error);
    return false;
  }
};

// Force refresh all app data
export const refreshAllAppData = async () => {
  try {
    return await isUserDataComplete();
  } catch (error) {
    console.error('Error refreshing app data:', error);
    return {isComplete: false};
  }
};

// Get all stored data (for debugging)
export const getAllStoredData = async () => {
  try {
    const keys = Object.values(STORAGE_KEYS);
    const items = await AsyncStorage.multiGet(keys);

    const data = {};
    items.forEach(([key, value]) => {
      data[key] = value;
    });

    return data;
  } catch (error) {
    console.error('Error getting all stored data:', error);
    return {};
  }
};
