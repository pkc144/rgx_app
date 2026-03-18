/**
 * Pure helper functions extracted from RebalanceCard for testability.
 * (React Native adaptation of web version)
 */

/**
 * Check if funds data indicates an error or is missing.
 * Covers: null funds, undefined funds, status 1 (token error), status 2 (backend error).
 *
 * @param {Object|null|undefined} currentFunds - Funds response object
 * @param {string} brokerStatus - Broker connection status
 * @returns {boolean} True if funds are in an error state while broker is connected
 */
export function isFundsErrorOrMissing(currentFunds, brokerStatus) {
  return (
    (currentFunds?.status === 1 || currentFunds?.status === 2 || !currentFunds) &&
    brokerStatus === 'connected'
  );
}

/**
 * Check if a rebalance API response indicates a backend error.
 * Status 1 = error, Status 2 = backend error.
 *
 * @param {Object|null|undefined} responseData - The response.data from rebalance/calculate
 * @returns {boolean} True if the response indicates an error
 */
export function isRebalanceErrorResponse(responseData) {
  if (!responseData) return false;
  return responseData.status === 1 || responseData.status === 2;
}

/**
 * Check if an error message relates to a missing subscription amount.
 *
 * @param {string|null|undefined} message - Error message string
 * @returns {boolean} True if the message indicates a subscription amount issue
 */
export function isSubscriptionAmountError(message) {
  if (!message) return false;
  return (
    message.includes('subscription_amount_raw') ||
    message.includes('subscription amount') ||
    message.includes('not set or has been cleared')
  );
}

/**
 * Build broker-specific payload fields for the rebalance/calculate API.
 * Returns only the broker-specific fields to spread into the base payload.
 *
 * @param {string} broker - Broker name
 * @param {Object} credentials - Object containing clientCode, apiKey, secretKey, jwtToken, viewToken, sid, serverId
 * @param {Function} decryptFn - Function to decrypt api keys (checkValidApiAnSecret)
 * @param {string} angelOneApiKey - Angel One API key from env
 * @returns {Object} Broker-specific payload fields
 */
export function buildBrokerPayloadFields(broker, credentials, decryptFn, angelOneApiKey) {
  const {clientCode, apiKey, secretKey, jwtToken, viewToken, sid, serverId} = credentials;

  switch (broker) {
    case 'IIFL Securities':
      return {clientCode};
    case 'ICICI Direct':
      return {
        apiKey: decryptFn(apiKey),
        secretKey: decryptFn(secretKey),
        accessToken: jwtToken,
      };
    case 'Upstox':
      return {
        apiKey: decryptFn(apiKey),
        apiSecret: decryptFn(secretKey),
        accessToken: jwtToken,
      };
    case 'Angel One':
      return {
        apiKey: angelOneApiKey,
        jwtToken: jwtToken,
      };
    case 'Zerodha':
      return {accessToken: jwtToken};
    case 'Dhan':
      return {
        clientId: clientCode,
        accessToken: jwtToken,
      };
    case 'Groww':
      return {accessToken: jwtToken};
    case 'Hdfc Securities':
      return {
        apiKey: decryptFn(apiKey),
        accessToken: jwtToken,
      };
    case 'Kotak':
      return {
        consumerKey: decryptFn(apiKey),
        consumerSecret: decryptFn(secretKey),
        accessToken: jwtToken,
        viewToken,
        sid,
        serverId,
      };
    case 'AliceBlue':
      return {
        clientId: clientCode,
        accessToken: jwtToken,
        apiKey: apiKey,
      };
    case 'Fyers':
      return {
        clientId: clientCode,
        accessToken: jwtToken,
      };
    case 'Motilal Oswal':
      return {
        clientCode,
        accessToken: jwtToken,
        apiKey: decryptFn(apiKey),
      };
    default:
      return {};
  }
}
