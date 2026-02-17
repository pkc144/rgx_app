import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Alert,
} from 'react-native';
import { getAuth } from '@react-native-firebase/auth';
import axios from 'axios';
import server from '../../utils/serverConfig';
import Config from 'react-native-config';
import { generateToken } from '../../utils/SecurityTokenManager';
import { getAdvisorSubdomain } from '../../utils/variantHelper';
import { useTrade } from '../TradeContext';

const ManageConnectionsModal = ({
  visible,
  onClose,
  onConnectionRemoved,
}) => {
  const [loading, setLoading] = useState(true);
  const [connections, setConnections] = useState([]);
  const [removing, setRemoving] = useState(null);
  const { configData, broker: currentBroker } = useTrade();

  const auth = getAuth();
  const user = auth.currentUser;
  const userEmail = user?.email;

  const fetchConnections = async () => {
    if (!userEmail) return;

    setLoading(true);
    try {
      const response = await axios.post(
        `${server.ccxtServer.baseUrl}rebalance/list-broker-connections`,
        { user_email: userEmail, current_broker: currentBroker },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Advisor-Subdomain': configData?.config?.REACT_APP_HEADER_NAME || getAdvisorSubdomain(),
            'aq-encrypted-key': generateToken(
              Config.REACT_APP_AQ_KEYS,
              Config.REACT_APP_AQ_SECRET,
            ),
          },
        }
      );

      if (response.data?.connected_brokers) {
        setConnections(response.data.connected_brokers);
      }
    } catch (error) {
      console.error('[ManageConnections] Failed to fetch:', error);
      Alert.alert('Error', 'Failed to load connections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible && userEmail) {
      fetchConnections();
    }
  }, [visible, userEmail]);

  const handleDisconnect = async (broker) => {
    Alert.alert(
      'Disconnect Broker',
      `Are you sure you want to disconnect ${broker}? This will remove the connection and allow you to reconnect.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            setRemoving(broker);
            try {
              await axios.post(
                `${server.ccxtServer.baseUrl}rebalance/disconnect-broker`,
                { user_email: userEmail, user_broker: broker },
                {
                  headers: {
                    'Content-Type': 'application/json',
                    'X-Advisor-Subdomain': configData?.config?.REACT_APP_HEADER_NAME || getAdvisorSubdomain(),
                    'aq-encrypted-key': generateToken(
                      Config.REACT_APP_AQ_KEYS,
                      Config.REACT_APP_AQ_SECRET,
                    ),
                  },
                }
              );

              // Remove from local list
              setConnections(prev => prev.filter(c => c.broker !== broker));
              onConnectionRemoved?.(broker);
              Alert.alert('Success', `${broker} disconnected successfully`);
            } catch (error) {
              console.error('[ManageConnections] Disconnect failed:', error);
              Alert.alert('Error', 'Failed to disconnect. Please try again.');
            } finally {
              setRemoving(null);
            }
          },
        },
      ]
    );
  };

  const renderConnection = ({ item }) => (
    <View style={styles.connectionItem}>
      <View style={styles.connectionInfo}>
        <Text style={styles.brokerName}>{item.broker}</Text>
        {item.is_active && (
          <View style={styles.activeBadge}>
            <Text style={styles.activeBadgeText}>Active</Text>
          </View>
        )}
        {item.has_credentials && !item.is_active && (
          <View style={styles.credentialsBadge}>
            <Text style={styles.credentialsBadgeText}>Stored Credentials</Text>
          </View>
        )}
      </View>
      <TouchableOpacity
        style={[styles.disconnectBtn, removing === item.broker && styles.disconnectBtnDisabled]}
        onPress={() => handleDisconnect(item.broker)}
        disabled={removing === item.broker}
      >
        {removing === item.broker ? (
          <ActivityIndicator size="small" color="#dc2626" />
        ) : (
          <Text style={styles.disconnectBtnText}>Remove</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Manage Connections</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Manage your broker connections. Remove connections to free up slots for OAuth-based brokers like Groww.
          </Text>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0056B7" />
            </View>
          ) : connections.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No broker connections found</Text>
            </View>
          ) : (
            <FlatList
              data={connections}
              renderItem={renderConnection}
              keyExtractor={item => item.broker}
              style={styles.list}
            />
          )}

          <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  closeBtn: {
    padding: 4,
  },
  closeBtnText: {
    fontSize: 20,
    color: '#6b7280',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    paddingHorizontal: 20,
    paddingTop: 12,
    lineHeight: 20,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  connectionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  connectionInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  brokerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  activeBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  activeBadgeText: {
    fontSize: 12,
    color: '#166534',
    fontWeight: '500',
  },
  credentialsBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  credentialsBadgeText: {
    fontSize: 12,
    color: '#92400e',
    fontWeight: '500',
  },
  disconnectBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#dc2626',
  },
  disconnectBtnDisabled: {
    opacity: 0.5,
  },
  disconnectBtnText: {
    fontSize: 14,
    color: '#dc2626',
    fontWeight: '500',
  },
  doneBtn: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: '#0056B7',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  doneBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default ManageConnectionsModal;
