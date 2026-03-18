import axios from 'axios';
import server from '../utils/serverConfig';
import Config from 'react-native-config';
import {generateToken} from '../utils/SecurityTokenManager';
import {getAdvisorSubdomain} from '../utils/variantHelper';

// Server fetches apiKey/secretKey from DB using userEmail
// We only need to pass accessToken, userEmail, and broker-specific identifiers
export const fetchBrokerSpecificHoldings = async (
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
    return null;
  }

  let data, url;

  switch (broker) {
    case 'IIFL Securities':
      if (!jwtToken) return null;
      data = JSON.stringify({
        accessToken: jwtToken,
        userEmail,
      });
      url = `${server.ccxtServer.baseUrl}iifl/holdings`;
      break;

    case 'ICICI Direct':
      if (!jwtToken) return null;
      data = JSON.stringify({
        accessToken: jwtToken,
        exchange: 'NSE',
        userEmail,
      });
      url = `${server.ccxtServer.baseUrl}icici/holdings`;
      break;

    case 'Upstox':
      if (!jwtToken) return null;
      data = JSON.stringify({
        accessToken: jwtToken,
        userEmail,
      });
      url = `${server.ccxtServer.baseUrl}upstox/holdings`;
      break;

    case 'Angel One':
      if (!jwtToken) return null;
      data = JSON.stringify({
        accessToken: jwtToken,
        userEmail,
      });
      url = `${server.ccxtServer.baseUrl}angelone/holdings`;
      break;

    case 'Zerodha':
      if (!jwtToken) return null;
      data = JSON.stringify({
        accessToken: jwtToken,
        userEmail,
      });
      url = `${server.ccxtServer.baseUrl}zerodha/holdings`;
      break;

    case 'Hdfc Securities':
      if (!jwtToken) return null;
      data = JSON.stringify({
        accessToken: jwtToken,
        userEmail,
      });
      url = `${server.ccxtServer.baseUrl}hdfc/holdings`;
      break;

    case 'Kotak':
      if (!jwtToken) return null;
      data = JSON.stringify({
        accessToken: jwtToken,
        sid,
        serverId: serverId || '',
        userEmail,
      });
      url = `${server.ccxtServer.baseUrl}kotak/holdings`;
      break;

    case 'Dhan':
      if (!jwtToken) return null;
      data = JSON.stringify({
        clientId: clientCode,
        accessToken: jwtToken,
        userEmail,
      });
      url = `${server.ccxtServer.baseUrl}dhan/holdings`;
      break;

    case 'AliceBlue':
      if (!jwtToken) return null;
      data = JSON.stringify({
        clientId: clientCode,
        accessToken: jwtToken,
        userEmail,
      });
      url = `${server.ccxtServer.baseUrl}aliceblue/holdings`;
      break;

    case 'Fyers':
      if (!jwtToken) return null;
      data = JSON.stringify({
        clientId: clientCode,
        accessToken: jwtToken,
        userEmail,
      });
      url = `${server.ccxtServer.baseUrl}fyers/holdings`;
      break;

    case 'Groww':
      if (!jwtToken) return null;
      data = JSON.stringify({
        accessToken: jwtToken,
        userEmail,
      });
      url = `${server.ccxtServer.baseUrl}groww/holdings`;
      break;

    case 'Motilal Oswal':
      if (!jwtToken) return null;
      data = JSON.stringify({
        clientCode: clientCode,
        accessToken: jwtToken,
        userEmail,
      });
      url = `${server.ccxtServer.baseUrl}motilal-oswal/holdings`;
      break;

    default:
      return null;
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
