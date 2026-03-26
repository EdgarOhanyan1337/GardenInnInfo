/**
 * Garden Inn Resort - Booking System
 * Handles paid service bookings with calendar, Supabase integration, and real-time updates
 */

(function () {
    'use strict';

    // Track booking session (guest's pending bookings by service_id)
    var myBookingIds = JSON.parse(localStorage.getItem('gi_my_bookings') || '[]');

    function saveMyBookings() {
        localStorage.setItem('gi_my_bookings', JSON.stringify(myBookingIds));
    }

    // ==================== BOOKING CONFIRM MODAL ====================

    window.showBookingConfirm = function (serviceId, serviceName, hasCalendar) {
        var modal = document.getElementById('booking-confirm-modal');
        if (!modal) return;
        var titleEl = modal.querySelector('.booking-confirm-title');
        if (titleEl) {
            var t = (window.translations && window.translations[window.currentLang]) || {};
            titleEl.textContent = (t.bookingConfirmTitle || 'Do you want to book this service?');
        }
        var nameEl = modal.querySelector('.booking-service-name');
        if (nameEl) nameEl.textContent = serviceName;

        // Store data for next step
        modal.dataset.serviceId = serviceId;
        modal.dataset.serviceName = serviceName;
        modal.dataset.hasCalendar = hasCalendar ? 'true' : 'false';

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    window.closeBookingConfirm = function () {
        var modal = document.getElementById('booking-confirm-modal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    };

    window.onBookingConfirmYes = function () {
        var modal = document.getElementById('booking-confirm-modal');
        if (!modal) return;
        var serviceId = modal.dataset.serviceId;
        var serviceName = modal.dataset.serviceName;
        var hasCalendar = modal.dataset.hasCalendar === 'true';
        window.closeBookingConfirm();
        window.openBookingForm(serviceId, serviceName, hasCalendar);
    };

    // ==================== BOOKING FORM MODAL ====================

    window.openBookingForm = async function (serviceId, serviceName, hasCalendar) {
        var modal = document.getElementById('booking-form-modal');
        if (!modal) return;

        // Reset form
        var nameInput = document.getElementById('booking-guest-name');
        var roomInput = document.getElementById('booking-room-number');
        var dateGroup = document.getElementById('booking-date-group');
        var dateInput = document.getElementById('booking-date');
        var submitBtn = document.getElementById('booking-submit-btn');
        var msgDiv = document.getElementById('booking-msg');
        var errDiv = document.getElementById('booking-err');

        if (nameInput) nameInput.value = '';
        if (roomInput) roomInput.value = '';
        if (dateInput) dateInput.value = '';
        var timeFromInput = document.getElementById('booking-time-from');
        var timeToInput = document.getElementById('booking-time-to');
        if (timeFromInput) timeFromInput.value = '10:00';
        if (timeToInput) timeToInput.value = '12:00';
        if (msgDiv) msgDiv.style.display = 'none';
        if (errDiv) { errDiv.style.display = 'none'; errDiv.textContent = ''; }
        if (submitBtn) { submitBtn.disabled = false; submitBtn.classList.remove('loading'); }

        // Show/hide calendar and time based on has_calendar
        if (dateGroup) {
            dateGroup.style.display = hasCalendar ? 'flex' : 'none';
        }
        var timeGroup = document.getElementById('booking-time-group');
        if (timeGroup) {
            timeGroup.style.display = hasCalendar ? 'flex' : 'none';
        }

        // Set min date to today
        if (dateInput) {
            var today = new Date().toISOString().split('T')[0];
            dateInput.min = today;
            dateInput.value = '';
        }

        // Set service name
        var titleEl = modal.querySelector('.booking-form-service-name');
        if (titleEl) titleEl.textContent = serviceName;

        // Store service data
        modal.dataset.serviceId = serviceId;
        modal.dataset.hasCalendar = hasCalendar ? 'true' : 'false';

        // Load booked dates to disable them
        if (hasCalendar && dateInput) {
            await loadAndDisableBookedDates(serviceId, dateInput);
        }

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    window.closeBookingForm = function () {
        var modal = document.getElementById('booking-form-modal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    };

    // ==================== LOAD BOOKED DATES ====================

    var bookedDatesCache = {};

    async function loadAndDisableBookedDates(serviceId, dateInput) {
        if (!window.supabaseClient) return;
        try {
            var { data } = await window.supabaseClient
                .from('bookings')
                .select('date')
                .eq('service_id', serviceId)
                .eq('status', 'approved');

            var dates = (data || []).map(function (b) { return b.date; });
            bookedDatesCache[serviceId] = dates;

            // We'll validate on change since native date input doesn't support disabling specific dates
            dateInput.onchange = function () {
                if (dates.indexOf(dateInput.value) !== -1) {
                    var t = (window.translations && window.translations[window.currentLang]) || {};
                    var errDiv = document.getElementById('booking-err');
                    if (errDiv) {
                        errDiv.textContent = t.bookingDateTaken || 'This date is already booked. Please choose another.';
                        errDiv.style.display = 'block';
                    }
                    dateInput.value = '';
                } else {
                    var errDiv = document.getElementById('booking-err');
                    if (errDiv) { errDiv.style.display = 'none'; errDiv.textContent = ''; }
                }
            };
        } catch (e) {
            console.error('Error loading booked dates:', e);
        }
    }

    // ==================== SUBMIT BOOKING ====================

    window.submitBooking = async function () {
        var modal = document.getElementById('booking-form-modal');
        if (!modal) return;

        var serviceId = modal.dataset.serviceId;
        var hasCalendar = modal.dataset.hasCalendar === 'true';

        var nameInput = document.getElementById('booking-guest-name');
        var roomInput = document.getElementById('booking-room-number');
        var dateInput = document.getElementById('booking-date');
        var submitBtn = document.getElementById('booking-submit-btn');
        var msgDiv = document.getElementById('booking-msg');
        var errDiv = document.getElementById('booking-err');

        var guestName = nameInput ? nameInput.value.trim() : '';
        var roomNumber = roomInput ? roomInput.value.trim() : '';
        var date = dateInput ? dateInput.value : null;

        var t = (window.translations && window.translations[window.currentLang]) || {};

        // Validation
        if (!guestName) {
            if (errDiv) { errDiv.textContent = t.bookingNameRequired || 'Please enter your name'; errDiv.style.display = 'block'; }
            return;
        }
        if (!roomNumber) {
            if (errDiv) { errDiv.textContent = t.bookingRoomRequired || 'Please enter your room number'; errDiv.style.display = 'block'; }
            return;
        }
        if (hasCalendar && !date) {
            if (errDiv) { errDiv.textContent = t.bookingDateRequired || 'Please select a date'; errDiv.style.display = 'block'; }
            return;
        }

        // Check for double booking
        if (hasCalendar && bookedDatesCache[serviceId] && bookedDatesCache[serviceId].indexOf(date) !== -1) {
            if (errDiv) { errDiv.textContent = t.bookingDateTaken || 'This date is already booked'; errDiv.style.display = 'block'; }
            return;
        }

        if (!window.supabaseClient) {
            if (errDiv) { errDiv.textContent = 'Connection error'; errDiv.style.display = 'block'; }
            return;
        }

        // Disable button + show loading
        if (submitBtn) { submitBtn.disabled = true; submitBtn.classList.add('loading'); }
        if (errDiv) { errDiv.style.display = 'none'; }

        try {
            var insertData = {
                guest_name: guestName,
                room_number: roomNumber,
                service_id: serviceId,
                status: 'pending'
            };
            if (hasCalendar && date) {
                insertData.date = date;
                var timeFromInput = document.getElementById('booking-time-from');
                var timeToInput = document.getElementById('booking-time-to');
                var timeFrom = timeFromInput ? timeFromInput.value : '';
                var timeTo = timeToInput ? timeToInput.value : '';
                if (timeFrom) insertData.time_from = timeFrom;
                if (timeTo) insertData.time_to = timeTo;
            }

            var { data, error } = await window.supabaseClient
                .from('bookings')
                .insert([insertData])
                .select('id')
                .single();

            if (error) {
                if (errDiv) { errDiv.textContent = 'Error: ' + error.message; errDiv.style.display = 'block'; }
                return;
            }

            // Save booking ID for realtime tracking
            myBookingIds.push(data.id);
            saveMyBookings();

            // Send notification to Telegram Bot manually
            try {
                if (window.ROOT_SUPABASE_URL) {
                    await fetch(window.ROOT_SUPABASE_URL + '/functions/v1/booking-telegram-bot', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + window.ROOT_SUPABASE_KEY
                        },
                        body: JSON.stringify({
                            type: 'INSERT',
                            table: 'bookings',
                            record: Object.assign({}, insertData, { id: data.id })
                        })
                    });
                }
            } catch (tgErr) {
                console.error('Telegram notification error:', tgErr);
            }

            // Show success
            if (msgDiv) msgDiv.style.display = 'block';
            if (nameInput) nameInput.style.display = 'none';
            if (roomInput) roomInput.style.display = 'none';
            if (dateInput) dateInput.style.display = 'none';
            if (submitBtn) submitBtn.style.display = 'none';
            var dateGroup = document.getElementById('booking-date-group');
            if (dateGroup) dateGroup.style.display = 'none';
            var timeGroup = document.getElementById('booking-time-group');
            if (timeGroup) timeGroup.style.display = 'none';
            // Also hide labels
            modal.querySelectorAll('.booking-form-label').forEach(function (el) { el.style.display = 'none'; });

        } catch (e) {
            console.error('Booking error:', e);
            if (errDiv) { errDiv.textContent = t.bookingError || 'Error creating booking. Please try again.'; errDiv.style.display = 'block'; }
        } finally {
            if (submitBtn) { submitBtn.disabled = false; submitBtn.classList.remove('loading'); }
        }
    };

    // ==================== REALTIME BOOKING UPDATES ====================

    window.initBookingRealtime = function () {
        if (!window.supabaseClient) return;

        window.supabaseClient
            .channel('bookings_updates')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'bookings' }, function (payload) {
                var booking = payload.new;
                // Check if this is one of our bookings
                if (myBookingIds.indexOf(booking.id) === -1) return;

                var t = (window.translations && window.translations[window.currentLang]) || {};

                if (booking.status === 'approved') {
                    var title = t.bookingApprovedTitle || '✅ Booking Approved';
                    var body = t.bookingApprovedBody || 'Your booking has been approved!';
                    showBookingToast(title, body, 'approved');
                    if (window.showBrowserNotification) {
                        window.showBrowserNotification(title, body);
                    }
                    playBookingNotificationSound();
                } else if (booking.status === 'rejected') {
                    var reason = booking.reject_reason || '';
                    var title = t.bookingRejectedTitle || '❌ Booking Rejected';
                    var body = (t.bookingRejectedBody || 'Your booking was rejected') + (reason ? ': ' + reason : '');
                    showBookingToast(title, body, 'rejected');
                    if (window.showBrowserNotification) {
                        window.showBrowserNotification(title, body);
                    }
                    playBookingNotificationSound();
                }
            })
            .subscribe();
    };

    // ==================== BOOKING TOAST NOTIFICATION ====================

    function showBookingToast(title, message, type) {
        var existing = document.getElementById('booking-toast');
        if (existing) existing.remove();

        var toast = document.createElement('div');
        toast.id = 'booking-toast';
        toast.className = 'booking-toast ' + (type || 'info');
        toast.innerHTML =
            '<div class="booking-toast-content">' +
            '<div class="booking-toast-title">' + title + '</div>' +
            '<div class="booking-toast-message">' + message + '</div>' +
            '</div>' +
            '<button class="booking-toast-close" onclick="this.parentElement.remove()">' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
            '<path d="M18 6L6 18M6 6l12 12"/></svg>' +
            '</button>';

        document.body.appendChild(toast);

        // Animate in
        setTimeout(function () { toast.classList.add('show'); }, 50);

        // Auto-remove after 12 seconds
        setTimeout(function () {
            if (toast.parentElement) {
                toast.classList.remove('show');
                setTimeout(function () { if (toast.parentElement) toast.remove(); }, 500);
            }
        }, 12000);
    }

    function playBookingNotificationSound() {
        try {
            var ctx = new (window.AudioContext || window.webkitAudioContext)();
            var osc = ctx.createOscillator();
            var gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
            osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.15); // G5
            osc.frequency.setValueAtTime(880, ctx.currentTime + 0.3); // A5
            gain.gain.setValueAtTime(0.25, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 1);
        } catch (e) { /* ignore audio errors */ }
    }

})();
