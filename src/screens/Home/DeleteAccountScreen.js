/**
 * ============================================================================
 * DELETE ACCOUNT SCREEN - APPLE GUIDELINE 5.1.1 COMPLIANT
 * ============================================================================
 *
 * This screen provides a user-friendly interface for permanent account deletion
 * to comply with Apple App Store Review Guideline 5.1.1.
 *
 * FEATURES:
 * - Clear explanation of what will be deleted
 * - Destructive confirmation dialog
 * - Firebase re-authentication handling
 * - Proper loading states and error handling
 * - Complete logout and navigation reset after deletion
 *
 * ============================================================================
 */

import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
// LinearGradient import removed - using View with solid backgroundColor for iOS Fabric compatibility
// import LinearGradient from 'react-native-linear-gradient';
import {ChevronLeft, AlertTriangle, Trash2, ShieldAlert} from 'lucide-react-native';
import {
  getAuth,
  signOut,
  EmailAuthProvider,
  reauthenticateWithCredential,
  GoogleAuthProvider,
  OAuthProvider,
} from '@react-native-firebase/auth';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {useConfig} from '../../context/ConfigContext';
import {useTrade} from '../TradeContext';
import server from '../../utils/serverConfig';
import {generateToken} from '../../utils/SecurityTokenManager';
import {getAdvisorSubdomain} from '../../utils/variantHelper';
import Config from 'react-native-config';

