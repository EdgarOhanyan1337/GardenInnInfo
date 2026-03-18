(function() {
    const ADM_SUPABASE_URL = 'https://klnxybjaaxtlfabnzxcd.supabase.co';
    const ADM_SUPABASE_KEY = 'sb_secret_CS9wfE_qUfL3MrR2xzrTAQ_kf-z1ciE';
    const supabaseClient = window.supabase.createClient(ADM_SUPABASE_URL, ADM_SUPABASE_KEY);

    // Make functions global for HTML attributes
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

    // Check session on load
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
        if (session) {
            document.getElementById('login-screen').style.display = 'none';
            document.getElementById('dashboard').style.display = 'block';
            loadData('minibar_items', renderMinibar);
        }
    });

    // Load Data dynamically
    window.loadData = async function(table, renderCallback) {
        document.getElementById('minibar-section').style.display = 'none';
        document.getElementById('services-section').style.display = 'none';
        document.getElementById('tours-section').style.display = 'none';
        document.getElementById('rules-section').style.display = 'none';
        document.getElementById('housekeeping-section').style.display = 'none';
        document.getElementById('ratings-section').style.display = 'none';

        if(table === 'minibar_items') document.getElementById('minibar-section').style.display = 'block';
        if(table === 'services') document.getElementById('services-section').style.display = 'block';
        if(table === 'tours') document.getElementById('tours-section').style.display = 'block';
        if(table === 'rules') document.getElementById('rules-section').style.display = 'block';
        if(table === 'housekeeping_requests') document.getElementById('housekeeping-section').style.display = 'block';
        if(table === 'housekeeping_ratings') document.getElementById('ratings-section').style.display = 'block';

        const { data, error } = await supabaseClient.from(table).select('*').order('created_at', { ascending: false });
        if (error) console.error(error);
        renderCallback(data);
    };

    // Minibar Feature
    window.renderMinibar = function(data) {
        let html = `<table><tr><th>Name</th><th>Price (AMD)</th><th>Actions</th></tr>`;
        data.forEach(item => {
            html += `<tr><td>${item.name}</td><td>${item.price}</td>
            <td><button style="background:red;" onclick="deleteItem('minibar_items', '${item.id}', renderMinibar)">Delete</button></td></tr>`;
        });
        html += `</table>`;
        document.getElementById('minibar-table').innerHTML = html;
    };

    window.addMinibarItem = async function() {
        const name = document.getElementById('mb-name').value;
        const price = document.getElementById('mb-price').value;
        const img = document.getElementById('mb-img').value;
        await supabaseClient.from('minibar_items').insert([{ name, price: parseInt(price), image_url: img }]);
        loadData('minibar_items', renderMinibar);
    };

    // Services
    window.renderServices = function(data) {
        let html = `<table><tr><th>Key</th><th>Title</th><th>Type</th><th>Actions</th></tr>`;
        data.forEach(item => {
            html += `<tr><td>${item.service_key}</td><td>${item.title}</td><td>${item.status_type}</td>
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
        await supabaseClient.from('services').insert([{ service_key, title, description, status_type, icon }]);
        loadData('services', renderServices);
    };

    // Tours
    window.renderTours = function(data) {
        let html = `<table><tr><th>Key</th><th>Title</th><th>Price</th><th>Actions</th></tr>`;
        data.forEach(item => {
            html += `<tr><td>${item.tour_key}</td><td>${item.title}</td><td>${item.price}</td>
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
        await supabaseClient.from('tours').insert([{ tour_key, title, description, price, icon }]);
        loadData('tours', renderTours);
    };

    // Rules
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

    // Housekeeping
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

    // Ratings
    window.renderRatings = function(data) {
        let html = `<table><tr><th>Rating</th><th>Comment</th><th>Time</th></tr>`;
        let sum = 0;
        data.forEach(item => {
            sum += item.rating;
            html += `<tr><td>${'⭐'.repeat(item.rating)}</td><td>${item.comment || '-'}</td><td>${new Date(item.created_at).toLocaleString()}</td></tr>`;
        });
        html += `</table>`;
        
        let avg = data.length > 0 ? (sum / data.length).toFixed(1) : 0;
        document.getElementById('ratings-table').innerHTML = `<h4>Average Rating: ⭐ ${avg}</h4>` + html;
    };

    // Global Delete
    window.deleteItem = async function(table, id, renderCallback) {
        await supabaseClient.from(table).delete().eq('id', id);
        loadData(table, renderCallback);
    };

    // Real-time Subscriptions
    function initRealtime() {
        supabaseClient.channel('public:housekeeping_requests')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'housekeeping_requests' }, () => {
                const hkSection = document.getElementById('housekeeping-section');
                if (hkSection && hkSection.style.display === 'block') {
                    loadData('housekeeping_requests', renderHousekeeping);
                }
            })
            .subscribe();

        supabaseClient.channel('public:housekeeping_ratings')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'housekeeping_ratings' }, () => {
                const rtSection = document.getElementById('ratings-section');
                if (rtSection && rtSection.style.display === 'block') {
                    loadData('housekeeping_ratings', renderRatings);
                }
            })
            .subscribe();
    }

    // Start Real-time after auth
    supabaseClient.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN') {
            initRealtime();
        }
    });

})();
