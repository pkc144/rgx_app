import axios from 'axios';
import CryptoJS from 'react-native-crypto-js';
import server from '../utils/serverConfig';
import Config from 'react-native-config';
import {generateToken} from '../utils/SecurityTokenManager';
import {useTrade} from '../screens/TradeContext';
const checkValidApiAnSecret = details => {
  try {
    const bytesKey = CryptoJS.AES.decrypt(details, 'ApiKeySecret');
    const Key = bytesKey.toString(CryptoJS.enc.Utf8); // Convert to UTF-8 string

    if (Key) {
      return Key;
    } else {
      throw new Error('Decryption failed or invalid key.');
    }
  } catch (error) {
    console.error('Error during decryption:', error.message);
    return null;
  }
};
// console.log('brokerrriiiiiiiiii--099999999999');
export const fetchFunds = async (
  broker,
  clientCode,
  apiKey,
  jwtToken,
  secretKey,
  sid,
  viewToken,
  serverId,
  configData,
) => {
  if (!broker) {
    return null;
  }

  let data, url;
  const angelApi = configData?.config?.REACT_APP_ANGEL_ONE_API_KEY;
  console.log('brokeerrrr:', broker);
  switch (broker) {
    case 'IIFL Securities':
      console.log('client', clientCode);
      data = JSON.stringify({clientCode});
      url = `${server.ccxtServer.baseUrl}iifl/margin`;
      break;
    case 'ICICI Direct':
      if (!apiKey || !jwtToken || !secretKey) return;
      data = JSON.stringify({
        apiKey: checkValidApiAnSecret(apiKey),
        accessToken: jwtToken,
        secretKey: checkValidApiAnSecret(secretKey),
      });
      url = `${server.ccxtServer.baseUrl}icici/funds`;
      break;
    case 'Upstox':
      if (!apiKey || !jwtToken || !secretKey) return;
      data = JSON.stringify({
        apiKey: checkValidApiAnSecret(apiKey),
        accessToken: jwtToken,
        apiSecret: checkValidApiAnSecret(secretKey),
      });
      url = `${server.ccxtServer.baseUrl}upstox/funds`;
      break;
    case 'Angel One':
      //console.log('AngelOne funds Details:',angelApi,jwtToken);
      if (!jwtToken) return;
      data = JSON.stringify({
        apiKey: angelApi,
        accessToken: jwtToken,
      });
      url = `${server.ccxtServer.baseUrl}angelone/funds`;
      break;
    case 'Zerodha':
      if (!jwtToken) return;
      data = JSON.stringify({
        apiKey: checkValidApiAnSecret(apiKey),
        secretkey: checkValidApiAnSecret(secretKey),
        accessToken: jwtToken,
      });
      // console.log('data f-:', data);
      url = `${server.ccxtServer.baseUrl}zerodha/funds`;
      break;
    case 'Hdfc Securities':
      // console.log('api:', checkValidApiAnSecret(apiKey), 'jwt:', jwtToken);
      if (!apiKey || !jwtToken) return;
      data = JSON.stringify({
        apiKey: checkValidApiAnSecret(apiKey),
        accessToken: jwtToken,
      });
      url = `${server.ccxtServer.baseUrl}hdfc/funds`;
      break;
    case 'Kotak':
      if (!jwtToken || !apiKey || !secretKey || !sid) return;
      data = JSON.stringify({
        consumerKey: checkValidApiAnSecret(apiKey),
        consumerSecret: checkValidApiAnSecret(secretKey),
        accessToken: jwtToken,
        sid,
        serverId: serverId ? serverId : '',
      });
      // console.log('dataaaa:', data);
      url = `${server.ccxtServer.baseUrl}kotak/funds`;
      break;
    case 'Dhan':
      //  console.log('Client:',clientCode,'JWT:',jwtToken);
      if (!clientCode || !jwtToken) return;
      data = JSON.stringify({
        clientId: clientCode,
        accessToken: jwtToken,
      });
      url = `${server.ccxtServer.baseUrl}dhan/funds`;
      break;
    case 'AliceBlue':
      console.log(
        'ClientCode:',
        clientCode,
        'jwt:',
        jwtToken,
        'apiKey:',
        apiKey,
      );
      if (!clientCode || !jwtToken || !apiKey) return;
      data = JSON.stringify({
        clientId: clientCode,
        apiKey: apiKey,
        accessToken: jwtToken,
      });
      url = `${server.ccxtServer.baseUrl}aliceblue/funds`;
      break;
    case 'Fyers':
      if (!jwtToken) return;
      data = JSON.stringify({
        clientId: clientCode,
        accessToken: jwtToken,
      });
      url = `${server.ccxtServer.baseUrl}fyers/funds`;
      break;
    case 'Groww':
      if (!jwtToken) return;
      data = JSON.stringify({
        accessToken: jwtToken,
      });
      url = `${server.ccxtServer.baseUrl}groww/funds`;
      break;
    case 'Motilal Oswal':
      if (!jwtToken) return;

      const cleanToken = jwtToken.replace(/^Bearer\s+/i, ''); // removes 'Bearer ' if present

      data = JSON.stringify({
        apiKey: checkValidApiAnSecret(apiKey),
        clientCode: clientCode,
        accessToken: cleanToken, // use the cleaned token
      });
      url = `${server.ccxtServer.baseUrl}motilal-oswal/funds`;
      break;

    default:
      return; // If the broker is not recognized
  }

  try {
    // console.log('datA:',data,'url:',url,checkValidApiAnSecret(apiKey),);
    const response = await axios.post(url, data, {
      headers: {
        'Content-Type': 'application/json',
        'X-Advisor-Subdomain': configData?.config?.REACT_APP_HEADER_NAME || 'common',
        'aq-encrypted-key': generateToken(
          Config.REACT_APP_AQ_KEYS,
          Config.REACT_APP_AQ_SECRET,
        ),
      },
    });

    return response.data;
  } catch (error) {
    console.error(error.response);
    return null;
  }
};
