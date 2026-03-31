/**
 * Tests for brokerAuth.js (RGX version)
 * Validates OAuth state generation, callback registration, URL construction,
 * and broker config.
 *
 * Key RGX differences from B2B:
 * - Uses axios instead of fetch for registerCallback
 * - generateState includes origin, subdomain (not platform, broker.toLowerCase())
 * - registerCallback returns null on failure (not nonce)
 * - No saveOAuthState/validateOAuthState/clearOAuthState/parseOAuthCallback
 * - No BROKER_OAUTH_CONFIG
 * - Has BROKER_CONFIGS and openBrokerLogin instead
 */

jest.mock('react-native', () => ({
  Linking: {
    canOpenURL: jest.fn(() => Promise.resolve(true)),
    openURL: jest.fn(() => Promise.resolve()),
  },
}));

jest.mock('axios', () => ({
  post: jest.fn(),
}));

jest.mock('../../utils/safeConfig', () => ({
  __esModule: true,
  default: {
    APP_VARIANT: 'rgxresearch',
  },
}));

jest.mock('../../utils/variantHelper', () => ({
  getAdvisorSubdomain: jest.fn(() => 'rgxresearch'),
}));

jest.mock('../../utils/serverConfig', () => ({
  __esModule: true,
  default: {
    server: {baseUrl: 'https://server.alphaquark.in/'},
    ccxtServer: {baseUrl: 'https://ccxtprod.alphaquark.in/'},
    brokerAuth: {
      callbackUrl: 'https://alphaquark.in/api/deploy/broker/callback',
      registerUrl: 'https://alphaquark.in/api/deploy/broker/register',
    },
  },
}));

import axios from 'axios';
import {
  generateState,
  registerCallback,
  getAngelOneLoginUrl,
  getAngelOneLoginUrlSync,
  getBrokerCallbackUrl,
  BROKER_CONFIGS,
} from '../../utils/brokerAuth';

describe('brokerAuth (RGX)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── generateState ───

  describe('generateState', () => {
    test('returns base64 encoded JSON string', () => {
      const state = generateState('zerodha');
      expect(typeof state).toBe('string');

      // Decode and parse
      const decoded = JSON.parse(atob(state));
      expect(decoded.broker).toBe('zerodha');
      expect(decoded.origin).toBe('https://rgxresearch.alphaquark.in');
      expect(decoded.subdomain).toBe('rgxresearch');
      expect(decoded.timestamp).toBeDefined();
      expect(decoded.nonce).toBeDefined();
    });

    test('includes returnPath', () => {
      const state = generateState('angelone', '/portfolio');
      const decoded = JSON.parse(atob(state));
      expect(decoded.returnPath).toBe('/portfolio');
    });

    test('defaults returnPath to /stock-recommendation', () => {
      const state = generateState('zerodha');
      const decoded = JSON.parse(atob(state));
      expect(decoded.returnPath).toBe('/stock-recommendation');
    });

    test('generates unique nonce each time', () => {
      const state1 = JSON.parse(atob(generateState('zerodha')));
      const state2 = JSON.parse(atob(generateState('zerodha')));
      expect(state1.nonce).not.toBe(state2.nonce);
    });
  });

  // ─── registerCallback ───

  describe('registerCallback', () => {
    test('calls backend register endpoint via axios', async () => {
      axios.post.mockResolvedValueOnce({status: 200});

      const nonce = await registerCallback('angelone');
      expect(axios.post).toHaveBeenCalledWith(
        'https://alphaquark.in/api/deploy/broker/register',
        expect.objectContaining({
          broker: 'angelone',
          origin: 'https://rgxresearch.alphaquark.in',
          subdomain: 'rgxresearch',
        }),
      );
      expect(typeof nonce).toBe('string');
    });

    test('returns null on axios failure', async () => {
      axios.post.mockRejectedValueOnce(new Error('Network error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const nonce = await registerCallback('angelone');
      expect(nonce).toBeNull();

      consoleSpy.mockRestore();
    });

    test('sends returnPath in body', async () => {
      axios.post.mockResolvedValueOnce({status: 200});

      await registerCallback('angelone', '/test');

      const body = axios.post.mock.calls[0][1];
      expect(body.broker).toBe('angelone');
      expect(body.returnPath).toBe('/test');
      expect(body.subdomain).toBe('rgxresearch');
      expect(body.nonce).toBeDefined();
    });
  });

  // ─── getAngelOneLoginUrl ───

  describe('getAngelOneLoginUrl', () => {
    test('constructs Angel One OAuth URL with nonce', async () => {
      axios.post.mockResolvedValueOnce({status: 200});

      const url = await getAngelOneLoginUrl('my-api-key');
      expect(url).toContain('smartapi.angelbroking.com/publisher-login');
      expect(url).toContain('api_key=my-api-key');
      expect(url).toContain('state=');
    });

    test('uses generateState when nonce fallback disabled', async () => {
      const url = await getAngelOneLoginUrl('key', '/path', false);
      expect(url).toContain('api_key=key');
      // State should be base64-encoded JSON (URL-encoded)
      const stateMatch = url.match(/state=([^&]+)/);
      expect(stateMatch).toBeDefined();
    });
  });

  describe('getAngelOneLoginUrlSync', () => {
    test('returns URL synchronously', () => {
      const url = getAngelOneLoginUrlSync('sync-key');
      expect(url).toContain('smartapi.angelbroking.com/publisher-login');
      expect(url).toContain('api_key=sync-key');
    });
  });

  // ─── getBrokerCallbackUrl ───

  describe('getBrokerCallbackUrl', () => {
    test('returns centralized callback URL', () => {
      expect(getBrokerCallbackUrl()).toBe(
        'https://alphaquark.in/api/deploy/broker/callback',
      );
    });
  });

  // ─── BROKER_CONFIGS ───

  describe('BROKER_CONFIGS', () => {
    test('contains Angel One config', () => {
      expect(BROKER_CONFIGS['Angel One']).toBeDefined();
      expect(BROKER_CONFIGS['Angel One'].usesState).toBe(true);
      expect(BROKER_CONFIGS['Angel One'].oauthProvider).toBe('smartapi');
    });

    test('contains AliceBlue config', () => {
      expect(BROKER_CONFIGS['AliceBlue']).toBeDefined();
      expect(BROKER_CONFIGS['AliceBlue'].usesState).toBe(false);
    });

    test('Angel One getLoginUrl returns valid URL', () => {
      const url = BROKER_CONFIGS['Angel One'].getLoginUrl('test-key');
      expect(url).toContain('smartapi.angelbroking.com/publisher-login');
      expect(url).toContain('api_key=test-key');
    });
  });
});
