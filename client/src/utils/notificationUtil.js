import { initializeApp } from 'firebase/app';
import { getMessaging, getToken } from 'firebase/messaging';
import { CampusNotifierSDK } from 'campus-notifier-sdk';

const firebaseConfig = {
  apiKey: "AIzaSyDBLjF9onGD36mFx_js8oZLk4SYR_vuAgM",
  authDomain: "instapal-notifier.firebaseapp.com",
  projectId: "instapal-notifier",
  storageBucket: "instapal-notifier.firebasestorage.app",
  messagingSenderId: "728988987873",
  appId: "1:728988987873:web:ca6abd2d810603cd8962a0"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

const notifier = new CampusNotifierSDK({
    engineUrl: 'https://notification-backend-1q5k.onrender.com', 
    vapidKey: 'BIa8a76wRZOHwr2247a4o36fRYZR0hRjWVVzjWk8B_xYV1euK9ie2YgWGFf9DjqWYNQWAtLJhhHR4GDgFnKFl8Q' 
});

export const startNotifications = async (studentId, hostelName) => {
    try {
        if (!studentId) {
            return;
        }
        if (!hostelName) {
            return;
        }
        await notifier.registerServiceWorker('/firebase-messaging-sw.js');
        await notifier.enableNotifications(studentId, hostelName, messaging, getToken);
    } catch (error) {
    }
};
