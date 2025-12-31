import { firebase } from '@react-native-firebase/app';

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDR0RsT5LSv11APTJdhcDvInesOFeHb2qw",
  authDomain: "alphaquark-64c38.firebaseapp.com",
  projectId: "alphaquark-64c38",
  storageBucket: "alphaquark-64c38.appspot.com",
  messagingSenderId: "700438699014",
  appId: "1:700438699014:web:1ee2a00a419f9a909ef787",
  measurementId: "G-EQK21ENC7S",
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export default firebase;
