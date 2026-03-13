import { AppRegistry, AppState, Platform } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

// Register the app first, before any native module calls
AppRegistry.registerComponent(appName, () => App);

// Defer all native module initialization to avoid TurboModule crash on iOS
setTimeout(() => {
  try {
    const notifee = require('@notifee/react-native').default;
    const { AndroidImportance, EventType } = require('@notifee/react-native');
    const messaging = require('@react-native-firebase/messaging').default;
    const NatificationServiceNav = require('./src/components/NatificationServiceNav').default;

    let notificationDisplayed = false;

    // Display the notification function
    const displayNotification = async (title, body) => {
      try {
        await notifee.requestPermission();
        const channelId = await notifee.createChannel({
          id: 'default',
          name: 'Default Channel',
          vibration: true,
          sound: 'default',
          importance: AndroidImportance.HIGH,
          vibrationPattern: [300, 500],
        });

        if (AppState.currentState !== 'active' && !notificationDisplayed) {
          console.log('App not active, displaying notification');
          await notifee.displayNotification({
            title: title,
            body: body,
            android: {
              channelId,
              importance: AndroidImportance.HIGH,
              pressAction: {
                id: 'default',
              },
            },
          });
          notificationDisplayed = true;
        }
      } catch (error) {
        console.log('Error displaying notification: ' + error);
      }
    };

    // Background message handler
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      if (remoteMessage) {
        const { title, body } = remoteMessage.notification;
        await displayNotification(title, body);
        console.log('Notification received in background');
      }
    });

    // Handle notification when the app was closed and opened via notification
    messaging().getInitialNotification().then(async (remoteMessage) => {
      if (remoteMessage) {
        const { title, body } = remoteMessage.notification;
        await displayNotification(title, body);
        console.log('Notification received when app was closed');
      }
    });

    // Handle notification press events when the app is in the foreground
    notifee.onForegroundEvent(async ({ type, detail }) => {
      if (type === EventType.PRESS) {
        console.log('Notification pressed in foreground');
        NatificationServiceNav.navigate('NotificationScreen');
      }
    });

    // Handle notification press events when the app is in the background
    notifee.onBackgroundEvent(async ({ type, detail }) => {
      if (type === EventType.PRESS) {
        console.log('Notification pressed in background');
        NatificationServiceNav.navigate('NotificationScreen');
      }
    });

    console.log('[index.js] Notification handlers registered successfully');
  } catch (error) {
    console.log('[index.js] Error setting up notification handlers:', error);
  }
}, 0);
