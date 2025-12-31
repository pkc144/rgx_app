import { Platform } from 'react-native';

export const getDeepLink = (path = '') => {
  const scheme = 'app_name'; // Your scheme defined in AndroidManifest.xml
  const host = 'www.app_name.com'; // Your host
  const prefix = Platform.OS === 'android' ? `${scheme}://${host}` : `${scheme}://`;
  return `${prefix}${path}`;
};
