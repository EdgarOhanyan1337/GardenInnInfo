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

        // Close any currently active modals before opening
        var activeModals = document.querySelectorAll('.modal.active');
        activeModals.forEach(function(m) {
            if (m !== modal) m.classList.remove('active');
        });

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

        // Set min date and initial value to today (Armenia time)
        var armTodayStr = '';
        if (dateInput) {
            var armeniaTimeStr = new Date().toLocaleString("en-US", { timeZone: "Asia/Yerevan" });
            var armeniaNow = new Date(armeniaTimeStr);
            var armYear = armeniaNow.getFullYear();
            var armMonth = String(armeniaNow.getMonth() + 1).padStart(2, '0');
            var armDay = String(armeniaNow.getDate()).padStart(2, '0');
            armTodayStr = armYear + '-' + armMonth + '-' + armDay;
            
            // Initialize Flatpickr for date
            if (window.flatpickr) {
                flatpickr(dateInput, {
                    minDate: armTodayStr,
                    defaultDate: armTodayStr,
                    dateFormat: "Y-m-d",
                    disableMobile: "true"
                });
            } else {
                dateInput.min = armTodayStr;
                dateInput.value = armTodayStr;
            }
        }

        // Initialize Flatpickr for time inputs
        if (window.flatpickr) {
            if (timeFromInput) {
                flatpickr(timeFromInput, {
                    enableTime: true,
                    noCalendar: true,
                    dateFormat: "H:i",
                    time_24hr: true,
                    defaultDate: "10:00",
                    disableMobile: "true"
                });
            }
            if (timeToInput) {
                flatpickr(timeToInput, {
                    enableTime: true,
                    noCalendar: true,
                    dateFormat: "H:i",
                    time_24hr: true,
                    defaultDate: "12:00",
                    disableMobile: "true"
                });
            }
        }

        // Set service name
        var titleEl = modal.querySelector('.booking-form-service-name');
        if (titleEl) titleEl.textContent = serviceName;

        // Store service data
        modal.dataset.serviceId = serviceId;
        modal.dataset.hasCalendar = hasCalendar ? 'true' : 'false';

        // Load booked time slots for overlap checking
        if (hasCalendar) {
            await loadBookedSlots(serviceId);
        }

        // Close any currently active modals before opening
        var activeModals = document.querySelectorAll('.modal.active');
        activeModals.forEach(function(m) {
            if (m !== modal) m.classList.remove('active');
        });

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

    // ==================== LOAD BOOKED TIME SLOTS ====================

    var bookedSlotsCache = {};

    async function loadBookedSlots(serviceId) {
        if (!window.supabaseClient) return;
        try {
            var { data } = await window.supabaseClient
                .from('bookings')
                .select('date, time_from, time_to')
                .eq('service_id', serviceId)
                .in('status', ['approved', 'pending']);

            bookedSlotsCache[serviceId] = (data || []).map(function (b) {
                return { date: b.date, time_from: b.time_from, time_to: b.time_to };
            });
        } catch (e) {
            console.error('Error loading booked slots:', e);
        }
    }

    function timeToMinutes(t) {
        if (!t) return 0;
        var parts = t.split(':');
        return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    }

    function hasTimeOverlap(serviceId, date, timeFrom, timeTo) {
        var slots = bookedSlotsCache[serviceId];
        if (!slots || !slots.length) return false;
        var newStart = timeToMinutes(timeFrom);
        var newEnd = timeToMinutes(timeTo);
        for (var i = 0; i < slots.length; i++) {
            if (slots[i].date === date && slots[i].time_from && slots[i].time_to) {
                var existStart = timeToMinutes(slots[i].time_from);
                var existEnd = timeToMinutes(slots[i].time_to);
                // Overlap: newStart < existEnd AND newEnd > existStart
                if (newStart < existEnd && newEnd > existStart) {
                    return true;
                }
            }
        }
        return false;
    }

    // ==================== SUBMIT BOOKING ====================

    window.submitBooking = async function () {
        var modal = document.getElementById('booking-form-modal');
        if (!modal) return;

        var serviceId = modal.dataset.serviceId;
        var hasCalendar = modal.dataset.hasCalendar === 'true';

        var nameInput = document.getElementById('booking-guest-name');
        var dateInput = document.getElementById('booking-date');
        var submitBtn = document.getElementById('booking-submit-btn');
        var msgDiv = document.getElementById('booking-msg');
        var errDiv = document.getElementById('booking-err');

        var guestName = nameInput ? nameInput.value.trim() : '';
        var roomNumber = window.getRoomNumber ? window.getRoomNumber() : '';
        var date = dateInput ? dateInput.value : null;

        var t = (window.translations && window.translations[window.currentLang]) || {};

        // Validation
        if (!guestName) {
            if (errDiv) { errDiv.textContent = t.bookingNameRequired || 'Please enter your name'; errDiv.style.display = 'block'; }
            return;
        }
        if (!roomNumber) {
            if (errDiv) { errDiv.textContent = t.bookingRoomRequired || 'Room not detected. Please scan the QR code in your room.'; errDiv.style.display = 'block'; }
            return;
        }
        if (hasCalendar && !date) {
            if (errDiv) { errDiv.textContent = t.bookingDateRequired || 'Please select a date'; errDiv.style.display = 'block'; }
            return;
        }


        var timeFromInput = document.getElementById('booking-time-from');
        var timeToInput = document.getElementById('booking-time-to');
        var timeFrom = timeFromInput ? timeFromInput.value : '';
        var timeTo = timeToInput ? timeToInput.value : '';

        // Validate time ordering: time_from must be before time_to
        if (hasCalendar && timeFrom && timeTo) {
            if (timeToMinutes(timeFrom) >= timeToMinutes(timeTo)) {
                if (errDiv) { errDiv.textContent = t.bookingTimeOrder || 'End time must be after start time.'; errDiv.style.display = 'block'; }
                return;
            }
        }

        // Check for time overlap with existing bookings
        if (hasCalendar && date && timeFrom && timeTo && hasTimeOverlap(serviceId, date, timeFrom, timeTo)) {
            if (errDiv) { errDiv.textContent = t.bookingTimeOverlap || 'This time slot overlaps with an existing booking. Please choose a different time.'; errDiv.style.display = 'block'; }
            return;
        }

        // Armenian Time validation
        if (hasCalendar && date && timeFrom) {
            var armeniaTimeStr = new Date().toLocaleString("en-US", { timeZone: "Asia/Yerevan" });
            var armeniaNow = new Date(armeniaTimeStr);
            
            var armYear = armeniaNow.getFullYear();
            var armMonth = String(armeniaNow.getMonth() + 1).padStart(2, '0');
            var armDay = String(armeniaNow.getDate()).padStart(2, '0');
            var armTodayStr = armYear + '-' + armMonth + '-' + armDay;

            if (date === armTodayStr) {
                var timeParts = timeFrom.split(':');
                var hours = parseInt(timeParts[0], 10);
                var minutes = parseInt(timeParts[1], 10);
                var armHours = armeniaNow.getHours();
                var armMinutes = armeniaNow.getMinutes();
                
                if (hours < armHours || (hours === armHours && minutes <= armMinutes)) {
                    if (errDiv) { errDiv.textContent = t.bookingTimePast || 'Cannot book a time that has already passed.'; errDiv.style.display = 'block'; }
                    return;
                }
            }
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

            // The Supabase Database Webhook will automatically send the Telegram notification
            // when the 'bookings' row is inserted. No need to trigger manually here.

            // Show success
            if (msgDiv) msgDiv.style.display = 'block';
            if (nameInput) nameInput.style.display = 'none';
            if (dateInput) dateInput.style.display = 'none';
            if (submitBtn) submitBtn.style.display = 'none';
            var dateGroup = document.getElementById('booking-date-group');
            if (dateGroup) dateGroup.style.display = 'none';
            var timeGroup = document.getElementById('booking-time-group');
            if (timeGroup) timeGroup.style.display = 'none';
            // Hide info card, labels, and hint
            var infoCard = modal.querySelector('.booking-info-card');
            if (infoCard) infoCard.style.display = 'none';
            var hint = modal.querySelector('.booking-form-hint');
            if (hint) hint.style.display = 'none';
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
                    var body = (t.bookingApprovedBody || 'Your booking has been approved!') + '\n' + (t.bookingReceptionMsg || '🏨 Please approach the reception.');
                    showBookingToast(title, body, 'approved');
                    playBookingNotificationSound();

                    // Schedule 30-minute reminder if booking has date and time
                    if (booking.date && booking.time_from) {
                        scheduleBookingReminder(booking);
                    }
                } else if (booking.status === 'rejected') {
                    var reason = booking.reject_reason || '';
                    var title = t.bookingRejectedTitle || '❌ Booking Rejected';
                    var body = (t.bookingRejectedBody || 'Your booking was rejected') + (reason ? ': ' + reason : '');
                    showBookingToast(title, body, 'rejected');
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
    // ==================== 30-MINUTE BOOKING REMINDER ====================

    var scheduledReminders = {};

    function scheduleBookingReminder(booking) {
        if (scheduledReminders[booking.id]) return; // already scheduled

        try {
            // Parse booking date + time_from in Yerevan timezone
            var dateStr = booking.date; // e.g. "2026-03-26"
            var timeStr = booking.time_from; // e.g. "15:00"
            var parts = dateStr.split('-');
            var timeParts = timeStr.split(':');

            // Get current time in Armenia
            var armeniaTimeStr = new Date().toLocaleString("en-US", { timeZone: "Asia/Yerevan" });
            var armeniaNow = new Date(armeniaTimeStr);

            // Construct booking start time as Armenia local
            var bookingStart = new Date(
                parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]),
                parseInt(timeParts[0]), parseInt(timeParts[1]), 0
            );

            // 30 minutes before
            var reminderTime = new Date(bookingStart.getTime() - 30 * 60 * 1000);
            var msUntilReminder = reminderTime.getTime() - armeniaNow.getTime();

            if (msUntilReminder > 0) {
                var t = (window.translations && window.translations[window.currentLang]) || {};
                scheduledReminders[booking.id] = setTimeout(function () {
                    var title = t.bookingReminderTitle || '⏳ Booking Reminder';
                    var body = (t.bookingReminderBody || 'Your booking starts in 30 minutes!') + '\n' + (t.bookingReceptionMsg || '🏨 Please approach the reception.');
                    showBookingToast(title, body, 'approved');
                    if (window.showBrowserNotification) {
                        window.showBrowserNotification(title, body);
                    }
                    playBookingNotificationSound();
                    delete scheduledReminders[booking.id];
                }, msUntilReminder);
                console.log('Reminder scheduled for booking', booking.id, 'in', Math.round(msUntilReminder / 60000), 'minutes');
            }
        } catch (e) {
            console.error('Error scheduling reminder:', e);
        }
    }

})();
