/**
 * Garden Inn Resort - Browser Push Notifications
 * Uses the Notification API for booking status updates
 */

(function () {
    'use strict';

    // Request notification permission on first visit
    window.requestNotificationPermission = function () {
        if (!('Notification' in window)) {
            console.warn('Browser does not support notifications');
            return;
        }
        if (Notification.permission === 'default') {
            Notification.requestPermission().then(function (permission) {
                if (permission === 'granted') {
                    console.log('Notification permission granted');
                }
            });
        }
    };

    // Show a browser push notification
    window.showBrowserNotification = function (title, body, icon) {
        // Fallback: If push notifications aren't supported or denied, use the site's toast system
        if (!('Notification' in window) || Notification.permission !== 'granted') {
            if (window.showToast) {
                window.showToast('🔔 <b>' + title + '</b><br>' + body);
            } else if (window.showBookingToast) {
                window.showBookingToast(title, body, 'info');
            }
            return;
        }
        try {
            var notification = new Notification(title, {
                body: body,
                icon: icon || 'assets/logo.png',
                badge: 'assets/logo.png',
                vibrate: [200, 100, 200],
                tag: 'booking-update-' + Date.now(),
                requireInteraction: true
            });
            notification.onclick = function () {
                window.focus();
                notification.close();
            };
            // Auto-close after 10 seconds
            setTimeout(function () {
                notification.close();
            }, 10000);
        } catch (e) {
            console.error('Notification error:', e);
        }
    };

    // Initialize notifications - request permission on page load
    window.initNotifications = function () {
        // Small delay to not block initial rendering
        setTimeout(function () {
            window.requestNotificationPermission();
        }, 2000);
    };
})();
