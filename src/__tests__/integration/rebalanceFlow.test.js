/**
 * Integration test: Rebalance payload flow
 *
 * Tests the rebalance flow: payload building -> API call pattern,
 * across multiple broker configurations.
 *
 * Note: computeRebalanceDiff/summarizeRebalanceDiff tests removed
 * (rebalanceDiffUtils module does not exist in RGX).
 */

jest.mock('react-native-crypto-js');

import {
  buildBrokerPayloadFields,
  isFundsErrorOrMissing,
  checkPortfolioShortfall,
  isRebalanceErrorResponse,
} from '../../utils/rebalanceHelpers';

describe('Integration: Rebalance Flow', () => {
  const mockDecrypt = val => `dec_${val}`;

  // ─── Scenario: Shortfall Detection ───

  describe('portfolio shortfall detection', () => {
    test('detects shortfall and still allows trade execution', () => {
      const response = {
        totalValue: 30000,
        minInvestmentValue: 50000,
        buy: [{symbol: 'RELIANCE', quantity: 5}],
        sell: [],
      };

      const shortfall = checkPortfolioShortfall(response);
      expect(shortfall.isShortfall).toBe(true);
      expect(shortfall.hasTrades).toBe(true);
      // Shortfall is a warning, not a blocker -- trades should still proceed
    });
  });

  // ─── Scenario: Funds Validation Before Rebalance ───

  describe('funds validation before rebalance', () => {
    test('connected broker with valid funds -> proceed', () => {
      expect(
        isFundsErrorOrMissing({status: 0, data: {availablecash: 100000}}, 'connected'),
      ).toBe(false);
    });

    test('expired token -> block rebalance', () => {
      expect(isFundsErrorOrMissing({status: 1}, 'connected')).toBe(true);
    });

    test('disconnected broker -> do not treat as funds error (boolean helper)', () => {
      expect(isFundsErrorOrMissing(null, 'disconnected')).toBe(false);
    });
  });

  // ─── Scenario: Error Response Handling ───

  describe('rebalance error responses', () => {
    test('status 1 and 2 are errors', () => {
      expect(isRebalanceErrorResponse({status: 1, message: 'Token expired'})).toBe(true);
      expect(isRebalanceErrorResponse({status: 2, message: 'Server error'})).toBe(true);
    });

    test('status 0 is success', () => {
      expect(isRebalanceErrorResponse({status: 0, buy: [], sell: []})).toBe(false);
    });
  });

  // ─── Scenario: Multi-Broker Payload Consistency ───

  describe('multi-broker payload consistency with rebalance', () => {
    test('Zerodha rebalance payload has only accessToken', () => {
      const payload = buildBrokerPayloadFields('Zerodha', {jwtToken: 'zt'}, mockDecrypt);
      expect(Object.keys(payload)).toEqual(['accessToken']);
    });

    test('Kotak rebalance payload has 6 fields', () => {
      const payload = buildBrokerPayloadFields('Kotak', {
        apiKey: 'enc', secretKey: 'enc', jwtToken: 'kt',
        sid: 'sid1', serverId: 'srv1', viewToken: 'vt1',
      }, mockDecrypt);
      expect(Object.keys(payload)).toHaveLength(6);
      expect(payload.consumerKey).toBeDefined();
      expect(payload.sid).toBe('sid1');
    });

    test('Dhan rebalance payload maps clientCode -> clientId', () => {
      const payload = buildBrokerPayloadFields('Dhan', {
        clientCode: 'DH001', jwtToken: 'dt',
      }, mockDecrypt);
      expect(payload.clientId).toBe('DH001');
      expect(payload.accessToken).toBe('dt');
    });
  });
});
