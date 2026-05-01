import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  AppState,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  PermissionStatus,
  isCountryAllowed,
  requestLocationPermission,
  resolveUserCountry,
} from '../services/LocationService';

const GateState = {
  CHECKING: 'checking',
  PERMISSION_DENIED: 'permission_denied',
  PERMISSION_BLOCKED: 'permission_blocked',
  LOCATION_UNAVAILABLE: 'location_unavailable',
  OUT_OF_REGION: 'out_of_region',
  ALLOWED: 'allowed',
};

const RegionGate = ({children}) => {
  const [state, setState] = useState(GateState.CHECKING);
  const [country, setCountry] = useState(null);
  const appStateRef = useRef(AppState.currentState);

  const runCheck = useCallback(async () => {
    setState(GateState.CHECKING);
    try {
      const permission = await requestLocationPermission();
      if (permission === PermissionStatus.BLOCKED) {
        setState(GateState.PERMISSION_BLOCKED);
        return;
      }
      if (permission !== PermissionStatus.GRANTED) {
        setState(GateState.PERMISSION_DENIED);
        return;
      }

      const result = await resolveUserCountry();
      setCountry(result.country);
      if (isCountryAllowed(result.country)) {
        setState(GateState.ALLOWED);
      } else {
        setState(GateState.OUT_OF_REGION);
      }
    } catch (_) {
      setState(GateState.LOCATION_UNAVAILABLE);
    }
  }, []);

  useEffect(() => {
    runCheck();
  }, [runCheck]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', nextState => {
      const prev = appStateRef.current;
      appStateRef.current = nextState;
      if (prev.match(/inactive|background/) && nextState === 'active') {
        runCheck();
      }
    });
    return () => sub.remove();
  }, [runCheck]);

  if (state === GateState.ALLOWED) {
    return children;
  }

  if (state === GateState.CHECKING) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0056B7" />
        <Text style={styles.subtitle}>Verifying your region…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{titleFor(state)}</Text>
      <Text style={styles.message}>{messageFor(state, country)}</Text>
      {actionFor(state, runCheck)}
    </View>
  );
};

function titleFor(state) {
  switch (state) {
    case GateState.OUT_OF_REGION:
      return 'Not available in your region';
    case GateState.PERMISSION_DENIED:
    case GateState.PERMISSION_BLOCKED:
      return 'Location permission required';
    case GateState.LOCATION_UNAVAILABLE:
    default:
      return 'Unable to verify your region';
  }
}

function messageFor(state, country) {
  switch (state) {
    case GateState.OUT_OF_REGION:
      return `EquityPro provides SEBI-regulated research and advisory services available only to users located in India. Detected region: ${
        country || 'unknown'
      }.`;
    case GateState.PERMISSION_DENIED:
      return 'We need your location to confirm you are in a region where our services are licensed. Please grant location access to continue.';
    case GateState.PERMISSION_BLOCKED:
      return 'Location access is disabled. Please enable it in Settings to use EquityPro.';
    case GateState.LOCATION_UNAVAILABLE:
    default:
      return 'We could not determine your location. Please ensure location services are enabled and try again.';
  }
}

function actionFor(state, retry) {
  if (state === GateState.PERMISSION_BLOCKED) {
    return (
      <TouchableOpacity
        style={styles.button}
        onPress={() => Linking.openSettings()}>
        <Text style={styles.buttonText}>Open Settings</Text>
      </TouchableOpacity>
    );
  }
  if (state === GateState.OUT_OF_REGION) {
    return null;
  }
  return (
    <TouchableOpacity style={styles.button} onPress={retry}>
      <Text style={styles.buttonText}>Try Again</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0F1B2D',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#5A6B7B',
    marginTop: 16,
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    color: '#465465',
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#0056B7',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default RegionGate;
