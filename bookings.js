/**
 * Garden Inn Resort - Booking System
 * Handles paid service bookings with calendar, Supabase integration, and real-time updates
 */

(function () {
    'use strict';

    function getBookingsStorageKey() {
        var room = window.getRoomNumber ? window.getRoomNumber() : localStorage.getItem('gi_room_number');
        return 'gi_my_bookings_' + (room ? room : 'unknown');
    }

    // Track booking session (guest's pending bookings by service_id)
    function getMyBookingIds() {
        return JSON.parse(localStorage.getItem(getBookingsStorageKey()) || '[]');
    }

    function saveMyBookings(ids) {
        localStorage.setItem(getBookingsStorageKey(), JSON.stringify(ids));
    }

    window.updateMyBookingsButton = function() {
        // Disabled by user request. The button now translates just like 'Tours' and 'Mini Bar'.
    };

    // ==================== BOOKING CONFIRM MODAL ====================

    window.showBookingConfirm = function (serviceId, serviceName, hasCalendar, serviceType) {
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
        modal.dataset.serviceType = serviceType || 'service';

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
        var serviceType = modal.dataset.serviceType;
        window.closeBookingConfirm();
        window.openBookingForm(serviceId, serviceName, hasCalendar, serviceType);
    };

    // ==================== BOOKING FORM MODAL ====================

    window.openBookingForm = async function (serviceId, serviceName, hasCalendar, serviceType) {
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

        var isTour = (serviceType === 'tour');

        // Show/hide calendar and time based on has_calendar
        if (dateGroup) {
            dateGroup.style.display = hasCalendar ? 'flex' : 'none';
        }
        var timeGroup = document.getElementById('booking-time-group');
        if (timeGroup) {
            timeGroup.style.display = hasCalendar ? 'flex' : 'none';
        }

        // For tours: hide the "TO" slot and divider, change label to "Pickup Time"
        var timeToSlot = document.querySelector('#booking-time-group .time-picker-slot:last-child');
        var timeDivider = document.querySelector('#booking-time-group .time-picker-divider');
        var timeFromLabel = document.querySelector('#booking-time-group .time-picker-slot:first-child .time-picker-label');
        var timeGroupLabel = document.querySelector('[for="booking-time-group"], #booking-time-group .hk-label, label[data-key="bookingTime"]');
        // Also find the main time label above the time picker card
        var timeMainLabel = null;
        var allLabels = document.querySelectorAll('#booking-time-group .booking-form-label, #booking-time-group .hk-label');
        if (allLabels.length > 0) timeMainLabel = allLabels[0];

        if (isTour && hasCalendar) {
            if (timeToSlot) timeToSlot.style.display = 'none';
            if (timeDivider) timeDivider.style.display = 'none';
            if (timeFromLabel) {
                var t2 = (window.translations && window.translations[window.currentLang]) || {};
                timeFromLabel.textContent = t2.bookingPickupTime || 'PICKUP';
            }
            if (timeMainLabel) {
                var t2 = (window.translations && window.translations[window.currentLang]) || {};
                timeMainLabel.innerHTML = '🕐 ' + (t2.bookingPickupTimeLabel || 'Pickup Time');
            }
        } else {
            if (timeToSlot) timeToSlot.style.display = '';
            if (timeDivider) timeDivider.style.display = '';
            if (timeFromLabel) {
                var t2 = (window.translations && window.translations[window.currentLang]) || {};
                timeFromLabel.textContent = t2.bookingTimeFrom || 'FROM';
            }
            if (timeMainLabel) {
                var t2 = (window.translations && window.translations[window.currentLang]) || {};
                timeMainLabel.innerHTML = '🕐 ' + (t2.bookingTime || 'Select Time');
            }
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
                    disableMobile: true,
                    allowInput: false
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
                    dateFormat: "H:00",
                    time_24hr: true,
                    defaultDate: "10:00",
                    disableMobile: true,
                    allowInput: false,
                    minuteIncrement: 60,
                    onOpen: function(selectedDates, dateStr, instance) {
                        instance.calendarContainer.classList.add('hour-only-picker');
                    }
                });
            }
            if (timeToInput && !isTour) {
                flatpickr(timeToInput, {
                    enableTime: true,
                    noCalendar: true,
                    dateFormat: "H:00",
                    time_24hr: true,
                    defaultDate: "12:00",
                    disableMobile: true,
                    allowInput: false,
                    minuteIncrement: 60,
                    onOpen: function(selectedDates, dateStr, instance) {
                        instance.calendarContainer.classList.add('hour-only-picker');
                    }
                });
            }
        }

        // Set service name
        var titleEl = modal.querySelector('.booking-form-service-name');
        if (titleEl) titleEl.textContent = serviceName;

        // Store service data
        modal.dataset.serviceId = serviceId;
        modal.dataset.hasCalendar = hasCalendar ? 'true' : 'false';
        modal.dataset.serviceType = serviceType || 'service';

        // Load booked time slots for overlap checking
        if (hasCalendar) {
            await loadBookedSlots(serviceId, serviceType);
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

    async function loadBookedSlots(serviceId, serviceType) {
        if (!window.supabaseClient) return;
        try {
            var column = serviceType === 'tour' ? 'tour_id' : 'service_id';
            var { data } = await window.supabaseClient
                .from('bookings')
                .select('date, time_from, time_to')
                .eq(column, serviceId)
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
        var serviceType = modal.dataset.serviceType;

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


        var isTourBooking = (serviceType === 'tour');
        var timeFromInput = document.getElementById('booking-time-from');
        var timeToInput = document.getElementById('booking-time-to');
        var timeFrom = timeFromInput ? timeFromInput.value : '';
        var timeTo = (!isTourBooking && timeToInput) ? timeToInput.value : '';

        // Strict time format validation
        var timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (hasCalendar && timeFrom && !timeRegex.test(timeFrom)) {
            if (errDiv) { errDiv.textContent = t.bookingInvalidTime || 'Invalid time format. Use HH:MM.'; errDiv.style.display = 'block'; }
            return;
        }
        if (!isTourBooking && hasCalendar && timeTo && !timeRegex.test(timeTo)) {
            if (errDiv) { errDiv.textContent = t.bookingInvalidTime || 'Invalid end time format. Use HH:MM.'; errDiv.style.display = 'block'; }
            return;
        }

        // Validate time ordering: time_from must be before time_to (skip for tours - they only have pickup time)
        if (!isTourBooking && hasCalendar && timeFrom && timeTo) {
            if (timeToMinutes(timeFrom) >= timeToMinutes(timeTo)) {
                if (errDiv) { errDiv.textContent = t.bookingTimeOrder || 'End time must be after start time.'; errDiv.style.display = 'block'; }
                return;
            }
        }

        // Check for time overlap with existing bookings (skip for tours)
        if (!isTourBooking && hasCalendar && date && timeFrom && timeTo && hasTimeOverlap(serviceId, date, timeFrom, timeTo)) {
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
                status: 'pending'
            };
            if (serviceType === 'tour') {
                insertData.tour_id = serviceId;
            } else {
                insertData.service_id = serviceId;
            }
            if (hasCalendar && date) {
                insertData.date = date;
                if (timeFrom) insertData.time_from = timeFrom;
                if (!isTourBooking && timeTo) insertData.time_to = timeTo;
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
            var myBookingIds = getMyBookingIds();
            myBookingIds.push(data.id);
            saveMyBookings(myBookingIds);

            // Trigger Edge Function directly from frontend to ensure Telegram delivery (bypass unreliable webhooks)
            try {
                // Ensure insertData has the ID added so the webhook can read it
                var fullRecord = Object.assign({}, insertData, { id: data.id });
                await fetch(window.ROOT_SUPABASE_URL + '/functions/v1/booking-telegram-bot', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + window.ROOT_SUPABASE_KEY
                    },
                    body: JSON.stringify({
                        type: 'FRONTEND_INSERT',
                        table: 'bookings',
                        record: fullRecord
                    })
                });
            } catch (fetchErr) {
                console.error('Error triggering booking-telegram-bot:', fetchErr);
            }

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
                var myBookingIds = getMyBookingIds();
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

    // ==================== MY BOOKINGS MODAL ====================

    window.openMyBookings = async function () {
        var t = (window.translations && window.translations[window.currentLang]) || {};
        var myBookingIds = getMyBookingIds();

        if (!myBookingIds || myBookingIds.length === 0) {
            // Show a pretty toast instead of ugly alert
            var emptyMsg = t.myBookingsEmptyAlert || (window.currentLang === 'ru' ? 'У вас еще нет бронирований.' : window.currentLang === 'hy' ? 'Դուք դեռ չունեք ամրագրումներ:' : 'You have no bookings yet.');
            showBookingToast('📭 ' + (t.myBookings || 'My Bookings'), emptyMsg, 'info');
            return;
        }

        var modal = document.getElementById('my-bookings-modal');
        var listEl = document.getElementById('my-bookings-list');
        var emptyEl = document.getElementById('my-bookings-empty');
        var loadingEl = document.getElementById('my-bookings-loading');
        if (!modal) return;

        // Show modal
        var activeModals = document.querySelectorAll('.modal.active');
        activeModals.forEach(function (m) { m.classList.remove('active'); });
        setTimeout(function () { modal.classList.add('active'); }, 50);
        document.body.style.overflow = 'hidden';

        // Show loading
        if (listEl) listEl.innerHTML = '';
        if (emptyEl) emptyEl.style.display = 'none';
        if (loadingEl) loadingEl.style.display = 'block';

        if (!window.supabaseClient) {
            if (loadingEl) loadingEl.style.display = 'none';
            if (emptyEl) emptyEl.style.display = 'block';
            return;
        }

        try {
            var { data, error } = await window.supabaseClient
                .from('bookings')
                .select('*, services(title_ru, title_en, title_hy), tours(title_ru, title_en, title_hy)')
                .in('id', myBookingIds)
                .order('created_at', { ascending: false })
                .limit(40);

            if (loadingEl) loadingEl.style.display = 'none';

            if (error || !data || data.length === 0) {
                if (emptyEl) emptyEl.style.display = 'block';
                return;
            }

            var lang = window.currentLang || 'en';
            var html = '';

            data.forEach(function (b) {
                var statusColor = '#fbbf24'; // Default to amber
                var statusEmoji = '⏳';
                var statusLabel = b.status === 'approved' ? (t.approved || 'Approved') : b.status === 'rejected' ? (t.rejected || 'Rejected') : (t.pending || 'Pending');

                if (b.status === 'rejected' || b.status === 'cancelled') {
                    statusColor = '#f87171'; // Red
                    statusEmoji = '❌';
                    statusLabel = b.status === 'cancelled' ? (t.cancelled || 'Cancelled') : statusLabel;
                } else {
                    // Check if the booking has passed
                    var isPassed = false;
                    if (b.date) {
                        var armeniaTimeStr = new Date().toLocaleString("en-US", { timeZone: "Asia/Yerevan" });
                        var armeniaNow = new Date(armeniaTimeStr);
                        
                        var parts = b.date.split('-');
                        var timeParts = b.time_from ? b.time_from.split(':') : ['23', '59'];
                        
                        var bookingTime = new Date(
                            parseInt(parts[0], 10), 
                            parseInt(parts[1], 10) - 1, 
                            parseInt(parts[2], 10),
                            parseInt(timeParts[0], 10), 
                            parseInt(timeParts[1], 10), 0
                        );
                        
                        if (armeniaNow > bookingTime) {
                            isPassed = true;
                        }
                    }
                    
                    if (isPassed) {
                        statusColor = '#f97316'; // Orange
                        statusEmoji = b.status === 'approved' ? '✅' : '⏳';
                        var passedWord = t.passed || (lang === 'ru' ? 'Завершено' : lang === 'hy' ? 'Ավարտված է' : 'Passed');
                        statusLabel = passedWord;
                    } else {
                        statusColor = b.status === 'approved' ? '#4ade80' : '#f97316'; // Green for Approved, Orange for Pending
                        statusEmoji = b.status === 'approved' ? '✅' : '⏳';
                    }
                }

                // Service or Tour name
                var name = '';
                if (b.services) {
                    name = b.services['title_' + lang] || b.services.title_en || '';
                } else if (b.tours) {
                    name = '🗺️ ' + (b.tours['title_' + lang] || b.tours.title_en || '');
                }

                // Date & time
                var dateInfo = '';
                if (b.date) {
                    var parts = b.date.split('-');
                    dateInfo = parts[2] + '.' + parts[1] + '.' + parts[0];
                    if (b.time_from && b.time_to) {
                        dateInfo += ' &nbsp;🕐 ' + b.time_from + ' — ' + b.time_to;
                    } else if (b.time_from) {
                        dateInfo += ' &nbsp;🕐 ' + b.time_from;
                    }
                }

                var rejectNote = (b.status === 'rejected' && b.reject_reason)
                    ? '<div style="font-size:12px; color:#f87171; margin-top:6px;">📝 ' + b.reject_reason + '</div>'
                    : '';

                html += '<div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-left: 3px solid ' + statusColor + '; border-radius: 12px; padding: 14px 16px;">' +
                    '<div style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px;">' +
                        '<div>' +
                            '<div style="font-weight:600; color: var(--color-primary-light); font-size:15px;">' + (name || '—') + '</div>' +
                            (dateInfo ? '<div style="font-size:13px; color:var(--color-text-muted); margin-top:4px;">' + dateInfo + '</div>' : '') +
                            rejectNote +
                        '</div>' +
                        '<span style="font-size:12px; font-weight:700; color:' + statusColor + '; background: rgba(255,255,255,0.05); padding: 4px 10px; border-radius: 20px; white-space:nowrap;">' + statusEmoji + ' ' + statusLabel + '</span>' +
                    '</div>' +
                    '<div style="font-size:11px; color:var(--color-text-muted); margin-top:8px;">' + new Date(b.created_at).toLocaleDateString() + '</div>' +
                '</div>';
            });

            if (listEl) listEl.innerHTML = html;

        } catch (e) {
            console.error('My Bookings error:', e);
            if (loadingEl) loadingEl.style.display = 'none';
            if (emptyEl) emptyEl.style.display = 'block';
        }
    };

    // Close My Bookings modal properly (prevents frozen buttons bug)
    window.closeMyBookings = function () {
        var modal = document.getElementById('my-bookings-modal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(function () { modal.style.display = 'none'; }, 300);
            document.body.style.overflow = '';
        }
    };

})();
