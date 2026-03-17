import React, {useState, useEffect} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {useConfig} from '../../context/ConfigContext';
import APP_VARIANTS from '../../utils/Config';
import {
  ChevronLeft,
  ChevronRight,
  Link,
  BookPlus,
  GraduationCap,
  Receipt,
  Crown,
  Tags,
  LogOut,
  Bell,
  Bookmark,
  Trash2,
} from 'lucide-react-native';
import GradientView from '../../components/GradientView';
import {getAuth, signOut} from '@react-native-firebase/auth';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from '../../utils/safeConfig';
import {useTrade} from '../TradeContext';
import {clearAllAppData} from '../../utils/storageUtils';
import server from '../../utils/serverConfig';
import {generateToken} from '../../utils/SecurityTokenManager';
import {getAdvisorSubdomain} from '../../utils/variantHelper';

// inside your component

const AccountSettingsScreen = ({navigation}) => {
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
  const config = useConfig();
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (config?.googleWebClientId) {
      GoogleSignin.configure({
        webClientId: config.googleWebClientId,
      });
    }
  }, [config?.googleWebClientId]);
  const selectedVariant = Config?.APP_VARIANT || 'rgxresearch';
  const validVariant = APP_VARIANTS[selectedVariant] ? selectedVariant : 'rgxresearch';
  const fallbackConfig = APP_VARIANTS[validVariant] || {};

  // Get background logo from config (S3) or fallback
  // showBackgroundLogo: true/false - controls visibility (default: true for backwards compatibility)
  const showBackgroundLogo = config?.showBackgroundLogo !== false; // Show by default unless explicitly set to false
  const backgroundLogo = config?.backgroundLogo || config?.logo || fallbackConfig.logo;

  const userProfile = {
    name: userDetails?.name,
    email: userDetails?.email,
    avatar: null,
  };

  const auth = getAuth();
  const user = auth.currentUser;
  const userEmail = user?.email;
  const imageUrl = user?.photoURL;
  const menuItems = [
    {
      id: 'account',
      title: 'Account',
      items: [
        {
          icon: Link,
          label: 'Broker Account',
          onPress: () => handleMenuPress('Broker Setting'),
        },
        {
          icon: Crown,
          label: 'My Subscription',
          onPress: () => handleMenuPress('MySubscriptionsScreen'),
        },
...((() => {
          const hideChangeManagerCodes = Config?.REACT_APP_HIDE_CHANGE_MANAGER_FOR_CODES
            ?.split(',')
            .map(code => code.trim().toUpperCase()) || [];
          const currentCode = Config?.ADVISOR_RA_CODE?.toUpperCase() || '';
          const shouldHide = Config?.REACT_APP_HIDE_CHANGE_MANAGER === 'true' ||
            hideChangeManagerCodes.includes(currentCode);
          return !shouldHide;
        })()
          ? [
              {
                icon: Tags,
                label: 'Change Manager',
                onPress: () => handleMenuPress('Advisor Change'),
              },
            ]
          : []),
      ],
    },
    {
      id: 'insights',
      title: 'Insights',
      items: [
        {
          icon: BookPlus,
          label: 'Research Report',
          onPress: () => handleMenuPress('ResearchReportScreen'),
        },
        {
          icon: Bookmark,
          label: 'Watchlists',
          onPress: () => handleMenuPress('WatchList'),
        },
        // {
        //   icon: BookText ,
        //   label: 'Order History',
        //   onPress: () => handleMenuPress('OrderHistory'),
        // },
        {
          icon: Receipt,
          label: 'My Invoices',
          onPress: () => handleMenuPress('PaymentHistoryScreen'),
        },
        {
          icon: GraduationCap,
          label: 'Knowledge Hub',
          onPress: () => handleMenuPress('KnowledgeHub'),
        },
        // {
        //   icon: Settings,
        //   label: 'Settings',
        //   onPress: () => handleMenuPress('Settings'),
        // },
      ],
    },
    {
      id: 'legal',
      title: 'Legal',
      items: [
        {
          icon: Link,
          label: 'Privacy Policy',
          onPress: () => handleMenuPress('Privacy Policy'),
        },
        {
          icon: Link,
          label: 'Terms & Conditions',
          onPress: () => handleMenuPress('Terms & Conditions'),
        },
        {
          icon: Trash2,
          label: 'Delete Account',
          onPress: () => handleDeleteAccount(),
          isDelete: true,
        },
        {
          icon: LogOut,
          label: 'Log Out',
          onPress: () => handleMenuPress('Logout'),
          isLogout: true,
        },
      ],
    },
  ];

  const performAccountDeletion = async () => {
    setIsDeleting(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert('Error', 'Unable to identify your account. Please sign in again.');
        setIsDeleting(false);
        return;
      }

      // Get Firebase ID token for backend verification
      const idToken = await currentUser.getIdToken(true);

      // Call backend API to delete user account and all associated data
      await axios.delete(
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
          data: {confirmDeletion: true},
        },
      );

      // Sign out from Google if applicable
      try {
        await GoogleSignin.signOut();
      } catch (googleError) {
        console.log('Google signOut skipped (user may not have used Google)');
      }

      // Clear all local data
      await clearAllAppData();
      await AsyncStorage.removeItem('cartItems');

      // Reset state
      setUserDetails(null);
      setHasFetchedTrades(false);
      setIsProfileCompleted(false);
      setFunds({});
      setBroker(null);
      setstockRecoNotExecutedfinal([]);
      setModelPortfolioStrategyfinal([]);

      setIsDeleting(false);
      Alert.alert(
        'Account Deleted',
        'Your account and all associated data have been permanently deleted.',
        [{text: 'OK', onPress: () => navigation.replace('Login')}],
        {cancelable: false},
      );
    } catch (error) {
      console.error('Error deleting account:', error);
      setIsDeleting(false);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.msg ||
        'Failed to delete account. Please try again later.';
      Alert.alert('Error', errorMessage);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action is permanent and cannot be undone. All your data, subscriptions, and portfolio history will be removed.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Final Confirmation',
              `Your account "${userDetails?.email || auth.currentUser?.email}" will be permanently deleted. This cannot be reversed.`,
              [
                {text: 'Go Back', style: 'cancel'},
                {
                  text: 'Permanently Delete',
                  style: 'destructive',
                  onPress: performAccountDeletion,
                },
              ],
            );
          },
        },
      ],
    );
  };

  const handleMenuPress = screenName => {
    if (navigation?.navigate) {
      navigation.navigate(screenName);
    }
  };

  const handleLogout = () => {
    if (navigation?.navigate) {
      navigation.navigate('LogOut');
    }
  };

  const handleBack = () => {
    if (navigation?.goBack) {
      navigation.goBack();
    }
  };

  const getInitials = name => {
    return name?.length > 0 ? name[0]?.toUpperCase() : '';
  };

  const renderMenuItem = (item, isLast) => {
    const isDanger = item.isLogout || item.isDelete;
    return (
      <TouchableOpacity
        key={item.label}
        style={[styles.menuItem, isLast && styles.menuItemLast]}
        onPress={item.onPress}
        activeOpacity={0.7}>
        <View style={styles.menuItemLeft}>
          <View style={styles.iconContainer}>
            <item.icon size={18} color={isDanger ? '#FF4444' : '#FFFFFF'} />
          </View>
          <Text style={[styles.menuItemText, item.isDelete && styles.deleteText]}>
            {item.label}
          </Text>
        </View>
        <ChevronRight size={20} color="#FFFFFF" />
      </TouchableOpacity>
    );
  };

  // Get gradient colors from config
  const gradientStart = config?.gradient1 || '#002651';
  const gradientEnd = config?.gradient2 || '#0056B7';

  return (
    <GradientView
      colors={[gradientStart, gradientEnd]}
      start={{x: 0, y: 0}}
      end={{x: 0, y: 1}}
      style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={gradientStart} />

        {showBackgroundLogo && backgroundLogo && (
          <View style={styles.logoContainer} pointerEvents="none">
            {typeof backgroundLogo === 'string' ? (
              <Image
                source={{uri: backgroundLogo}}
                style={[styles.logo, {tintColor: '#FFFFFF', opacity: 0.15}]}
                resizeMode="contain"
              />
            ) : (
              <Image
                source={backgroundLogo}
                style={[styles.logo, {tintColor: '#FFFFFF', opacity: 0.15}]}
                resizeMode="contain"
              />
            )}
          </View>
        )}

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ChevronLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Account Settings</Text>
          <View style={styles.headerRight}>
            {/* <TouchableOpacity style={styles.iconButton}>
              <View style={styles.iconCircle}>
                <HelpCircle size={18} color="#FFFFFF" />
              </View>
            </TouchableOpacity> */}
            <TouchableOpacity
              onPress={() => navigation.navigate('PushNotificationScreen')}
              style={styles.iconButton}>
              <View style={styles.iconCircle}>
                <Bell size={18} color="#FFFFFF" />
                <View style={styles.notificationDot} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {/* Profile Section */}
          <View style={styles.profileSection}>
            <View style={styles.profileInfo}>
              <View style={styles.avatarContainer}>
                {imageUrl ? (
                  <Image
                    source={{uri: imageUrl}}
                    style={{width: 50, height: 50, borderRadius: 25}}
                  />
                ) : (
                  <Text
                    style={{
                      color: '#fff',
                      fontSize: 20,
                      marginTop: 2,
                      fontFamily: 'Poppins-Regular',
                    }}>
                    {getInitials(userDetails?.name)}
                  </Text>
                )}
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{userProfile.name}</Text>
                <Text style={styles.userEmail}>{userProfile.email}</Text>
              </View>
            </View>
          </View>

          {/* Menu Sections */}
          {menuItems.map(section => (
            <View key={section.id} style={styles.menuSection}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <View style={styles.menuContainer}>
                {section.items
                  .filter(
                    it =>
                      it.label !== 'Settings' &&
                      it.label !== 'Log Out' &&
                      it.label !== 'Delete Account',
                  )
                  .map((item, index, arr) =>
                    renderMenuItem(item, index === arr.length - 1),
                  )}
              </View>
            </View>
          ))}

          {/* Separate container for Settings (no label) */}
          {(() => {
            const settingsItem = menuItems
              .flatMap(s => s.items)
              .find(it => it.label === 'Settings');
            if (!settingsItem) return null;
            return (
              <View style={styles.menuSection}>
                <View style={styles.menuContainer}>
                  {renderMenuItem(settingsItem, true)}
                </View>
              </View>
            );
          })()}

          {/* Separate container for Log Out and Delete Account */}
          {(() => {
            const bottomItems = menuItems
              .flatMap(s => s.items)
              .filter(
                it => it.label === 'Log Out' || it.label === 'Delete Account',
              );
            if (bottomItems.length === 0) return null;
            return (
              <View style={styles.menuSection}>
                <View style={styles.menuContainer}>
                  {bottomItems.map((item, index) =>
                    renderMenuItem(item, index === bottomItems.length - 1),
                  )}
                </View>
              </View>
            );
          })()}
        </ScrollView>

        {isDeleting && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Deleting account...</Text>
          </View>
        )}
      </SafeAreaView>
    </GradientView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  logoContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 0,
    opacity: 1,
  },
  logo: {
    width: 220,
    height: 220,
    color: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 1,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    padding: 4,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF4444',
  },
  scrollView: {
    flex: 1,
    zIndex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  profileSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 40, // fixed width
    height: 40, // same as width
    borderWidth: 1,
    borderColor: '#c8c8c8',
    borderRadius: 30, // half of width/height
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
    backgroundColor: 'transparent', // optional
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  menuSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  menuContainer: {
    marginHorizontal: 16,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 5,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 0,
    borderBottomWidth: 0.5,
    borderBottomColor: '#FFFFFF',
  },
  menuItemLast: {
    borderBottomWidth: 0,
    borderBottomColor: 'transparent',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  logoutIconContainer: {},
  menuItemText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  logoutText: {
    color: '#FFFFFF',
  },
  deleteText: {
    color: '#FF4444',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 12,
    fontFamily: 'Poppins-Medium',
  },
});

export default AccountSettingsScreen;
