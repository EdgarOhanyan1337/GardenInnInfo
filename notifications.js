/**
 * Garden Inn Resort - Browser & Web Push Notifications
 */

(function () {
    'use strict';

    // IMPORTANT: Replace this with your actual VAPID public key
    // You can generate one via Supabase Edge Function or a VAPID generator online
    const PUBLIC_VAPID_KEY = 'BDgtS83KPMTQCEu0oe3OnAYWxvFOqZYBoSO2FAhHCon07YyVF-R-sOuGIOnvSCpRhrpzMZ0XE3uCWyA1NgYnOKA';

    function urlBase64ToUint8Array(base64String) {
        if (!base64String) return new Uint8Array(0);
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    // Register Service Worker
    window.initPushNotifications = async function () {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            console.warn('Push messaging is not supported');
            return;
        }

        try {
            const registration = await navigator.serviceWorker.register('./sw.js');
            console.log('ServiceWorker registered');
        } catch (error) {
            console.error('ServiceWorker registration failed:', error);
        }
    };

    // Subscribes user and saves to DB
    window.subscribeToPush = async function () {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;

        try {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                console.warn('Notification permission denied');
                return false;
            }

            const registration = await navigator.serviceWorker.ready;
            
            // Wait for subscription
            let subscription = await registration.pushManager.getSubscription();
            if (!subscription) {
                try {
                    subscription = await registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: urlBase64ToUint8Array(window.PUBLIC_VAPID_KEY || PUBLIC_VAPID_KEY)
                    });
                } catch(e) {
                     console.error("Failed to subscribe to Web Push. Ensure VAPID key is correct:", e);
                     return false;
                }
            }

            const room = window.getRoomNumber ? window.getRoomNumber() : null;
            if (room && window.supabaseClient && subscription) {
                const subJson = JSON.parse(JSON.stringify(subscription));
                const { error } = await window.supabaseClient.from('push_subscriptions').upsert({
                    room_number: room,
                    subscription: subJson
                }, { onConflict: 'room_number, subscription' });
                
                if (error) {
                    console.error('Error saving push subscription:', error);
                    return false;
                }
                
                console.log('Push subscription saved for room:', room);
                localStorage.setItem('gi_push_subscribed', 'true');
                return true;
            }
        } catch (error) {
            console.error('Push subscription failed:', error);
        }
        return false;
    };

    window.showPushPrompt = function () {
        // If already granted, silently re-subscribe to keep DB in sync
        if (Notification.permission === 'granted') {
            window.subscribeToPush();
            return;
        }
        if (localStorage.getItem('gi_push_subscribed') === 'true') {
            return; // Already subscribed
        }
        if (Notification.permission === 'denied') return; // Don't annoy if they explicitly blocked

        var modal = document.getElementById('push-prompt-modal');
        if (modal) {
            // Close any other active modals
            var activeModals = document.querySelectorAll('.modal.active');
            activeModals.forEach(function(m) {
                if (m !== modal) m.classList.remove('active');
            });
            
            var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
            var isStandalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;

            if (isIOS && !isStandalone) {
                var contentDiv = modal.querySelector('.push-prompt-content');
                if (contentDiv && !contentDiv.hasAttribute('data-ios-injected')) {
                    contentDiv.setAttribute('data-ios-injected', 'true');
                    contentDiv.innerHTML = `
                        <div style="font-size: 48px; margin-bottom: 16px;">📲</div>
                        <h2 style="font-family: var(--font-display); color: var(--color-primary-light); font-size: 24px; margin-bottom: 12px; font-weight: 700;">Add to Home Screen</h2>
                        <p style="color: var(--color-text-muted); line-height: 1.5; font-size: 15px; margin-bottom: 24px;">
                            To receive live notifications on your iPhone, you need to add our app to your home screen.<br><br>
                            1. Tap the <b>Share</b> button at the bottom of your screen.<br>
                            2. Scroll down and tap <b>"Add to Home Screen"</b> ➕.<br>
                            3. Open the app from your home screen.
                        </p>
                        <div style="display: flex; flex-direction: column; gap: 12px;">
                            <button onclick="onPushPromptSkip()" style="background: rgba(255,255,255,0.1); color: #fff; border: none; padding: 14px; border-radius: 12px; font-weight: 500; font-size: 16px; cursor: pointer;">Got it, I'll do it later</button>
                        </div>
                    `;
                }
            }

            modal.style.display = 'flex';
            setTimeout(function() { modal.classList.add('active'); }, 50);
        }
    };

    window.closePushPrompt = function () {
        var modal = document.getElementById('push-prompt-modal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(function() { modal.style.display = 'none'; }, 300);
        }
    };

    window.onPushPromptAccept = async function () {
        var btn = document.getElementById('push-accept-btn');
        if (btn) { btn.disabled = true; btn.textContent = "Please wait..."; }
        
        try {
            const success = await Promise.race([
                window.subscribeToPush(),
                new Promise(resolve => setTimeout(() => resolve(false), 5000))
            ]);
            
            if (success) {
                if (window.showToast) window.showToast('✅ Notifications Enabled!');
            } else {
                console.warn("Push subscription failed or timed out.");
            }
        } catch(e) {
            console.error(e);
        } finally {
            window.closePushPrompt();
            if (btn) { btn.disabled = false; btn.textContent = "Enable Notifications"; }
        }
    };

    window.onPushPromptSkip = function () {
        window.closePushPrompt();
    };


    // Fallback for local browser notifications (while on site)
    window.showBrowserNotification = function (title, body, icon) {
        if (!('Notification' in window) || Notification.permission !== 'granted') {
            if (window.showToast) window.showToast('🔔 <b>' + title + '</b><br>' + body);
            return;
        }
        try {
            var n = new Notification(title, {
                body: body,
                icon: icon || 'assets/logo.png',
                badge: 'assets/logo.png',
                vibrate: [200, 100, 200],
                tag: 'update-' + Date.now(),
                requireInteraction: true
            });
            n.onclick = function () { window.focus(); n.close(); };
            setTimeout(function () { n.close(); }, 10000);
        } catch (e) {
            console.error('Notification error:', e);
        }
    };

    // Initialize Service Worker immediately
    window.initPushNotifications();

    // Auto re-subscribe on every page load if permission already granted
    // This ensures the DB subscription stays valid even if it was cleaned up
    if ('Notification' in window && Notification.permission === 'granted') {
        setTimeout(function() {
            window.subscribeToPush();
        }, 2000);
    }

})();
