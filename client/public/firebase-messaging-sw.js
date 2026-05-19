importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Paste the config you got from the Firebase Console here
firebase.initializeApp({
  apiKey: "AIzaSyDBLjF9onGD36mFx_js8oZLk4SYR_vuAgM",
  authDomain: "instapal-notifier.firebaseapp.com",
  projectId: "instapal-notifier",
  storageBucket: "instapal-notifier.firebasestorage.app",
  messagingSenderId: "728988987873",
  appId: "1:728988987873:web:ca6abd2d810603cd8962a0"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    self.registration.showNotification(payload.notification.title, {
        body: payload.notification.body,
        icon: '/favicon.ico'
    });
});