/**
 * Tests for storageUtils.js (RGX version)
 * Validates AsyncStorage-based login data, config, and RA code management.
 *
 * Key RGX differences from B2B:
 * - No retry params on getConfigData/getRaId/getUserData/isUserDataComplete
 * - setConfigData uses setItem (not multiSet)
 * - getConfigData is a single read with no retry
 * - isUserDataComplete uses multiGet (not individual calls with retry)
 */

jest.mock('@react-native-async-storage/async-storage');
jest.mock('axios');
jest.mock('react-native-config', () => ({
  REACT_APP_AQ_KEYS: 'test-key',
  REACT_APP_AQ_SECRET: 'test-secret',
}));
jest.mock('../../utils/SecurityTokenManager', () => ({
  generateToken: jest.fn(() => 'mock-token'),
}));
jest.mock('../../utils/serverConfig', () => ({
  __esModule: true,
  default: {
    server: {baseUrl: 'https://server.alphaquark.in/'},
  },
}));
jest.mock('../../utils/variantHelper', () => ({
  getAdvisorSubdomain: jest.fn(() => 'rgxresearch'),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  storeLoginData,
  getConfigData,
  setConfigData,
  getRaId,
  setRaId,
  getUserData,
  setUserData,
  clearAllAppData,
  isUserDataComplete,
} from '../../utils/storageUtils';

describe('storageUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage._reset();
  });

  // ─── storeLoginData ───

  describe('storeLoginData', () => {
    test('stores raCode, userData, and advisorConfig atomically', async () => {
      const result = await storeLoginData({
        raCode: 'INA123456',
        userData: {email: 'test@test.com', name: 'Test'},
        advisorConfig: {config: {REACT_APP_HEADER_NAME: 'test'}},
      });

      expect(result).toBe(true);
      expect(AsyncStorage.multiSet).toHaveBeenCalled();
    });

    test('normalizes raCode to uppercase', async () => {
      await storeLoginData({
        raCode: 'ina123456',
        userData: {},
        advisorConfig: {},
      });

      const batchData = AsyncStorage.multiSet.mock.calls[0][0];
      const raEntry = batchData.find(([key]) => key === '@app:raId');
      expect(raEntry[1]).toBe('INA123456');
    });

    test('handles null raCode gracefully', async () => {
      const result = await storeLoginData({
        raCode: null,
        userData: {},
        advisorConfig: {},
      });
      expect(result).toBe(true);
    });

    test('returns false on storage error', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      AsyncStorage.multiSet.mockRejectedValueOnce(new Error('Storage full'));

      const result = await storeLoginData({
        raCode: 'TEST',
        userData: {},
        advisorConfig: {},
      });
      expect(result).toBe(false);
      consoleSpy.mockRestore();
    });
  });

  // ─── setRaId / getRaId ───

  describe('setRaId / getRaId', () => {
    test('stores and retrieves RA ID', async () => {
      await setRaId('INA123456');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@app:raId', 'INA123456');
    });

    test('normalizes to uppercase', async () => {
      await setRaId('ina123456');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@app:raId', 'INA123456');
    });

    test('rejects invalid RA ID', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const result = await setRaId(null);
      expect(result).toBe(false);
      consoleSpy.mockRestore();
    });

    test('getRaId returns stored value', async () => {
      AsyncStorage.getItem.mockResolvedValueOnce('INA123456');
      const raId = await getRaId();
      expect(raId).toBe('INA123456');
    });

    test('getRaId returns null when not set', async () => {
      AsyncStorage.getItem.mockResolvedValueOnce(null);
      const raId = await getRaId();
      expect(raId).toBeNull();
    });
  });

  // ─── setUserData / getUserData ───

  describe('setUserData / getUserData', () => {
    test('stores user data with timestamp', async () => {
      const result = await setUserData({email: 'test@test.com', name: 'Test'});
      expect(result).toBe(true);
      expect(AsyncStorage.setItem).toHaveBeenCalled();

      const storedValue = JSON.parse(AsyncStorage.setItem.mock.calls[0][1]);
      expect(storedValue.email).toBe('test@test.com');
      expect(storedValue.lastUpdated).toBeDefined();
    });

    test('getUserData parses stored JSON', async () => {
      const mockData = JSON.stringify({email: 'test@test.com', lastUpdated: '2024-01-01'});
      AsyncStorage.getItem.mockResolvedValueOnce(mockData);

      const userData = await getUserData();
      expect(userData.email).toBe('test@test.com');
    });

    test('getUserData returns null when not set', async () => {
      AsyncStorage.getItem.mockResolvedValueOnce(null);
      const userData = await getUserData();
      expect(userData).toBeNull();
    });
  });

  // ─── setConfigData / getConfigData ───

  describe('setConfigData / getConfigData', () => {
    test('setConfigData stores config successfully', async () => {
      const result = await setConfigData({
        config: {REACT_APP_HEADER_NAME: 'test-advisor'},
        advisorName: 'TestAdvisor',
      });
      expect(result).toBe(true);

      // RGX uses setItem (not multiSet) for config
      expect(AsyncStorage.setItem).toHaveBeenCalled();
      const storedKey = AsyncStorage.setItem.mock.calls[0][0];
      expect(storedKey).toBe('@app:advisorConfig');

      const parsedConfig = JSON.parse(AsyncStorage.setItem.mock.calls[0][1]);
      expect(parsedConfig.config.REACT_APP_HEADER_NAME).toBe('test-advisor');
    });

    test('getConfigData returns null when not set', async () => {
      AsyncStorage.getItem.mockResolvedValueOnce(null);

      const config = await getConfigData();
      expect(config).toBeNull();
    });

    test('setConfigData returns false on storage error', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      AsyncStorage.setItem.mockRejectedValueOnce(new Error('Storage full'));

      const result = await setConfigData({config: {}});
      expect(result).toBe(false);
      consoleSpy.mockRestore();
    });

    test('getConfigData enhances config with digio defaults', async () => {
      const storedConfig = JSON.stringify({
        config: {REACT_APP_HEADER_NAME: 'test'},
      });
      AsyncStorage.getItem.mockResolvedValueOnce(storedConfig);

      const config = await getConfigData();
      expect(config).toBeDefined();
      expect(config.digioCheck).toBeDefined();
      expect(config.digioEnabled).toBeDefined();
      expect(config.otpBasedAuthentication).toBeDefined();
    });
  });

  // ─── clearAllAppData ───

  describe('clearAllAppData', () => {
    test('clears all storage keys', async () => {
      const result = await clearAllAppData();
      expect(result).toBe(true);
      expect(AsyncStorage.multiRemove).toHaveBeenCalled();
    });

    test('handles clear errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      AsyncStorage.multiRemove.mockRejectedValueOnce(new Error('fail'));

      const result = await clearAllAppData();
      expect(result).toBe(false);
      consoleSpy.mockRestore();
    });
  });

  // ─── isUserDataComplete ───

  describe('isUserDataComplete', () => {
    test('returns correct structure with expected properties', async () => {
      // RGX uses multiGet for isUserDataComplete
      AsyncStorage.multiGet.mockResolvedValueOnce([
        ['@app:raId', null],
        ['@app:userData', null],
        ['@app:advisorConfig', null],
      ]);

      const result = await isUserDataComplete();
      expect(result).toHaveProperty('hasRAId');
      expect(result).toHaveProperty('hasUserData');
      expect(result).toHaveProperty('hasConfig');
      expect(result).toHaveProperty('isComplete');
      expect(typeof result.isComplete).toBe('boolean');
    });

    test('isComplete is true when all data is present', async () => {
      AsyncStorage.multiGet.mockResolvedValueOnce([
        ['@app:raId', 'INA123'],
        ['@app:userData', JSON.stringify({email: 'test@test.com'})],
        ['@app:advisorConfig', JSON.stringify({config: {}})],
      ]);

      const result = await isUserDataComplete();
      expect(result.isComplete).toBe(true);
      expect(result.hasRAId).toBe(true);
      expect(result.hasUserData).toBe(true);
      expect(result.hasConfig).toBe(true);
    });

    test('isComplete is false when data is missing', async () => {
      AsyncStorage.multiGet.mockResolvedValueOnce([
        ['@app:raId', 'INA123'],
        ['@app:userData', null],
        ['@app:advisorConfig', null],
      ]);

      const result = await isUserDataComplete();
      expect(result.isComplete).toBe(false);
    });
  });
});
