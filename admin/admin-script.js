(function() {
    const ADM_URL = 'https://klnxybjaaxtlfabnzxcd.supabase.co';
    const ADM_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtsbnh5YmphYXh0bGZhYm56eGNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NjA2MjksImV4cCI6MjA4OTQzNjYyOX0.uUAxzL-8nBkgqoYkQg74Ych0BzKFBVcN_IJlqoZ8tQM';
    const db = window.supabase.createClient(ADM_URL, ADM_KEY);

    // --- IMAGE UPLOAD ---
    async function uploadImage(file) {
        if (!file) return null;
        const ext = file.name.split('.').pop();
        const path = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await db.storage.from('images').upload(path, file);
        if (error) { console.error('Upload Error:', error); alert('Upload failed: ' + error.message); return null; }
        const { data } = db.storage.from('images').getPublicUrl(path);
        return data.publicUrl;
    }

    // --- AUTH ---
    window.login = async function() {
        const email = document.getElementById('email').value;
        const pass = document.getElementById('password').value;
        const { error } = await db.auth.signInWithPassword({ email, password: pass });
        if (error) { alert('Login Failed: ' + error.message); return; }
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        loadData('minibar_items', renderMinibar);
    };

    window.logout = async function() {
        await db.auth.signOut();
        location.reload();
    };

    // Auto-login if session exists
    db.auth.getSession().then(({ data: { session } }) => {
        if (session) {
            document.getElementById('login-screen').style.display = 'none';
            document.getElementById('dashboard').style.display = 'block';
            loadData('minibar_items', renderMinibar);
        }
    });

    // --- DATA LOADING (crash-proof) ---
    const sectionMap = {
        'minibar_items': 'minibar-section',
        'services': 'services-section',
        'tours': 'tours-section',
        'rules': 'rules-section',
        'translations': 'translations-section',
        'housekeeping_requests': 'housekeeping-section',
        'housekeeping_ratings': 'ratings-section'
    };

    window.loadData = async function(table, renderCallback) {
        // Hide all sections
        Object.values(sectionMap).forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });
        // Show current
        const sectionId = sectionMap[table];
        if (sectionId) {
            const el = document.getElementById(sectionId);
            if (el) el.style.display = 'block';
        }

        try {
            const { data, error } = await db.from(table).select('*');
            if (error) { console.error('Load error:', error); renderCallback([]); return; }
            renderCallback(data || []);
        } catch (e) {
            console.error('Fatal load error:', e);
            renderCallback([]);
        }
    };

    // --- MINIBAR ---
    window.renderMinibar = function(data) {
        let html = '<table><tr><th>Image</th><th>Name</th><th>Price</th><th>Actions</th></tr>';
        data.forEach(item => {
            html += `<tr>
                <td><img src="${item.image_url}" width="50" onerror="this.src='https://placehold.co/50x50?text=No+Image'"></td>
                <td>${item.name}</td><td>${item.price} AMD</td>
                <td><button style="background:red;" onclick="deleteItem('minibar_items','${item.id}',renderMinibar)">Delete</button></td>
            </tr>`;
        });
        html += '</table>';
        document.getElementById('minibar-table').innerHTML = html;
    };

    window.addMinibarItem = async function() {
        const name = document.getElementById('mb-name').value;
        const price = document.getElementById('mb-price').value;
        if (!name || !price) { alert('Fill in name and price!'); return; }
        
        const file = document.getElementById('mb-file').files[0];
        let imageUrl = '';
        if (file) {
            imageUrl = await uploadImage(file);
            if (!imageUrl) return;
        }
        
        const { error } = await db.from('minibar_items').insert([{ name, price: parseInt(price), image_url: imageUrl }]);
        if (error) { alert('Error: ' + error.message); return; }
        document.getElementById('mb-name').value = '';
        document.getElementById('mb-price').value = '';
        document.getElementById('mb-file').value = '';
        loadData('minibar_items', renderMinibar);
    };

    // --- SERVICES ---
    window.renderServices = function(data) {
        let html = '<table><tr><th>Icon</th><th>Key</th><th>Title</th><th>Type</th><th>Actions</th></tr>';
        data.forEach(item => {
            html += `<tr><td>${item.icon}</td><td>${item.service_key}</td><td>${item.title}</td><td>${item.status_type}</td>
            <td><button style="background:red;" onclick="deleteItem('services','${item.id}',renderServices)">Delete</button></td></tr>`;
        });
        html += '</table>';
        document.getElementById('services-table').innerHTML = html;
    };

    window.addService = async function() {
        const service_key = document.getElementById('svc-key').value;
        const title = document.getElementById('svc-title').value;
        const description = document.getElementById('svc-desc').value;
        const status_type = document.getElementById('svc-type').value;
        const icon = document.getElementById('svc-icon').value;
        if (!service_key || !title) { alert('Fill in key and title!'); return; }

        const file = document.getElementById('svc-file').files[0];
        let images = [];
        if (file) {
            const url = await uploadImage(file);
            if (url) images = [url];
        }

        const { error } = await db.from('services').insert([{ service_key, title, description, status_type, icon, images }]);
        if (error) { alert('Error: ' + error.message); return; }
        loadData('services', renderServices);
    };

    // --- TOURS ---
    window.renderTours = function(data) {
        let html = '<table><tr><th>Icon</th><th>Key</th><th>Title</th><th>Price</th><th>Actions</th></tr>';
        data.forEach(item => {
            html += `<tr><td>${item.icon}</td><td>${item.tour_key}</td><td>${item.title}</td><td>${item.price}</td>
            <td><button style="background:red;" onclick="deleteItem('tours','${item.id}',renderTours)">Delete</button></td></tr>`;
        });
        html += '</table>';
        document.getElementById('tours-table').innerHTML = html;
    };

    window.addTour = async function() {
        const tour_key = document.getElementById('tour-key').value;
        const title = document.getElementById('tour-title').value;
        const description = document.getElementById('tour-desc').value;
        const price = document.getElementById('tour-price').value;
        const icon = document.getElementById('tour-icon').value;
        if (!tour_key || !title) { alert('Fill in key and title!'); return; }

        const file = document.getElementById('tour-file').files[0];
        let images = [];
        if (file) {
            const url = await uploadImage(file);
            if (url) images = [url];
        }

        const { error } = await db.from('tours').insert([{ tour_key, title, description, price, icon, images }]);
        if (error) { alert('Error: ' + error.message); return; }
        loadData('tours', renderTours);
    };

    // --- RULES ---
    window.renderRules = function(data) {
        let html = '<table><tr><th>Icon</th><th>Text</th><th>Actions</th></tr>';
        data.forEach(item => {
            html += `<tr><td>${item.icon}</td><td>${item.text}</td>
            <td><button style="background:red;" onclick="deleteItem('rules','${item.id}',renderRules)">Delete</button></td></tr>`;
        });
        html += '</table>';
        document.getElementById('rules-table').innerHTML = html;
    };

    window.addRule = async function() {
        const icon = document.getElementById('rule-icon').value;
        const text = document.getElementById('rule-text').value;
        if (!text) { alert('Fill in text!'); return; }
        const { error } = await db.from('rules').insert([{ icon: icon || '📋', text }]);
        if (error) { alert('Error: ' + error.message); return; }
        loadData('rules', renderRules);
    };

    // --- TRANSLATIONS ---
    window.renderTranslations = function(data) {
        let html = '<table><tr><th>Key</th><th>EN</th><th>RU</th><th>HY</th><th>Actions</th></tr>';
        data.forEach(item => {
            html += `<tr><td><b>${item.key}</b></td><td>${item.en}</td><td>${item.ru}</td><td>${item.hy}</td>
            <td><button style="background:red;" onclick="deleteItem('translations','${item.id}',renderTranslations)">Delete</button></td></tr>`;
        });
        html += '</table>';
        document.getElementById('translations-table').innerHTML = html;
    };

    window.addTranslation = async function() {
        const key = document.getElementById('trans-key').value;
        const en = document.getElementById('trans-en').value;
        const ru = document.getElementById('trans-ru').value;
        const hy = document.getElementById('trans-hy').value;
        if (!key) { alert('Fill in the key!'); return; }
        const { error } = await db.from('translations').upsert([{ key, en, ru, hy }], { onConflict: 'key' });
        if (error) { alert('Error: ' + error.message); return; }
        document.getElementById('trans-key').value = '';
        document.getElementById('trans-en').value = '';
        document.getElementById('trans-ru').value = '';
        document.getElementById('trans-hy').value = '';
        loadData('translations', renderTranslations);
    };

    // --- HOUSEKEEPING & RATINGS ---
    window.renderHousekeeping = function(data) {
        let html = '<table><tr><th>Room</th><th>Status</th><th>Time</th></tr>';
        data.forEach(item => {
            const color = item.status === 'accepted' ? 'green' : 'orange';
            html += `<tr><td>${item.room_number}</td>
            <td style="color:${color}"><b>${(item.status || 'pending').toUpperCase()}</b></td>
            <td>${item.created_at ? new Date(item.created_at).toLocaleString() : '-'}</td></tr>`;
        });
        html += '</table>';
        document.getElementById('hk-table').innerHTML = html;
    };

    window.renderRatings = function(data) {
        let html = '';
        let sum = 0;
        data.forEach(item => { sum += item.rating; });
        const avg = data.length > 0 ? (sum / data.length).toFixed(1) : '0';
        html += `<h4>Average: ⭐ ${avg} (${data.length} reviews)</h4>`;
        html += '<table><tr><th>Rating</th><th>Comment</th><th>Time</th></tr>';
        data.forEach(item => {
            html += `<tr><td>${'⭐'.repeat(item.rating)}</td><td>${item.comment || '-'}</td>
            <td>${item.created_at ? new Date(item.created_at).toLocaleString() : '-'}</td></tr>`;
        });
        html += '</table>';
        document.getElementById('ratings-table').innerHTML = html;
    };

    // --- DELETE ---
    window.deleteItem = async function(table, id, renderCallback) {
        if (!confirm('Delete this item?')) return;
        const { error } = await db.from(table).delete().eq('id', id);
        if (error) { alert('Delete error: ' + error.message); return; }
        loadData(table, renderCallback);
    };

    // --- REALTIME ---
    db.auth.onAuthStateChange((event) => {
        if (event === 'SIGNED_IN') {
            db.channel('admin_realtime')
                .on('postgres_changes', { event: '*', schema: 'public' }, () => {
                    if (document.getElementById('housekeeping-section')?.style.display === 'block') loadData('housekeeping_requests', renderHousekeeping);
                    if (document.getElementById('ratings-section')?.style.display === 'block') loadData('housekeeping_ratings', renderRatings);
                })
                .subscribe();
        }
    });

})();
