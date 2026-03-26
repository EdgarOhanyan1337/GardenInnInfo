/**
 * Garden Inn Resort — Room Authentication System
 * QR-based automatic room auth via Supabase Auth
 */

(function () {
    'use strict';

    var ROOM_MIN = 1;
    var ROOM_MAX = 17;
    var EMAIL_DOMAIN = 'gardeninn.local';
    var PASSWORD_SUFFIX = '_secure_2026';
    var LS_ROOM_KEY = 'gi_room_number';

    // Expose globally
    window.currentRoom = null;

    window.getRoomNumber = function () {
        return window.currentRoom || localStorage.getItem(LS_ROOM_KEY) || null;
    };

    function makeEmail(room) {
        return 'room' + room + '@' + EMAIL_DOMAIN;
    }

    function makePassword(room) {
        return 'room' + room + PASSWORD_SUFFIX;
    }

    function isValidRoom(num) {
        var n = parseInt(num, 10);
        return !isNaN(n) && n >= ROOM_MIN && n <= ROOM_MAX;
    }

    // ==================== AUTH FLOW ====================

    async function authenticateRoom(roomNumber) {
        if (!window.supabaseClient) {
            console.error('RoomAuth: Supabase client not available');
            return false;
        }

        var email = makeEmail(roomNumber);
        var password = makePassword(roomNumber);

        // Try sign in
        var { data, error } = await window.supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (data && data.session) {
            console.log('RoomAuth: Signed in as room', roomNumber);
            return true;
        }

        // If sign in failed, try sign up (auto-register)
        if (error) {
            console.log('RoomAuth: Sign-in failed, trying sign-up...', error.message);
            var { data: signUpData, error: signUpError } = await window.supabaseClient.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        room_number: String(roomNumber)
                    }
                }
            });

            if (signUpError) {
                console.error('RoomAuth: Sign-up failed', signUpError.message);
                return false;
            }

            // After sign-up, sign in immediately
            var { data: loginData, error: loginError } = await window.supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (loginError) {
                console.error('RoomAuth: Post-signup login failed', loginError.message);
                return false;
            }

            console.log('RoomAuth: Registered and signed in as room', roomNumber);
            return true;
        }

        return false;
    }

    function setRoom(roomNumber) {
        window.currentRoom = String(roomNumber);
        localStorage.setItem(LS_ROOM_KEY, String(roomNumber));
    }

    function clearRoom() {
        window.currentRoom = null;
        localStorage.removeItem(LS_ROOM_KEY);
    }

    // ==================== UI: ROOM BADGE ====================

    function showRoomBadge(room) {
        var badge = document.getElementById('room-badge');
        if (badge) {
            badge.textContent = '🏠 ' + room;
            badge.style.display = 'inline-flex';
        }
    }

    function hideRoomBadge() {
        var badge = document.getElementById('room-badge');
        if (badge) badge.style.display = 'none';
    }

    // ==================== UI: LOGIN OVERLAY ====================

    function showLoginOverlay() {
        var overlay = document.getElementById('room-login-overlay');
        if (overlay) overlay.classList.add('active');
    }

    function hideLoginOverlay() {
        var overlay = document.getElementById('room-login-overlay');
        if (overlay) overlay.classList.remove('active');
    }

    function showLoginError(msg) {
        var errEl = document.getElementById('room-login-error');
        if (errEl) {
            errEl.textContent = msg;
            errEl.style.display = 'block';
        }
    }

    function hideLoginError() {
        var errEl = document.getElementById('room-login-error');
        if (errEl) {
            errEl.style.display = 'none';
            errEl.textContent = '';
        }
    }

    function showLoginLoading(show) {
        var btn = document.getElementById('room-login-btn');
        var spinner = document.getElementById('room-login-spinner');
        if (btn) btn.disabled = show;
        if (spinner) spinner.style.display = show ? 'inline-block' : 'none';
    }

    // ==================== MANUAL LOGIN HANDLER ====================

    window.handleRoomLogin = async function () {
        var input = document.getElementById('room-login-input');
        if (!input) return;

        var room = input.value.trim();
        hideLoginError();

        if (!isValidRoom(room)) {
            showLoginError('Please enter a valid room number (1–17)');
            return;
        }

        showLoginLoading(true);

        var success = await authenticateRoom(parseInt(room, 10));

        if (success) {
            setRoom(parseInt(room, 10));
            hideLoginOverlay();
            showRoomBadge(room);
            // Auto-fill any existing room fields
            autoFillRoomFields();
            // Clean URL
            var url = new URL(window.location);
            url.searchParams.delete('room');
            window.history.replaceState({}, '', url.pathname + url.search);
        } else {
            showLoginError('Authentication error. Please try again.');
        }

        showLoginLoading(false);
    };

    // ==================== AUTO-FILL ROOM INTO FORMS ====================

    function autoFillRoomFields() {
        var room = window.getRoomNumber();
        if (!room) return;

        // Housekeeping room field
        var hkRoom = document.getElementById('hk-room');
        if (hkRoom) {
            hkRoom.value = room;
            hkRoom.readOnly = true;
        }

        // Booking room field (if it still exists as a hidden field)
        var bookingRoom = document.getElementById('booking-room-number');
        if (bookingRoom) {
            bookingRoom.value = room;
            bookingRoom.readOnly = true;
        }
    }

    // ==================== INIT ====================

    window.initRoomAuth = async function () {
        // 1. Check URL params
        var params = new URLSearchParams(window.location.search);
        var roomParam = params.get('room');
        var isQR = params.get('qr') === '1';

        // 2. Check existing session
        var existingRoom = localStorage.getItem(LS_ROOM_KEY);

        if (roomParam && isValidRoom(roomParam) && isQR) {
            // === QR SCAN: auto-login immediately ===
            var roomNum = parseInt(roomParam, 10);
            showLoginOverlay();
            showLoginLoading(true);

            var input = document.getElementById('room-login-input');
            if (input) input.value = roomNum;

            var success = await authenticateRoom(roomNum);
            if (success) {
                setRoom(roomNum);
                hideLoginOverlay();
                showRoomBadge(roomNum);
                // Clean URL
                var url = new URL(window.location);
                url.searchParams.delete('room');
                url.searchParams.delete('qr');
                window.history.replaceState({}, '', url.pathname + url.search);
            } else {
                showLoginError('Failed to authenticate room ' + roomNum + '. Please try manually.');
            }

            showLoginLoading(false);
        } else if (roomParam && isValidRoom(roomParam) && !isQR) {
            // === MANUAL URL: show login with room pre-filled, wait for user ===
            showLoginOverlay();
            var input = document.getElementById('room-login-input');
            if (input) input.value = parseInt(roomParam, 10);
        } else if (roomParam && !isValidRoom(roomParam)) {
            // Invalid room in URL
            showLoginOverlay();
            showLoginError('Invalid room number. Please enter your room (1–17).');
        } else if (existingRoom && isValidRoom(existingRoom)) {
            // Existing session — verify it's still valid
            var { data } = await window.supabaseClient.auth.getSession();
            if (data && data.session) {
                window.currentRoom = existingRoom;
                showRoomBadge(existingRoom);
            } else {
                // Session expired, re-auth silently
                var success = await authenticateRoom(parseInt(existingRoom, 10));
                if (success) {
                    showRoomBadge(existingRoom);
                    window.currentRoom = existingRoom;
                } else {
                    clearRoom();
                    showLoginOverlay();
                }
            }
        } else {
            // No room info at all — show login overlay
            showLoginOverlay();
        }

        // Auto-fill room fields
        autoFillRoomFields();
    };

    // Logout function (for admin/debug use)
    window.roomLogout = async function () {
        if (window.supabaseClient) {
            await window.supabaseClient.auth.signOut();
        }
        clearRoom();
        hideRoomBadge();
        showLoginOverlay();
    };

})();
