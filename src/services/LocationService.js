import {Platform, PermissionsAndroid} from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import axios from 'axios';

export const ALLOWED_COUNTRIES = ['IN'];

const INDIA_BOUNDING_BOX = {
  minLat: 6.5,
  maxLat: 37.6,
  minLon: 68.0,
  maxLon: 97.5,
};

export const PermissionStatus = {
  GRANTED: 'granted',
  DENIED: 'denied',
  BLOCKED: 'blocked',
};

export async function requestLocationPermission() {
  if (Platform.OS === 'ios') {
    const result = await Geolocation.requestAuthorization('whenInUse');
    if (result === 'granted') return PermissionStatus.GRANTED;
    if (result === 'denied') return PermissionStatus.DENIED;
    return PermissionStatus.BLOCKED;
  }

  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    {
      title: 'Location Required',
      message:
        'EquityPro needs your location to confirm your region as required by financial regulations.',
      buttonPositive: 'Allow',
      buttonNegative: 'Cancel',
    },
  );

  if (granted === PermissionsAndroid.RESULTS.GRANTED) {
    return PermissionStatus.GRANTED;
  }
  if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
    return PermissionStatus.BLOCKED;
  }
  return PermissionStatus.DENIED;
}

function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      pos => resolve(pos),
      err => reject(err),
      {
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 5 * 60 * 1000,
      },
    );
  });
}

async function reverseGeocodeToCountry(latitude, longitude) {
  try {
    const response = await axios.get(
      'https://api.bigdatacloud.net/data/reverse-geocode-client',
      {
        params: {latitude, longitude, localityLanguage: 'en'},
        timeout: 8000,
      },
    );
    const code = response?.data?.countryCode;
    if (code && typeof code === 'string') {
      return code.toUpperCase();
    }
  } catch (_) {
    // fall through to bounding box
  }
  return null;
}

function isInsideIndiaBoundingBox(latitude, longitude) {
  return (
    latitude >= INDIA_BOUNDING_BOX.minLat &&
    latitude <= INDIA_BOUNDING_BOX.maxLat &&
    longitude >= INDIA_BOUNDING_BOX.minLon &&
    longitude <= INDIA_BOUNDING_BOX.maxLon
  );
}

export async function resolveUserCountry() {
  const position = await getCurrentPosition();
  const {latitude, longitude} = position.coords;

  const country = await reverseGeocodeToCountry(latitude, longitude);
  if (country) {
    return {country, source: 'reverseGeocode', latitude, longitude};
  }

  if (isInsideIndiaBoundingBox(latitude, longitude)) {
    return {country: 'IN', source: 'boundingBox', latitude, longitude};
  }

  return {country: null, source: 'boundingBox', latitude, longitude};
}

export function isCountryAllowed(country) {
  return !!country && ALLOWED_COUNTRIES.includes(country);
}
