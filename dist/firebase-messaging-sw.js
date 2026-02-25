importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-messaging-compat.js');

// Required configuration for background messages
const firebaseConfig = {
    apiKey: "AIzaSyDVHaoarp8DRDqnI-Px5zdFilnE0S4r_RE",
    authDomain: "acis-ajman.firebaseapp.com",
    projectId: "acis-ajman",
    storageBucket: "acis-ajman.firebasestorage.app",
    messagingSenderId: "1072046268356",
    appId: "1:1072046268356:web:84e5ead686217cfdd8ce91",
    measurementId: "G-49F95BQQ49"
};

try {
    firebase.initializeApp(firebaseConfig);
    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
        console.log('[firebase-messaging-sw.js] Received background message ', payload);
        const notificationTitle = payload.notification?.title || 'New Notification';
        const notificationOptions = {
            body: payload.notification?.body || '',
            icon: '/pwa-192x192.png'
        };

        self.registration.showNotification(notificationTitle, notificationOptions);
    });
} catch (e) {
    console.error('[firebase-messaging-sw.js] Error initializing Firebase:', e);
}