const DeleteAccountScreen = ({navigation}) => {
  const config = useConfig();
  const {
    userDetails,
    setUserDetails,
    setIsProfileCompleted,
    setHasFetchedTrades,
    setFunds,
    setstockRecoNotExecutedfinal,
    setModelPortfolioStrategyfinal,
    setBroker,
  } = useTrade();

  const [isDeleting, setIsDeleting] = useState(false);
  const [deletionStep, setDeletionStep] = useState('');

  const gradient1 = config?.gradient1 || '#002651';
  const gradient2 = config?.gradient2 || '#0056B7';

  const auth = getAuth();
  const currentUser = auth.currentUser;
  const userEmail = currentUser?.email || userDetails?.email;

  // Data that will be deleted - displayed to user
  const dataToBeDeleted = [
    'Your profile information (name, email, phone)',
    'Your broker connection details',
    'Your subscription history and plans',
    'Your trade recommendations and history',
    'Your model portfolio data',
    'Your app preferences and settings',
    'Your notification history',
    'Your watchlists and saved items',
  ];

  /**
   * Get fresh Firebase ID token for API authentication
   */
  const getFirebaseIdToken = async () => {
    try {
      if (!currentUser) {
        throw new Error('No user logged in');
      }
      // Force token refresh to ensure it's valid
      const idToken = await currentUser.getIdToken(true);
      return idToken;
    } catch (error) {
      console.error('[DELETE ACCOUNT] Failed to get ID token:', error);
      throw error;
    }
  };

  /**
   * Attempt to re-authenticate the user if needed
   */
  const handleReauthentication = async () => {
    try {
      const providers = currentUser?.providerData || [];
      const primaryProvider = providers[0]?.providerId;

      if (primaryProvider === 'google.com') {
        // Re-authenticate with Google
        await GoogleSignin.hasPlayServices();
        const {idToken} = await GoogleSignin.signIn();
        const googleCredential = GoogleAuthProvider.credential(idToken);
        await reauthenticateWithCredential(currentUser, googleCredential);
        return true;
      } else if (primaryProvider === 'apple.com') {
        // For Apple Sign-In, we typically need to trigger a new sign-in flow
        // This is handled differently on iOS
        Alert.alert(
          'Re-authentication Required',
          'Please sign in again with Apple to confirm account deletion.',
          [{text: 'OK'}]
        );
        return false;
      } else {
        // Email/password - would need password prompt
        // For now, we'll try to proceed with the current token
        return true;
      }
    } catch (error) {
      console.error('[DELETE ACCOUNT] Re-authentication failed:', error);
      return false;
    }
  };

  /**
   * Reset all app state after deletion
   */
  const resetAppState = useCallback(async () => {
    try {
      // Clear AsyncStorage
      await AsyncStorage.removeItem('cartItems');
      await AsyncStorage.removeItem('userDetails');
      await AsyncStorage.clear();

      // Reset TradeContext state
      setUserDetails(null);
      setHasFetchedTrades(false);
      setIsProfileCompleted(false);
      setFunds({});
      setBroker(null);
      setstockRecoNotExecutedfinal([]);
      setModelPortfolioStrategyfinal([]);
    } catch (error) {
      console.error('[DELETE ACCOUNT] Error resetting state:', error);
    }
  }, [
    setUserDetails,
    setHasFetchedTrades,
    setIsProfileCompleted,
    setFunds,
    setBroker,
    setstockRecoNotExecutedfinal,
    setModelPortfolioStrategyfinal,
  ]);

  /**
   * Main deletion handler
   * Sequence: Backend deletion first, then Firebase Auth deletion, then logout
   */
  const handleDeleteAccount = async () => {
    setIsDeleting(true);

    try {
      // Step 1: Get fresh Firebase ID token
      setDeletionStep('Verifying your identity...');
      let idToken;
      try {
        idToken = await getFirebaseIdToken();
      } catch (tokenError) {
        // Token might be expired, try re-authentication
        const reauthed = await handleReauthentication();
        if (!reauthed) {
          throw new Error('Re-authentication required. Please try again.');
        }
        idToken = await getFirebaseIdToken();
      }

      // Step 2: Call backend deletion API
      setDeletionStep('Deleting your data...');

      const response = await axios.delete(
        `${server.server.baseUrl}api/account/delete`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
            'X-Advisor-Subdomain': getAdvisorSubdomain(),
            'aq-encrypted-key': generateToken(
              Config.REACT_APP_AQ_KEYS,
              Config.REACT_APP_AQ_SECRET,
            ),
          },
          data: {
            confirmDeletion: true,
          },
        }
      );

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to delete account');
      }

      console.log('[DELETE ACCOUNT] Backend deletion successful:', response.data);

      // Step 3: Sign out from Google if applicable
      setDeletionStep('Signing out...');
      try {
        await GoogleSignin.signOut();
      } catch (googleError) {
        // Ignore - user may not have signed in with Google
        console.log('[DELETE ACCOUNT] Google signOut skipped');
      }

      // Step 4: Sign out from Firebase
      // Note: Firebase Auth user is already deleted by backend
      try {
        await signOut(auth);
      } catch (signOutError) {
        // Ignore - session might already be invalidated
        console.log('[DELETE ACCOUNT] Firebase signOut completed');
      }

      // Step 5: Reset app state
      setDeletionStep('Cleaning up...');
      await resetAppState();

      // Step 6: Show success and navigate to login
      setIsDeleting(false);
      Alert.alert(
        'Account Deleted',
        'Your account and all associated data have been permanently deleted.',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [{name: 'Login'}],
              });
            },
          },
        ],
        {cancelable: false}
      );

    } catch (error) {
      console.error('[DELETE ACCOUNT] Error:', error);
      setIsDeleting(false);
      setDeletionStep('');

      let errorMessage = 'An error occurred while deleting your account. Please try again.';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.code === 'TOKEN_EXPIRED') {
        errorMessage = 'Your session has expired. Please sign in again and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert('Deletion Failed', errorMessage);
    }
  };

  /**
   * Show confirmation dialog before deletion
   */
  const showConfirmationDialog = () => {
    Alert.alert(
      'Delete Account Permanently?',
      'This action cannot be undone. All your data will be permanently deleted from our servers.\n\nAre you absolutely sure you want to delete your account?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete My Account',
          style: 'destructive',
          onPress: handleDeleteAccount,
        },
      ],
      {cancelable: true}
    );
  };

  const handleBack = () => {
    if (navigation?.goBack) {
      navigation.goBack();
    }
  };

  return (
    // View replaces LinearGradient for iOS Fabric compatibility - uses first gradient color as solid background
    <View
      style={[styles.container, {backgroundColor: gradient1, overflow: 'hidden'}]}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={gradient1} />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ChevronLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Delete Account</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>

          {/* Warning Card */}
          <View style={styles.warningCard}>
            <View style={styles.warningIconContainer}>
              <AlertTriangle size={32} color="#FF4444" />
            </View>
            <Text style={styles.warningTitle}>
              Permanent Account Deletion
            </Text>
            <Text style={styles.warningText}>
              This action is irreversible. Once you delete your account,
              all your data will be permanently removed from our servers
              and cannot be recovered.
            </Text>
          </View>

          {/* Account Info */}
          <View style={styles.accountCard}>
            <Text style={styles.sectionTitle}>Account to be deleted</Text>
            <View style={styles.accountInfo}>
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>
                  {userEmail?.[0]?.toUpperCase() || 'U'}
                </Text>
              </View>
              <View style={styles.accountDetails}>
                <Text style={styles.accountName}>
                  {userDetails?.name || 'User'}
                </Text>
                <Text style={styles.accountEmail}>{userEmail}</Text>
              </View>
            </View>
          </View>

          {/* Data to be deleted */}
          <View style={styles.dataCard}>
            <View style={styles.dataCardHeader}>
              <ShieldAlert size={20} color="#FF4444" />
              <Text style={styles.dataCardTitle}>
                Data that will be deleted
              </Text>
            </View>
            <View style={styles.dataList}>
              {dataToBeDeleted.map((item, index) => (
                <View key={index} style={styles.dataItem}>
                  <Trash2 size={14} color="#FF6B6B" />
                  <Text style={styles.dataItemText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Deletion Loading State */}
          {isDeleting && (
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={styles.loadingText}>{deletionStep}</Text>
              <Text style={styles.loadingSubtext}>
                Please do not close the app
              </Text>
            </View>
          )}

        </ScrollView>

        {/* Footer with Delete Button */}
        {!isDeleting && (
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleBack}
              activeOpacity={0.8}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={showConfirmationDialog}
              activeOpacity={0.8}>
              <Trash2 size={18} color="#FFFFFF" />
              <Text style={styles.deleteButtonText}>Delete Account</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
    marginLeft: 16,
  },
  headerRight: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  warningCard: {
    backgroundColor: 'rgba(255, 68, 68, 0.15)',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 68, 68, 0.3)',
  },
  warningIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 68, 68, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  warningText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 20,
  },
  accountCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  accountDetails: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  accountEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  dataCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  dataCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dataCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  dataList: {
    gap: 12,
  },
  dataItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dataItemText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 10,
    flex: 1,
  },
  loadingCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginTop: 8,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 4,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#FF4444',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default DeleteAccountScreen;
