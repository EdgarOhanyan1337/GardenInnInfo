(function() {
    var ADM_URL = 'https://klnxybjaaxtlfabnzxcd.supabase.co';
    var ADM_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtsbnh5YmphYXh0bGZhYm56eGNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NjA2MjksImV4cCI6MjA4OTQzNjYyOX0.uUAxzL-8nBkgqoYkQg74Ych0BzKFBVcN_IJlqoZ8tQM';
    var db = window.supabase.createClient(ADM_URL, ADM_KEY);

    window.currentTableData = {};
    window.editState = {
        minibar_items: null,
        services: null,
        tours: null,
        rules: null,
        translations: null
    };

    // --- IMAGE UPLOAD ---
    async function uploadImage(file) {
        if (!file) return null;
        var ext = file.name.split('.').pop();
        var path = Date.now() + '_' + Math.random().toString(36).slice(2) + '.' + ext;
        var { error } = await db.storage.from('images').upload(path, file);
        if (error) { console.error('Upload Error:', error); alert('Upload failed: ' + error.message); return null; }
        var { data } = db.storage.from('images').getPublicUrl(path);
        return data.publicUrl;
    }

    // --- AUTH ---
    window.login = async function() {
        var email = document.getElementById('email').value;
        var pass = document.getElementById('password').value;
        var { error } = await db.auth.signInWithPassword({ email: email, password: pass });
        if (error) { alert('Login Failed: ' + error.message); return; }
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        loadData('minibar_items', renderMinibar);
    };

    window.logout = async function() {
        await db.auth.signOut();
        location.reload();
    };

    db.auth.getSession().then(function(result) {
        if (result.data.session) {
            document.getElementById('login-screen').style.display = 'none';
            document.getElementById('dashboard').style.display = 'block';
            loadData('minibar_items', renderMinibar);
        }
    });

    // --- SECTIONS ---
    var sectionMap = {
        'minibar_items': 'minibar-section',
        'services': 'services-section',
        'tours': 'tours-section',
        'rules': 'rules-section',
        'translations': 'translations-section',
        'notification_recipients': 'notifications-section',
        'housekeeping_requests': 'housekeeping-section',
        'housekeeping_ratings': 'ratings-section',
        'bookings': 'bookings-section'
    };

    window.loadData = async function(table, renderCallback) {
        Object.values(sectionMap).forEach(function(id) {
            var el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });
        var sectionId = sectionMap[table];
        if (sectionId) {
            var el = document.getElementById(sectionId);
            if (el) el.style.display = 'block';
        }
        try {
            var { data, error } = await db.from(table).select('*').order('id', { ascending: false });
            if (error) { console.error('Load error:', error); renderCallback([]); return; }
            window.currentTableData[table] = data || [];
            renderCallback(data || []);
        } catch (e) {
            console.error('Fatal load error:', e);
            renderCallback([]);
        }
    };

    // --- MINIBAR ---
    window.renderMinibar = function(data) {
        var html = '<table><tr><th>Image</th><th>Name</th><th>Price</th><th>Actions</th></tr>';
        data.forEach(function(item) {
            html += '<tr><td><img src="' + item.image_url + '" width="50" onerror="this.src=\'https://placehold.co/50x50?text=No+Image\'"></td>' +
                '<td>' + item.name + '</td><td>' + item.price + ' AMD</td>' +
                '<td style="display:flex;gap:6px;">' +
                '<button class="btn-edit" onclick="startEditMinibar(\'' + item.id + '\')">Edit</button>' +
                '<button class="btn-danger" onclick="deleteItem(\'minibar_items\',\'' + item.id + '\',renderMinibar)">Delete</button></td></tr>';
        });
        html += '</table>';
        document.getElementById('minibar-table').innerHTML = html;
    };

    window.startEditMinibar = function(id) {
        var item = window.currentTableData['minibar_items'].find(function(i) { return i.id === id; });
        if (!item) return;
        window.editState.minibar_items = id;
        document.getElementById('mb-name').value = item.name || '';
        document.getElementById('mb-price').value = item.price || '';
        document.getElementById('mb-submit-btn').textContent = 'Update Item';
        document.getElementById('mb-cancel-btn').style.display = 'inline-flex';
        document.getElementById('minibar-section').scrollIntoView({behavior: "smooth"});
    };

    window.cancelEditMinibar = function() {
        window.editState.minibar_items = null;
        document.getElementById('mb-name').value = '';
        document.getElementById('mb-price').value = '';
        document.getElementById('mb-file').value = '';
        document.getElementById('mb-submit-btn').textContent = '+ Add Item';
        document.getElementById('mb-cancel-btn').style.display = 'none';
    };

    window.addMinibarItem = async function() {
        var name = document.getElementById('mb-name').value;
        var price = document.getElementById('mb-price').value;
        if (!name || !price) { alert('Fill in name and price!'); return; }
        
        var file = document.getElementById('mb-file').files[0];
        var isEditing = window.editState.minibar_items !== null;
        var uploadUrl = null;
        if (file) { uploadUrl = await uploadImage(file); if (!uploadUrl) return; }
        
        var updateData = { name: name, price: parseInt(price) };
        if (uploadUrl) updateData.image_url = uploadUrl;

        var error;
        if (isEditing) {
            var res = await db.from('minibar_items').update(updateData).eq('id', window.editState.minibar_items);
            error = res.error;
        } else {
            updateData.image_url = uploadUrl || '';
            var res = await db.from('minibar_items').insert([updateData]);
            error = res.error;
        }

        if (error) { alert('Error: ' + error.message); return; }
        window.cancelEditMinibar();
        loadData('minibar_items', renderMinibar);
    };

    // --- SERVICES (multi-lang) ---
    window.toggleServicePrice = function() {
        var type = document.getElementById('svc-type').value;
        var container = document.getElementById('svc-price-container');
        container.style.display = type === 'paid' ? 'block' : 'none';
    };

    window.renderServices = function(data) {
        var html = '<table><tr><th>Icon</th><th>Key</th><th>Title EN</th><th>Title RU</th><th>Title HY</th><th>Type & Price</th><th>Actions</th></tr>';
        data.forEach(function(item) {
            var priceDisplay = item.status_type === 'paid' && item.price ? ' (' + item.price + ')' : '';
            html += '<tr><td>' + item.icon + '</td><td>' + item.service_key + '</td>' +
                '<td>' + item.title_en + '</td><td>' + item.title_ru + '</td><td>' + item.title_hy + '</td>' +
                '<td>' + item.status_type + priceDisplay + '</td>' +
                '<td style="display:flex;gap:6px;">' +
                '<button class="btn-edit" onclick="startEditService(\'' + item.id + '\')">Edit</button>' +
                '<button class="btn-danger" onclick="deleteItem(\'services\',\'' + item.id + '\',renderServices)">Delete</button></td></tr>';
        });
        html += '</table>';
        document.getElementById('services-table').innerHTML = html;
    };

    window.startEditService = function(id) {
        var item = window.currentTableData['services'].find(function(i) { return i.id === id; });
        if (!item) return;
        window.editState.services = id;
        document.getElementById('svc-key').value = item.service_key || '';
        document.getElementById('svc-title-en').value = item.title_en || '';
        document.getElementById('svc-title-ru').value = item.title_ru || '';
        document.getElementById('svc-title-hy').value = item.title_hy || '';
        document.getElementById('svc-desc-en').value = item.description_en || '';
        document.getElementById('svc-desc-ru').value = item.description_ru || '';
        document.getElementById('svc-desc-hy').value = item.description_hy || '';
        document.getElementById('svc-type').value = item.status_type || 'free';
        document.getElementById('svc-price').value = item.price || '';
        document.getElementById('svc-icon').value = item.icon || '';
        document.getElementById('svc-has-calendar').checked = item.has_calendar || false;
        window.toggleServicePrice();
        document.getElementById('svc-submit-btn').textContent = 'Update Service';
        document.getElementById('svc-cancel-btn').style.display = 'inline-flex';
        document.getElementById('services-section').scrollIntoView({behavior: "smooth"});
    };

    window.cancelEditService = function() {
        window.editState.services = null;
        document.getElementById('svc-key').value = '';
        document.getElementById('svc-title-en').value = '';
        document.getElementById('svc-title-ru').value = '';
        document.getElementById('svc-title-hy').value = '';
        document.getElementById('svc-desc-en').value = '';
        document.getElementById('svc-desc-ru').value = '';
        document.getElementById('svc-desc-hy').value = '';
        document.getElementById('svc-type').value = 'free';
        document.getElementById('svc-price').value = '';
        document.getElementById('svc-icon').value = '';
        document.getElementById('svc-has-calendar').checked = false;
        document.getElementById('svc-file').value = '';
        window.toggleServicePrice();
        document.getElementById('svc-submit-btn').textContent = '+ Add Service';
        document.getElementById('svc-cancel-btn').style.display = 'none';
    };

    window.addService = async function() {
        var service_key = document.getElementById('svc-key').value;
        var title_en = document.getElementById('svc-title-en').value;
        var title_ru = document.getElementById('svc-title-ru').value || title_en;
        var title_hy = document.getElementById('svc-title-hy').value || title_en;
        var description_en = document.getElementById('svc-desc-en').value;
        var description_ru = document.getElementById('svc-desc-ru').value || description_en;
        var description_hy = document.getElementById('svc-desc-hy').value || description_en;
        var status_type = document.getElementById('svc-type').value;
        var price = status_type === 'paid' ? document.getElementById('svc-price').value : '';
        var icon = document.getElementById('svc-icon').value;
        var has_calendar = document.getElementById('svc-has-calendar').checked;
        var is_paid = status_type === 'paid';
        if (!service_key || !title_en) { alert('Fill in key and English title!'); return; }
        
        var files = document.getElementById('svc-file').files;
        var isEditing = window.editState.services !== null;
        var updateData = {
            service_key: service_key, title_en: title_en, title_ru: title_ru, title_hy: title_hy,
            description_en: description_en, description_ru: description_ru, description_hy: description_hy,
            status_type: status_type, price: price, icon: icon,
            has_calendar: has_calendar, is_paid: is_paid
        };

        if (files.length > 0) {
            var images = [];
            for (let i = 0; i < files.length; i++) {
                var url = await uploadImage(files[i]);
                if (url) images.push(url);
            }
            updateData.images = images;
        }

        var error;
        if (isEditing) {
            var res = await db.from('services').update(updateData).eq('id', window.editState.services);
            error = res.error;
        } else {
            if (!updateData.images) updateData.images = [];
            var res = await db.from('services').insert([updateData]);
            error = res.error;
        }

        if (error) { alert('Error: ' + error.message); return; }
        window.cancelEditService();
        loadData('services', renderServices);
    };

    // --- TOURS (multi-lang) ---
    window.renderTours = function(data) {
        var html = '<table><tr><th>Icon</th><th>Key</th><th>Title EN</th><th>Title RU</th><th>Title HY</th><th>Price</th><th>Actions</th></tr>';
        data.forEach(function(item) {
            html += '<tr><td>' + item.icon + '</td><td>' + item.tour_key + '</td>' +
                '<td>' + item.title_en + '</td><td>' + item.title_ru + '</td><td>' + item.title_hy + '</td>' +
                '<td>' + item.price + '</td>' +
                '<td style="display:flex;gap:6px;">' +
                '<button class="btn-edit" onclick="startEditTour(\'' + item.id + '\')">Edit</button>' +
                '<button class="btn-danger" onclick="deleteItem(\'tours\',\'' + item.id + '\',renderTours)">Delete</button></td></tr>';
        });
        html += '</table>';
        document.getElementById('tours-table').innerHTML = html;
    };

    window.startEditTour = function(id) {
        var item = window.currentTableData['tours'].find(function(i) { return i.id === id; });
        if (!item) return;
        window.editState.tours = id;
        document.getElementById('tour-key').value = item.tour_key || '';
        document.getElementById('tour-title-en').value = item.title_en || '';
        document.getElementById('tour-title-ru').value = item.title_ru || '';
        document.getElementById('tour-title-hy').value = item.title_hy || '';
        document.getElementById('tour-desc-en').value = item.description_en || '';
        document.getElementById('tour-desc-ru').value = item.description_ru || '';
        document.getElementById('tour-desc-hy').value = item.description_hy || '';
        document.getElementById('tour-price').value = item.price || '';
        document.getElementById('tour-icon').value = item.icon || '';
        document.getElementById('tour-submit-btn').textContent = 'Update Tour';
        document.getElementById('tour-cancel-btn').style.display = 'inline-flex';
        document.getElementById('tours-section').scrollIntoView({behavior: "smooth"});
    };

    window.cancelEditTour = function() {
        window.editState.tours = null;
        document.getElementById('tour-key').value = '';
        document.getElementById('tour-title-en').value = '';
        document.getElementById('tour-title-ru').value = '';
        document.getElementById('tour-title-hy').value = '';
        document.getElementById('tour-desc-en').value = '';
        document.getElementById('tour-desc-ru').value = '';
        document.getElementById('tour-desc-hy').value = '';
        document.getElementById('tour-price').value = '';
        document.getElementById('tour-icon').value = '';
        document.getElementById('tour-file').value = '';
        document.getElementById('tour-submit-btn').textContent = '+ Add Tour';
        document.getElementById('tour-cancel-btn').style.display = 'none';
    };

    window.addTour = async function() {
        var tour_key = document.getElementById('tour-key').value;
        var title_en = document.getElementById('tour-title-en').value;
        var title_ru = document.getElementById('tour-title-ru').value || title_en;
        var title_hy = document.getElementById('tour-title-hy').value || title_en;
        var description_en = document.getElementById('tour-desc-en').value;
        var description_ru = document.getElementById('tour-desc-ru').value || description_en;
        var description_hy = document.getElementById('tour-desc-hy').value || description_en;
        var price = document.getElementById('tour-price').value;
        var icon = document.getElementById('tour-icon').value;
        if (!tour_key || !title_en) { alert('Fill in key and English title!'); return; }
        
        var files = document.getElementById('tour-file').files;
        var isEditing = window.editState.tours !== null;
        var updateData = {
            tour_key: tour_key, title_en: title_en, title_ru: title_ru, title_hy: title_hy,
            description_en: description_en, description_ru: description_ru, description_hy: description_hy,
            price: price, icon: icon
        };

        if (files.length > 0) {
            var images = [];
            for (let i = 0; i < files.length; i++) {
                var url = await uploadImage(files[i]);
                if (url) images.push(url);
            }
            updateData.images = images;
        }

        var error;
        if (isEditing) {
            var res = await db.from('tours').update(updateData).eq('id', window.editState.tours);
            error = res.error;
        } else {
            if (!updateData.images) updateData.images = [];
            var res = await db.from('tours').insert([updateData]);
            error = res.error;
        }

        if (error) { alert('Error: ' + error.message); return; }
        window.cancelEditTour();
        loadData('tours', renderTours);
    };

    // --- RULES (multi-lang) ---
    window.renderRules = function(data) {
        var html = '<table><tr><th>Icon</th><th>Text EN</th><th>Text RU</th><th>Text HY</th><th>Actions</th></tr>';
        data.forEach(function(item) {
            html += '<tr><td>' + item.icon + '</td><td>' + item.text_en + '</td><td>' + item.text_ru + '</td><td>' + item.text_hy + '</td>' +
                '<td style="display:flex;gap:6px;">' +
                '<button class="btn-edit" onclick="startEditRule(\'' + item.id + '\')">Edit</button>' +
                '<button class="btn-danger" onclick="deleteItem(\'rules\',\'' + item.id + '\',renderRules)">Delete</button></td></tr>';
        });
        html += '</table>';
        document.getElementById('rules-table').innerHTML = html;
    };

    window.startEditRule = function(id) {
        var item = window.currentTableData['rules'].find(function(i) { return i.id === id; });
        if (!item) return;
        window.editState.rules = id;
        document.getElementById('rule-icon').value = item.icon || '';
        document.getElementById('rule-text-en').value = item.text_en || '';
        document.getElementById('rule-text-ru').value = item.text_ru || '';
        document.getElementById('rule-text-hy').value = item.text_hy || '';
        document.getElementById('rule-submit-btn').textContent = 'Update Rule';
        document.getElementById('rule-cancel-btn').style.display = 'inline-flex';
        document.getElementById('rules-section').scrollIntoView({behavior: "smooth"});
    };

    window.cancelEditRule = function() {
        window.editState.rules = null;
        document.getElementById('rule-icon').value = '';
        document.getElementById('rule-text-en').value = '';
        document.getElementById('rule-text-ru').value = '';
        document.getElementById('rule-text-hy').value = '';
        document.getElementById('rule-submit-btn').textContent = '+ Add Rule';
        document.getElementById('rule-cancel-btn').style.display = 'none';
    };

    window.addRule = async function() {
        var icon = document.getElementById('rule-icon').value;
        var text_en = document.getElementById('rule-text-en').value;
        var text_ru = document.getElementById('rule-text-ru').value || text_en;
        var text_hy = document.getElementById('rule-text-hy').value || text_en;
        if (!text_en) { alert('Fill in English text!'); return; }
        
        var isEditing = window.editState.rules !== null;
        var updateData = { icon: icon || '', text_en: text_en, text_ru: text_ru, text_hy: text_hy };
        var error;

        if (isEditing) {
            var res = await db.from('rules').update(updateData).eq('id', window.editState.rules);
            error = res.error;
        } else {
            var res = await db.from('rules').insert([updateData]);
            error = res.error;
        }

        if (error) { alert('Error: ' + error.message); return; }
        window.cancelEditRule();
        loadData('rules', renderRules);
    };

    // --- TRANSLATIONS ---
    window.renderTranslations = function(data) {
        var html = '<table><tr><th>Key</th><th>EN</th><th>RU</th><th>HY</th><th>Actions</th></tr>';
        data.forEach(function(item) {
            html += '<tr><td><b>' + item.key + '</b></td><td>' + item.en + '</td><td>' + item.ru + '</td><td>' + item.hy + '</td>' +
                '<td style="display:flex;gap:6px;">' +
                '<button class="btn-edit" onclick="startEditTranslation(\'' + item.id + '\')">Edit</button>' +
                '<button class="btn-danger" onclick="deleteItem(\'translations\',\'' + item.id + '\',renderTranslations)">Delete</button></td></tr>';
        });
        html += '</table>';
        document.getElementById('translations-table').innerHTML = html;
    };

    window.startEditTranslation = function(id) {
        var item = window.currentTableData['translations'].find(function(i) { return i.id === id; });
        if (!item) return;
        window.editState.translations = id;
        document.getElementById('trans-key').value = item.key || '';
        document.getElementById('trans-en').value = item.en || '';
        document.getElementById('trans-ru').value = item.ru || '';
        document.getElementById('trans-hy').value = item.hy || '';
        document.getElementById('trans-submit-btn').textContent = 'Update Translation';
        document.getElementById('trans-cancel-btn').style.display = 'inline-flex';
        document.getElementById('translations-section').scrollIntoView({behavior: "smooth"});
    };

    window.cancelEditTranslation = function() {
        window.editState.translations = null;
        document.getElementById('trans-key').value = '';
        document.getElementById('trans-en').value = '';
        document.getElementById('trans-ru').value = '';
        document.getElementById('trans-hy').value = '';
        document.getElementById('trans-submit-btn').textContent = 'Save / Update';
        document.getElementById('trans-cancel-btn').style.display = 'none';
    };

    window.addTranslation = async function() {
        var key = document.getElementById('trans-key').value;
        var en = document.getElementById('trans-en').value;
        var ru = document.getElementById('trans-ru').value;
        var hy = document.getElementById('trans-hy').value;
        if (!key) { alert('Fill in the key!'); return; }
        
        var isEditing = window.editState.translations !== null;
        var updateData = { key: key, en: en, ru: ru, hy: hy };
        var error;
        
        if (isEditing) {
            var res = await db.from('translations').update(updateData).eq('id', window.editState.translations);
            error = res.error;
        } else {
            var res = await db.from('translations').upsert([updateData], { onConflict: 'key' });
            error = res.error;
        }

        if (error) { alert('Error: ' + error.message); return; }
        window.cancelEditTranslation();
        loadData('translations', renderTranslations);
    };
    // --- NOTIFICATIONS ---

    // Custom loadData override for notifications - shows both cards
    var originalLoadData = window.loadData;
    window.loadData = async function(table, renderCallback) {
        // Show/hide the recipients card together with notifications section
        var recipientsCard = document.getElementById('notifications-recipients-card');
        if (recipientsCard) recipientsCard.style.display = (table === 'notification_recipients') ? 'block' : 'none';
        var tgWorkersCard = document.getElementById('telegram-workers-card');
        if (tgWorkersCard) tgWorkersCard.style.display = (table === 'notification_recipients') ? 'block' : 'none';

        await originalLoadData(table, renderCallback);

        // Load staff password when entering notifications
        if (table === 'notification_recipients') {
            loadStaffPassword();
            loadTelegramWorkers();
        }
    };

    async function loadStaffPassword() {
        try {
            var { data } = await db.from('app_settings').select('value').eq('key', 'staff_password').single();
            var input = document.getElementById('staff-password');
            if (input && data) input.value = data.value;
        } catch (e) { console.error('Password load error:', e); }
    }

    window.saveStaffPassword = async function() {
        var pw = document.getElementById('staff-password').value.trim();
        if (!pw) { alert('Password cannot be empty!'); return; }
        var { error } = await db.from('app_settings').upsert([{ key: 'staff_password', value: pw, updated_at: new Date().toISOString() }], { onConflict: 'key' });
        if (error) { alert('Error: ' + error.message); return; }
        alert('✅ Password saved!');
    };

    window.renderNotifications = function(data) {
        // Filter to show only email recipients
        var emailData = data.filter(function(item) { return item.type === 'email'; });
        var html = '<table><tr><th>Email</th><th>Name</th><th>Status</th><th>Actions</th></tr>';
        emailData.forEach(function(item) {
            var isBlocked = !item.enabled;
            var statusColor = isBlocked ? '#f87171' : '#4ade80';
            var statusText = isBlocked ? '🔴 BLOCKED' : '🟢 ACTIVE';
            var toggleText = isBlocked ? 'Unblock' : 'Block';
            var toggleColor = isBlocked ? '#4ade80' : '#f87171';

            html += '<tr' + (isBlocked ? ' style="opacity:0.6;"' : '') + '>' +
                '<td><code>' + item.value + '</code></td>' +
                '<td>' + (item.label || '-') + '</td>' +
                '<td style="color:' + statusColor + '"><b>' + statusText + '</b></td>' +
                '<td style="display:flex;gap:6px;flex-wrap:wrap;">' +
                '<button style="background:' + toggleColor + '; color:#fff; border:none; padding:6px 12px; border-radius:6px; font-weight:600; cursor:pointer; font-size:12px;" onclick="toggleRecipient(\'' + item.id + '\',' + isBlocked + ')">' + toggleText + '</button>' +
                '<button class="btn-danger" onclick="deleteItem(\'notification_recipients\',\'' + item.id + '\',renderNotifications)">Delete</button>' +
                '</td></tr>';
        });
        html += '</table>';
        document.getElementById('notifications-table').innerHTML = html;
    };

    window.addNotificationRecipient = async function() {
        var value = document.getElementById('notif-value').value.trim();
        var label = document.getElementById('notif-label').value.trim();
        if (!value) { alert('Please enter an email address!'); return; }
        if (!value.includes('@')) { alert('Please enter a valid email address!'); return; }
        var { error } = await db.from('notification_recipients').insert([{ type: 'email', value: value, label: label, enabled: true }]);
        if (error) { alert('Error: ' + error.message); return; }
        document.getElementById('notif-value').value = '';
        document.getElementById('notif-label').value = '';
        loadData('notification_recipients', renderNotifications);
    };

    window.toggleRecipient = async function(id, shouldEnable) {
        var { error } = await db.from('notification_recipients').update({ enabled: shouldEnable }).eq('id', id);
        if (error) { alert('Error: ' + error.message); return; }
        loadData('notification_recipients', renderNotifications);
    };

    // --- TELEGRAM WORKERS ---
    async function loadTelegramWorkers() {
        try {
            var { data, error } = await db.from('notification_recipients').select('*').eq('type', 'telegram');
            if (error) { console.error('TG workers load error:', error); return; }
            renderTelegramWorkers(data || []);
        } catch (e) { console.error('TG workers error:', e); }
    }

    function renderTelegramWorkers(data) {
        var container = document.getElementById('telegram-workers-table');
        if (!container) return;
        if (data.length === 0) {
            container.innerHTML = '<p style="color:#71767b; padding:16px; text-align:center;">No workers registered yet. Staff can register via the Telegram bot.</p>';
            return;
        }
        var html = '<table><tr><th>Name</th><th>Username</th><th>Chat ID</th><th>Status</th><th>Actions</th></tr>';
        data.forEach(function(item) {
            var isBlocked = !item.enabled;
            var statusColor = isBlocked ? '#f87171' : '#4ade80';
            var statusText = isBlocked ? '🔴 BLOCKED' : '🟢 ACTIVE';
            var toggleText = isBlocked ? 'Unblock' : 'Block';
            var toggleColor = isBlocked ? '#4ade80' : '#f87171';
            var usernameDisplay = item.username ? '<a href="https://t.me/' + item.username + '" target="_blank" style="color:#4ade80; text-decoration:none;">@' + item.username + '</a>' : '-';

            html += '<tr' + (isBlocked ? ' style="opacity:0.6;"' : '') + '>' +
                '<td><b>' + (item.label || '-') + '</b></td>' +
                '<td>' + usernameDisplay + '</td>' +
                '<td><code>' + item.value + '</code></td>' +
                '<td style="color:' + statusColor + '"><b>' + statusText + '</b></td>' +
                '<td style="display:flex;gap:6px;flex-wrap:wrap;">' +
                '<button style="background:' + toggleColor + '; color:#fff; border:none; padding:6px 12px; border-radius:6px; font-weight:600; cursor:pointer; font-size:12px;" onclick="toggleTgWorker(\'' + item.id + '\',' + isBlocked + ')">' + toggleText + '</button>' +
                '<button class="btn-danger" onclick="deleteTgWorker(\'' + item.id + '\')">' + 'Delete' + '</button>' +
                '</td></tr>';
        });
        html += '</table>';
        container.innerHTML = html;
    }

    window.toggleTgWorker = async function(id, shouldEnable) {
        var { error } = await db.from('notification_recipients').update({ enabled: shouldEnable }).eq('id', id);
        if (error) { alert('Error: ' + error.message); return; }
        loadTelegramWorkers();
        loadData('notification_recipients', renderNotifications);
    };

    window.deleteTgWorker = async function(id) {
        if (!confirm('Remove this worker? They will need to re-register via the Telegram bot.')) return;
        var { error } = await db.from('notification_recipients').delete().eq('id', id);
        if (error) { alert('Delete error: ' + error.message); return; }
        loadTelegramWorkers();
        loadData('notification_recipients', renderNotifications);
    };

    // --- HOUSEKEEPING REQUESTS ---
    window.renderHousekeeping = function(data) {
        var html = '<table><tr><th>Room</th><th>Code</th><th>Status</th><th>Requested</th><th>Completed</th><th>Actions</th></tr>';
        data.forEach(function(item) {
            var currentStatus = (item.status || 'pending').toLowerCase();
            var color = (currentStatus === 'completed' || currentStatus === 'accepted') ? 'green' : 'orange';
            var actionBtn = currentStatus !== 'completed' 
                ? '<button style="background:#22c55e; color:#fff; border:none; padding:4px 8px; border-radius:4px; font-weight:bold; cursor:pointer;" onclick="completeHousekeeping(\'' + item.id + '\')">Complete ✓</button>' 
                : '<span style="color:#22c55e; font-weight:bold;">COMPLETED</span>';
                
            html += '<tr><td><b>' + item.room_number + '</b></td><td><code>' + item.code + '</code></td>' +
                '<td style="color:' + color + '"><b>' + currentStatus.toUpperCase() + '</b></td>' +
                '<td>' + (item.created_at ? new Date(item.created_at).toLocaleString() : '-') + '</td>' +
                '<td>' + (item.completed_at ? new Date(item.completed_at).toLocaleString() : '-') + '</td>' +
                '<td>' + actionBtn + '</td></tr>';
        });
        html += '</table>';
        document.getElementById('hk-table').innerHTML = html;
    };

    window.completeHousekeeping = async function(id) {
        var { error } = await db.from('housekeeping_requests').update({ 
            status: 'completed', 
            completed_at: new Date().toISOString() 
        }).eq('id', id);
        if (error) { alert('Error updating status: ' + error.message); return; }
        loadData('housekeeping_requests', renderHousekeeping);
    };

    // --- HOUSEKEEPING RATINGS ---
    window.renderRatings = function(data) {
        var html = '';
        var sum = 0;
        data.forEach(function(item) { sum += item.rating; });
        var avg = data.length > 0 ? (sum / data.length).toFixed(1) : '0';
        html += '<h4>Average Rating: ' + avg + '/5 (' + data.length + ' reviews)</h4>';
        html += '<table><tr><th>Code</th><th>Rating</th><th>Comment</th><th>Time</th></tr>';
        data.forEach(function(item) {
            var stars = '';
            for (var i = 0; i < item.rating; i++) stars += '&#11088;';
            html += '<tr><td><code>' + item.code + '</code></td><td>' + stars + '</td><td>' + (item.comment || '-') + '</td>' +
                '<td>' + (item.created_at ? new Date(item.created_at).toLocaleString() : '-') + '</td></tr>';
        });
        html += '</table>';
        document.getElementById('ratings-table').innerHTML = html;
    };

    // --- BOOKINGS ---
    window.currentBookingFilter = 'all';

    window.filterBookings = function(status) {
        window.currentBookingFilter = status;
        if (window.currentTableData['bookings']) {
            renderBookings(window.currentTableData['bookings']);
        }
    };

    window.renderBookings = function(data) {
        var filteredData = data;
        if (window.currentBookingFilter !== 'all') {
            filteredData = data.filter(function(b) { return b.status === window.currentBookingFilter; });
        }

        var html = '<table><tr><th>Date/Time</th><th>Service ID</th><th>Guest</th><th>Room</th><th>Date Selected</th><th>Status</th><th>Actions</th></tr>';
        filteredData.forEach(function(item) {
            var rowColor = '';
            if (item.status === 'approved') rowColor = 'style="background: rgba(74, 222, 128, 0.05);"';
            if (item.status === 'rejected') rowColor = 'style="background: rgba(248, 113, 113, 0.05);"';

            var actions = '';
            if (item.status === 'pending') {
                actions = '<button onclick="approveBooking(\'' + item.id + '\')" style="background:#4ade80; color:#000; padding:6px; border:none; border-radius:4px; margin-right:4px;">Approve</button>' +
                          '<button onclick="rejectBooking(\'' + item.id + '\')" style="background:#f87171; color:#fff; padding:6px; border:none; border-radius:4px;">Reject</button>';
            } else if (item.status === 'rejected') {
                actions = '<span style="color:#f87171; font-size:12px;">' + (item.reject_reason || 'Rejected') + '</span>';
            }

            var serviceDisplay = item.service_id.substring(0,8) + '...'; // Basic display

            html += '<tr ' + rowColor + '>' +
                '<td>' + new Date(item.created_at).toLocaleString() + '</td>' +
                '<td title="' + item.service_id + '">' + serviceDisplay + '</td>' +
                '<td>' + item.guest_name + '</td>' +
                '<td>' + item.room_number + '</td>' +
                '<td>' + (item.date || '-') + '</td>' +
                '<td><b>' + item.status.toUpperCase() + '</b></td>' +
                '<td>' + actions + '</td></tr>';
        });
        html += '</table>';
        var container = document.getElementById('bookings-table-container');
        if (container) container.innerHTML = html;
    };

    window.approveBooking = async function(id) {
        if (!confirm('Approve this booking?')) return;
        var { error } = await db.from('bookings').update({ status: 'approved' }).eq('id', id);
        if (error) alert('Error: ' + error.message);
        else loadData('bookings', renderBookings);
    };

    window.rejectBooking = async function(id) {
        var reason = prompt('Enter rejection reason:');
        if (reason === null) return; // cancelled
        var { error } = await db.from('bookings').update({ status: 'rejected', reject_reason: reason }).eq('id', id);
        if (error) alert('Error: ' + error.message);
        else loadData('bookings', renderBookings);
    };

    // --- DELETE ---
    function getFilePathFromUrl(url) {
        if (!url || typeof url !== 'string') return null;
        var splitStr = '/public/images/';
        if (url.includes(splitStr)) {
            var path = url.split(splitStr)[1];
            if (path.includes('?')) path = path.split('?')[0];
            return path;
        }
        return null;
    }

    window.deleteItem = async function(table, id, renderCallback) {
        if (!confirm('Delete this item? (Associated images will also be removed from storage)')) return;
        
        // 1. Fetch item to see if it has images
        try {
            var { data: itemData } = await db.from(table).select('*').eq('id', id).single();
            if (itemData) {
                var pathsToDelete = [];
                // Minibar uses image_url
                if (itemData.image_url) {
                    var path = getFilePathFromUrl(itemData.image_url);
                    if (path) pathsToDelete.push(path);
                }
                // Services/Tours use images array
                if (itemData.images) {
                    var imgs = itemData.images;
                    if (typeof imgs === 'string') {
                        try { imgs = JSON.parse(imgs); } catch(e) { imgs = []; }
                    }
                    if (Array.isArray(imgs)) {
                        imgs.forEach(function(url) {
                            var p = getFilePathFromUrl(url);
                            if (p) pathsToDelete.push(p);
                        });
                    }
                }
                // 2. Delete files from storage
                if (pathsToDelete.length > 0) {
                    var { error: storageError } = await db.storage.from('images').remove(pathsToDelete);
                    if (storageError) console.error('Storage deletion error:', storageError);
                }
            }
        } catch (e) {
            console.error('Error fetching item for image deletion:', e);
        }

        // 3. Delete row from database
        var { error } = await db.from(table).delete().eq('id', id);
        if (error) { alert('Delete error: ' + error.message); return; }
        
        loadData(table, renderCallback);
    };

})();
