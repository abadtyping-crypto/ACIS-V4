import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDVHaoarp8DRDqnI-Px5zdFilnE0S4r_RE',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'acis-ajman.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'acis-ajman',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'acis-ajman.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1072046268356',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:1072046268356:web:84e5ead686217cfdd8ce91',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-49F95BQQ49',
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

let messaging = null;

// Initialize Firebase Cloud Messaging and get a reference to the service
const initializeMessaging = async () => {
  try {
    const isSupportedBrowser = await isSupported();
    if (isSupportedBrowser) {
      messaging = getMessaging(app);
      console.log('Firebase Messaging is supported and initialized.');
    }
  } catch (error) {
    console.error('Firebase Messaging not supported:', error);
  }
};

// Fire and forget
initializeMessaging();

export { messaging };
