(function() {
    const ADM_SUPABASE_URL = 'https://klnxybjaaxtlfabnzxcd.supabase.co';
    const ADM_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtsbnh5YmphYXh0bGZhYm56eGNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NjA2MjksImV4cCI6MjA4OTQzNjYyOX0.uUAxzL-8nBkgqoYkQg74Ych0BzKFBVcN_IJlqoZ8tQM';
    const supabaseClient = window.supabase.createClient(ADM_SUPABASE_URL, ADM_SUPABASE_KEY);

    // --- HELPERS ---
    async function uploadImage(file) {
        if (!file) return null;
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { data, error } = await supabaseClient.storage
            .from('images')
            .upload(filePath, file);

        if (error) {
            console.error('Upload Error:', error);
            return null;
        }

        const { data: { publicUrl } } = supabaseClient.storage
            .from('images')
            .getPublicUrl(filePath);

        return publicUrl;
    }

    // --- AUTH ---
    window.login = async function() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) { alert('Login Failed: ' + error.message); } 
        else { 
            document.getElementById('login-screen').style.display = 'none';
            document.getElementById('dashboard').style.display = 'block';
            loadData('minibar_items', renderMinibar);
        }
    };

    window.logout = async function() {
        await supabaseClient.auth.signOut();
        location.reload();
    };

    supabaseClient.auth.getSession().then(({ data: { session } }) => {
        if (session) {
            document.getElementById('login-screen').style.display = 'none';
            document.getElementById('dashboard').style.display = 'block';
            loadData('minibar_items', renderMinibar);
        }
    });

    // --- DATA LOADING ---
    window.loadData = async function(table, renderCallback) {
        const sections = ['minibar-section', 'services-section', 'tours-section', 'rules-section', 'translations-section', 'housekeeping-section', 'ratings-section'];
        sections.forEach(id => document.getElementById(id).style.display = 'none');

        const tableToId = {
            'minibar_items': 'minibar-section',
            'services': 'services-section',
            'tours': 'tours-section',
            'rules': 'rules-section',
            'translations': 'translations-section',
            'housekeeping_requests': 'housekeeping-section',
            'housekeeping_ratings': 'ratings-section'
        };

        if(tableToId[table]) document.getElementById(tableToId[table]).style.display = 'block';

        const { data, error } = await supabaseClient.from(table).select('*').order('created_at', { ascending: false });
        if (error) console.error(error);
        renderCallback(data || []);
    };

    // --- MINIBAR ---
    window.renderMinibar = function(data) {
        let html = `<table><tr><th>Image</th><th>Name</th><th>Price</th><th>Actions</th></tr>`;
        data.forEach(item => {
            html += `<tr>
                <td><img src="${item.image_url}" width="50"></td>
                <td>${item.name}</td><td>${item.price}</td>
                <td><button style="background:red;" onclick="deleteItem('minibar_items', '${item.id}', renderMinibar)">Delete</button></td>
            </tr>`;
        });
        html += `</table>`;
        document.getElementById('minibar-table').innerHTML = html;
    };

    window.addMinibarItem = async function() {
        const name = document.getElementById('mb-name').value;
        const price = document.getElementById('mb-price').value;
        const file = document.getElementById('mb-file').files[0];
        
        const imageUrl = await uploadImage(file);
        if(!imageUrl) { alert('Image upload failed!'); return; }

        await supabaseClient.from('minibar_items').insert([{ name, price: parseInt(price), image_url: imageUrl }]);
        loadData('minibar_items', renderMinibar);
    };

    // --- SERVICES ---
    window.renderServices = function(data) {
        let html = `<table><tr><th>Icon</th><th>Title</th><th>Type</th><th>Actions</th></tr>`;
        data.forEach(item => {
            html += `<tr><td>${item.icon}</td><td>${item.title}</td><td>${item.status_type}</td>
            <td><button style="background:red;" onclick="deleteItem('services', '${item.id}', renderServices)">Delete</button></td></tr>`;
        });
        html += `</table>`;
        document.getElementById('services-table').innerHTML = html;
    };

    window.addService = async function() {
        const service_key = document.getElementById('svc-key').value;
        const title = document.getElementById('svc-title').value;
        const description = document.getElementById('svc-desc').value;
        const status_type = document.getElementById('svc-type').value;
        const icon = document.getElementById('svc-icon').value;
        const file = document.getElementById('svc-file').files[0];

        let imageUrl = await uploadImage(file);
        const images = imageUrl ? [imageUrl] : [];

        await supabaseClient.from('services').insert([{ service_key, title, description, status_type, icon, images }]);
        loadData('services', renderServices);
    };

    // --- TOURS ---
    window.renderTours = function(data) {
        let html = `<table><tr><th>Title</th><th>Price</th><th>Actions</th></tr>`;
        data.forEach(item => {
            html += `<tr><td>${item.title}</td><td>${item.price}</td>
            <td><button style="background:red;" onclick="deleteItem('tours', '${item.id}', renderTours)">Delete</button></td></tr>`;
        });
        html += `</table>`;
        document.getElementById('tours-table').innerHTML = html;
    };

    window.addTour = async function() {
        const tour_key = document.getElementById('tour-key').value;
        const title = document.getElementById('tour-title').value;
        const description = document.getElementById('tour-desc').value;
        const price = document.getElementById('tour-price').value;
        const icon = document.getElementById('tour-icon').value;
        const file = document.getElementById('tour-file').files[0];

        let imageUrl = await uploadImage(file);
        const images = imageUrl ? [imageUrl] : [];

        await supabaseClient.from('tours').insert([{ tour_key, title, description, price, icon, images }]);
        loadData('tours', renderTours);
    };

    // --- RULES ---
    window.renderRules = function(data) {
        let html = `<table><tr><th>Icon</th><th>Text</th><th>Actions</th></tr>`;
        data.forEach(item => {
            html += `<tr><td>${item.icon}</td><td>${item.text}</td>
            <td><button style="background:red;" onclick="deleteItem('rules', '${item.id}', renderRules)">Delete</button></td></tr>`;
        });
        html += `</table>`;
        document.getElementById('rules-table').innerHTML = html;
    };

    window.addRule = async function() {
        const icon = document.getElementById('rule-icon').value;
        const text = document.getElementById('rule-text').value;
        await supabaseClient.from('rules').insert([{ icon, text }]);
        loadData('rules', renderRules);
    };

    // --- TRANSLATIONS ---
    window.renderTranslations = function(data) {
        let html = `<table><tr><th>Key</th><th>EN</th><th>RU</th><th>HY</th><th>Actions</th></tr>`;
        data.forEach(item => {
            html += `<tr><td>${item.key}</td><td>${item.en}</td><td>${item.ru}</td><td>${item.hy}</td>
            <td><button style="background:red;" onclick="deleteItem('translations', '${item.id}', renderTranslations)">Delete</button></td></tr>`;
        });
        html += `</table>`;
        document.getElementById('translations-table').innerHTML = html;
    };

    window.addTranslation = async function() {
        const key = document.getElementById('trans-key').value;
        const en = document.getElementById('trans-en').value;
        const ru = document.getElementById('trans-ru').value;
        const hy = document.getElementById('trans-hy').value;

        // Use upsert so updating same key works
        await supabaseClient.from('translations').upsert([{ key, en, ru, hy }], { onConflict: 'key' });
        loadData('translations', renderTranslations);
    };

    // --- HOUSEKEEPING & RATINGS ---
    window.renderHousekeeping = function(data) {
        let html = `<table><tr><th>Room</th><th>Status</th><th>Time</th></tr>`;
        data.forEach(item => {
            html += `<tr><td>${item.room_number}</td>
            <td style="color:${item.status === 'accepted' ? 'green' : 'orange'}"><b>${item.status.toUpperCase()}</b></td>
            <td>${new Date(item.created_at).toLocaleString()}</td></tr>`;
        });
        html += `</table>`;
        document.getElementById('hk-table').innerHTML = html;
    };

    window.renderRatings = function(data) {
        let html = `<table><tr><th>Rating</th><th>Comment</th><th>Time</th></tr>`;
        data.forEach(item => {
            html += `<tr><td>${'⭐'.repeat(item.rating)}</td><td>${item.comment || '-'}</td><td>${new Date(item.created_at).toLocaleString()}</td></tr>`;
        });
        html += `</table>`;
        document.getElementById('ratings-table').innerHTML = html;
    };

    // --- GLOBAL ---
    window.deleteItem = async function(table, id, renderCallback) {
        await supabaseClient.from(table).delete().eq('id', id);
        loadData(table, renderCallback);
    };

    // Real-time
    function initRealtime() {
        supabaseClient.channel('admin_all')
            .on('postgres_changes', { event: '*', schema: 'public' }, () => {
                // Refresh whatever is visible
                const currentTable = document.querySelector('.sidebar a.active')?.dataset.table; 
                // Simple logic: if housekeeping or ratings are open, refresh them
                if (document.getElementById('housekeeping-section').style.display === 'block') loadData('housekeeping_requests', renderHousekeeping);
                if (document.getElementById('ratings-section').style.display === 'block') loadData('housekeeping_ratings', renderRatings);
            })
            .subscribe();
    }

    supabaseClient.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN') initRealtime();
    });

})();
