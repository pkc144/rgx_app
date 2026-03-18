import axios from 'axios';
import server from '../utils/serverConfig';
import Config from 'react-native-config';
import {generateToken} from '../utils/SecurityTokenManager';
import {getAdvisorSubdomain} from '../utils/variantHelper';

// Server fetches apiKey/secretKey from DB using userEmail
// We only need to pass accessToken, userEmail, and broker-specific identifiers
export const fetchBrokerAllHoldings = async (
  broker,
  clientCode,
  apiKey, // kept for backward compatibility but not used
  jwtToken,
  secretKey, // kept for backward compatibility but not used
  sid,
  serverId,
  userEmail,
) => {
  if (!broker) {
    console.log('[fetchAllHoldings] No broker provided, skipping API call.');
    return null;
  }

  let data, url;

  switch (broker) {
    case 'IIFL Securities':
      if (!jwtToken) return;
      data = JSON.stringify({
        accessToken: jwtToken,
        userEmail,
      });
      url = `${server.ccxtServer.baseUrl}iifl/all-holdings`;
      break;
    case 'ICICI Direct':
      if (!jwtToken) return;
      data = JSON.stringify({
        accessToken: jwtToken,
        exchange: 'NSE',
        userEmail,
      });
      url = `${server.ccxtServer.baseUrl}icici/all-holdings`;
      break;
    case 'Upstox':
      if (!jwtToken) return;
      data = JSON.stringify({
        accessToken: jwtToken,
        userEmail,
      });
      url = `${server.ccxtServer.baseUrl}upstox/all-holdings`;
      break;
    case 'Angel One':
      if (!jwtToken) return;
      data = JSON.stringify({
        accessToken: jwtToken,
        userEmail,
      });
      url = `${server.ccxtServer.baseUrl}angelone/all-holdings`;
      break;
    case 'Motilal Oswal':
      if (!jwtToken) return;
      data = JSON.stringify({
        clientCode: clientCode,
        accessToken: jwtToken,
        userEmail,
      });
      url = `${server.ccxtServer.baseUrl}motilal-oswal/all-holdings`;
      break;
    case 'Zerodha':
      if (!jwtToken) return;
      data = JSON.stringify({
        accessToken: jwtToken,
        userEmail,
      });
      url = `${server.ccxtServer.baseUrl}zerodha/all-holdings`;
      break;
    case 'Hdfc Securities':
      if (!jwtToken) return;
      data = JSON.stringify({
        accessToken: jwtToken,
        userEmail,
      });
      url = `${server.ccxtServer.baseUrl}hdfc/all-holdings`;
      break;
    case 'Kotak':
      if (!jwtToken) return;
      data = JSON.stringify({
        accessToken: jwtToken,
        sid,
        serverId: serverId ? serverId : '',
        userEmail,
      });
      url = `${server.ccxtServer.baseUrl}kotak/all-holdings`;
      break;
    case 'Dhan':
      if (!jwtToken) return;
      data = JSON.stringify({
        clientId: clientCode,
        accessToken: jwtToken,
        userEmail,
      });
      url = `${server.ccxtServer.baseUrl}dhan/all-holdings`;
      break;
    case 'Groww':
      if (!jwtToken) return;
      data = JSON.stringify({
        accessToken: jwtToken,
        userEmail,
      });
      url = `${server.ccxtServer.baseUrl}groww/all-holdings`;
      break;
    case 'AliceBlue':
      if (!jwtToken) return;
      data = JSON.stringify({
        clientId: clientCode,
        accessToken: jwtToken,
        userEmail,
      });
      url = `${server.ccxtServer.baseUrl}aliceblue/all-holdings`;
      break;
    case 'Fyers':
      if (!jwtToken) return;
      data = JSON.stringify({
        clientId: clientCode,
        accessToken: jwtToken,
        userEmail,
      });
      url = `${server.ccxtServer.baseUrl}fyers/all-holdings`;
      break;
    default:
      return; // If the broker is not recognized
  }

  try {
    const response = await axios.post(url, data, {
      headers: {
        'Content-Type': 'application/json',
        'X-Advisor-Subdomain': getAdvisorSubdomain(),
        'aq-encrypted-key': generateToken(
          Config.REACT_APP_AQ_KEYS,
          Config.REACT_APP_AQ_SECRET,
        ),
      },
    });

    return response.data;
  } catch (error) {
    console.error(error);
    return null;
  }
};
