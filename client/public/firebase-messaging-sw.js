importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

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
    const notificationIcon = payload.data.icon || '/favicon.ico';
    self.registration.showNotification(payload.data.title, {
        body: payload.data.body,
        icon: notificationIcon,
        badge: notificationIcon, 
        data: { url: payload.data.link } 
    });
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(clients.openWindow(event.notification.data.url));
});
