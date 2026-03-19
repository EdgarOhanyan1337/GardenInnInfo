(function() {
    var ADM_URL = 'https://klnxybjaaxtlfabnzxcd.supabase.co';
    var ADM_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtsbnh5YmphYXh0bGZhYm56eGNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NjA2MjksImV4cCI6MjA4OTQzNjYyOX0.uUAxzL-8nBkgqoYkQg74Ych0BzKFBVcN_IJlqoZ8tQM';
    var db = window.supabase.createClient(ADM_URL, ADM_KEY);

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
        'housekeeping_requests': 'housekeeping-section',
        'housekeeping_ratings': 'ratings-section'
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
            var { data, error } = await db.from(table).select('*');
            if (error) { console.error('Load error:', error); renderCallback([]); return; }
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
                '<td><button class="btn-danger" onclick="deleteItem(\'minibar_items\',\'' + item.id + '\',renderMinibar)">Delete</button></td></tr>';
        });
        html += '</table>';
        document.getElementById('minibar-table').innerHTML = html;
    };

    window.addMinibarItem = async function() {
        var name = document.getElementById('mb-name').value;
        var price = document.getElementById('mb-price').value;
        if (!name || !price) { alert('Fill in name and price!'); return; }
        var file = document.getElementById('mb-file').files[0];
        var imageUrl = '';
        if (file) { imageUrl = await uploadImage(file); if (!imageUrl) return; }
        var { error } = await db.from('minibar_items').insert([{ name: name, price: parseInt(price), image_url: imageUrl }]);
        if (error) { alert('Error: ' + error.message); return; }
        document.getElementById('mb-name').value = '';
        document.getElementById('mb-price').value = '';
        document.getElementById('mb-file').value = '';
        loadData('minibar_items', renderMinibar);
    };

    // --- SERVICES (multi-lang) ---
    window.renderServices = function(data) {
        var html = '<table><tr><th>Icon</th><th>Key</th><th>Title EN</th><th>Title RU</th><th>Title HY</th><th>Type</th><th>Actions</th></tr>';
        data.forEach(function(item) {
            html += '<tr><td>' + item.icon + '</td><td>' + item.service_key + '</td>' +
                '<td>' + item.title_en + '</td><td>' + item.title_ru + '</td><td>' + item.title_hy + '</td>' +
                '<td>' + item.status_type + '</td>' +
                '<td><button class="btn-danger" onclick="deleteItem(\'services\',\'' + item.id + '\',renderServices)">Delete</button></td></tr>';
        });
        html += '</table>';
        document.getElementById('services-table').innerHTML = html;
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
        var icon = document.getElementById('svc-icon').value;
        if (!service_key || !title_en) { alert('Fill in key and English title!'); return; }
        var file = document.getElementById('svc-file').files[0];
        var images = [];
        if (file) { var url = await uploadImage(file); if (url) images = [url]; }
        var { error } = await db.from('services').insert([{
            service_key: service_key, title_en: title_en, title_ru: title_ru, title_hy: title_hy,
            description_en: description_en, description_ru: description_ru, description_hy: description_hy,
            status_type: status_type, icon: icon, images: images
        }]);
        if (error) { alert('Error: ' + error.message); return; }
        loadData('services', renderServices);
    };

    // --- TOURS (multi-lang) ---
    window.renderTours = function(data) {
        var html = '<table><tr><th>Icon</th><th>Key</th><th>Title EN</th><th>Title RU</th><th>Title HY</th><th>Price</th><th>Actions</th></tr>';
        data.forEach(function(item) {
            html += '<tr><td>' + item.icon + '</td><td>' + item.tour_key + '</td>' +
                '<td>' + item.title_en + '</td><td>' + item.title_ru + '</td><td>' + item.title_hy + '</td>' +
                '<td>' + item.price + '</td>' +
                '<td><button class="btn-danger" onclick="deleteItem(\'tours\',\'' + item.id + '\',renderTours)">Delete</button></td></tr>';
        });
        html += '</table>';
        document.getElementById('tours-table').innerHTML = html;
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
        var file = document.getElementById('tour-file').files[0];
        var images = [];
        if (file) { var url = await uploadImage(file); if (url) images = [url]; }
        var { error } = await db.from('tours').insert([{
            tour_key: tour_key, title_en: title_en, title_ru: title_ru, title_hy: title_hy,
            description_en: description_en, description_ru: description_ru, description_hy: description_hy,
            price: price, icon: icon, images: images
        }]);
        if (error) { alert('Error: ' + error.message); return; }
        loadData('tours', renderTours);
    };

    // --- RULES (multi-lang) ---
    window.renderRules = function(data) {
        var html = '<table><tr><th>Icon</th><th>Text EN</th><th>Text RU</th><th>Text HY</th><th>Actions</th></tr>';
        data.forEach(function(item) {
            html += '<tr><td>' + item.icon + '</td><td>' + item.text_en + '</td><td>' + item.text_ru + '</td><td>' + item.text_hy + '</td>' +
                '<td><button class="btn-danger" onclick="deleteItem(\'rules\',\'' + item.id + '\',renderRules)">Delete</button></td></tr>';
        });
        html += '</table>';
        document.getElementById('rules-table').innerHTML = html;
    };

    window.addRule = async function() {
        var icon = document.getElementById('rule-icon').value;
        var text_en = document.getElementById('rule-text-en').value;
        var text_ru = document.getElementById('rule-text-ru').value || text_en;
        var text_hy = document.getElementById('rule-text-hy').value || text_en;
        if (!text_en) { alert('Fill in English text!'); return; }
        var { error } = await db.from('rules').insert([{ icon: icon || '', text_en: text_en, text_ru: text_ru, text_hy: text_hy }]);
        if (error) { alert('Error: ' + error.message); return; }
        loadData('rules', renderRules);
    };

    // --- TRANSLATIONS ---
    window.renderTranslations = function(data) {
        var html = '<table><tr><th>Key</th><th>EN</th><th>RU</th><th>HY</th><th>Actions</th></tr>';
        data.forEach(function(item) {
            html += '<tr><td><b>' + item.key + '</b></td><td>' + item.en + '</td><td>' + item.ru + '</td><td>' + item.hy + '</td>' +
                '<td><button class="btn-danger" onclick="deleteItem(\'translations\',\'' + item.id + '\',renderTranslations)">Delete</button></td></tr>';
        });
        html += '</table>';
        document.getElementById('translations-table').innerHTML = html;
    };

    window.addTranslation = async function() {
        var key = document.getElementById('trans-key').value;
        var en = document.getElementById('trans-en').value;
        var ru = document.getElementById('trans-ru').value;
        var hy = document.getElementById('trans-hy').value;
        if (!key) { alert('Fill in the key!'); return; }
        var { error } = await db.from('translations').upsert([{ key: key, en: en, ru: ru, hy: hy }], { onConflict: 'key' });
        if (error) { alert('Error: ' + error.message); return; }
        document.getElementById('trans-key').value = '';
        document.getElementById('trans-en').value = '';
        document.getElementById('trans-ru').value = '';
        document.getElementById('trans-hy').value = '';
        loadData('translations', renderTranslations);
    };

    // --- HOUSEKEEPING REQUESTS ---
    window.renderHousekeeping = function(data) {
        var html = '<table><tr><th>Room</th><th>Code</th><th>Status</th><th>Time</th></tr>';
        data.forEach(function(item) {
            var color = item.status === 'accepted' ? 'green' : 'orange';
            html += '<tr><td><b>' + item.room_number + '</b></td><td><code>' + item.code + '</code></td>' +
                '<td style="color:' + color + '"><b>' + (item.status || 'pending').toUpperCase() + '</b></td>' +
                '<td>' + (item.created_at ? new Date(item.created_at).toLocaleString() : '-') + '</td></tr>';
        });
        html += '</table>';
        document.getElementById('hk-table').innerHTML = html;
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

    // --- DELETE ---
    window.deleteItem = async function(table, id, renderCallback) {
        if (!confirm('Delete this item?')) return;
        var { error } = await db.from(table).delete().eq('id', id);
        if (error) { alert('Delete error: ' + error.message); return; }
        loadData(table, renderCallback);
    };

})();
