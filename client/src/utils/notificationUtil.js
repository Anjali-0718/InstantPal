import { initializeApp } from 'firebase/app';
import { getMessaging, getToken } from 'firebase/messaging';
import { CampusNotifierSDK } from 'campus-notifier-sdk';

// Same config as above
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

// Connect to your deployed Render URL
const notifier = new CampusNotifierSDK({
    engineUrl: 'https://notification-backend-1q5k.onrender.com', // <-- YOUR RENDER URL
    vapidKey: 'BIa8a76wRZOHwr2247a4o36fRYZR0hRjWVVzjWk8B_xYV1euK9ie2YgWGFf9DjqWYNQWAtLJhhHR4GDgFnKFl8Q' // <-- FROM FIREBASE CONSOLE
});

export const startNotifications = async (studentId, hostelName) => {
    try {
        await notifier.registerServiceWorker('/firebase-messaging-sw.js');
        await notifier.enableNotifications(studentId, hostelName, messaging, getToken);
        console.log("Notifications active for:", hostelName);
    } catch (error) {
        console.error("Notification setup failed:", error);
    }
};