export class CampusNotifierSDK {
    /**
     * @param {Object} config 
     * @param {string} config.engineUrl - The URL of your notification microservice backend (e.g. http://localhost:5001)
     * @param {string} config.vapidKey - Your Firebase Web Push Public VAPID Key
     */
    constructor(config) {
        this.engineUrl = config.engineUrl;
        this.vapidKey = config.vapidKey;
    }

    /**
     * Registers the required background Service Worker on the browser
     * @param {string} swPath - Path to your firebase service worker script
     */
    async registerServiceWorker(swPath = '/firebase-messaging-sw.js') {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register(swPath);
                console.log('✅ Notification Service Worker registered successfully');
                return registration;
            } catch (error) {
                console.error('❌ Service Worker registration failed:', error);
            }
        } else {
            console.warn('⚠️ Service Workers are not supported in this browser.');
        }
        return null;
    }

    /**
     * Prompts the student for notification access and automatically registers the token to your backend
     * @param {string} userId - The unique ID of the student
     * @param {string} hostelName - The student's hostel (e.g., "Hostel M")
     * @param {Object} messagingInstance - The initialized Firebase messaging instance from your frontend
     * @param {Function} getTokenFunc - The 'getToken' function imported from 'firebase/messaging'
     */
    async enableNotifications(userId, hostelName, messagingInstance, getTokenFunc) {
        try {
            // 1. Ask browser for permission
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                console.warn('⚠️ Push notification permission denied by the user.');
                return false;
            }

            // 2. Wait for the service worker layer to be active and ready
            const registration = await navigator.serviceWorker.ready;

            // 3. Fetch the unique device token from Firebase
            const currentToken = await getTokenFunc(messagingInstance, {
                vapidKey: this.vapidKey,
                serviceWorkerRegistration: registration
            });

            if (currentToken) {
                // 4. Send this device token directly to your standalone microservice backend
                const response = await fetch(`${this.engineUrl}/api/devices/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId, hostelName, fcmToken: currentToken })
                });
                
                const result = await response.json();
                console.log('✅ Device synced with Notification Engine:', result);
                return result.success;
            } else {
                console.warn('⚠️ No registration token received from Firebase.');
                return false;
            }
        } catch (error) {
            console.error('❌ Failed to establish push registration token:', error);
            return false;
        }
    }
}