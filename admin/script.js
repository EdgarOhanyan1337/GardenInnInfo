const supabaseUrl = 'https://klnxybjaaxtlfabnzxcd.supabase.co';
const supabaseKey = 'sb_secret_CS9wfE_qUfL3MrR2xzrTAQ_kf-z1ciE';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// Auth
async function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { alert('Login Failed: ' + error.message); } 
    else { 
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        loadData('minibar_items', renderMinibar);
    }
}

async function logout() {
    await supabase.auth.signOut();
    location.reload();
}

// Check session on load
supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        loadData('minibar_items', renderMinibar);
    }
});

// Load Data dynamically
async function loadData(table, renderCallback) {
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

    const { data, error } = await supabase.from(table).select('*').order('created_at', { ascending: false });
    if (error) console.error(error);
    renderCallback(data);
}

// Minibar Feature
function renderMinibar(data) {
    let html = `<table><tr><th>Name</th><th>Price (AMD)</th><th>Actions</th></tr>`;
    data.forEach(item => {
        html += `<tr><td>${item.name}</td><td>${item.price}</td>
        <td><button style="background:red;" onclick="deleteItem('minibar_items', '${item.id}', renderMinibar)">Delete</button></td></tr>`;
    });
    html += `</table>`;
    document.getElementById('minibar-table').innerHTML = html;
}

async function addMinibarItem() {
    const name = document.getElementById('mb-name').value;
    const price = document.getElementById('mb-price').value;
    const img = document.getElementById('mb-img').value;
    await supabase.from('minibar_items').insert([{ name, price: parseInt(price), image_url: img }]);
    loadData('minibar_items', renderMinibar);
}

// Services
function renderServices(data) {
    let html = `<table><tr><th>Key</th><th>Title</th><th>Type</th><th>Actions</th></tr>`;
    data.forEach(item => {
        html += `<tr><td>${item.service_key}</td><td>${item.title}</td><td>${item.status_type}</td>
        <td><button style="background:red;" onclick="deleteItem('services', '${item.id}', renderServices)">Delete</button></td></tr>`;
    });
    html += `</table>`;
    document.getElementById('services-table').innerHTML = html;
}

async function addService() {
    const service_key = document.getElementById('svc-key').value;
    const title = document.getElementById('svc-title').value;
    const description = document.getElementById('svc-desc').value;
    const status_type = document.getElementById('svc-type').value;
    const icon = document.getElementById('svc-icon').value;
    await supabase.from('services').insert([{ service_key, title, description, status_type, icon }]);
    loadData('services', renderServices);
}

// Tours
function renderTours(data) {
    let html = `<table><tr><th>Key</th><th>Title</th><th>Price</th><th>Actions</th></tr>`;
    data.forEach(item => {
        html += `<tr><td>${item.tour_key}</td><td>${item.title}</td><td>${item.price}</td>
        <td><button style="background:red;" onclick="deleteItem('tours', '${item.id}', renderTours)">Delete</button></td></tr>`;
    });
    html += `</table>`;
    document.getElementById('tours-table').innerHTML = html;
}

async function addTour() {
    const tour_key = document.getElementById('tour-key').value;
    const title = document.getElementById('tour-title').value;
    const description = document.getElementById('tour-desc').value;
    const price = document.getElementById('tour-price').value;
    const icon = document.getElementById('tour-icon').value;
    await supabase.from('tours').insert([{ tour_key, title, description, price, icon }]);
    loadData('tours', renderTours);
}

// Rules
function renderRules(data) {
    let html = `<table><tr><th>Icon</th><th>Text</th><th>Actions</th></tr>`;
    data.forEach(item => {
        html += `<tr><td>${item.icon}</td><td>${item.text}</td>
        <td><button style="background:red;" onclick="deleteItem('rules', '${item.id}', renderRules)">Delete</button></td></tr>`;
    });
    html += `</table>`;
    document.getElementById('rules-table').innerHTML = html;
}

async function addRule() {
    const icon = document.getElementById('rule-icon').value;
    const text = document.getElementById('rule-text').value;
    await supabase.from('rules').insert([{ icon, text }]);
    loadData('rules', renderRules);
}

// Housekeeping
function renderHousekeeping(data) {
    let html = `<table><tr><th>Room</th><th>Status</th><th>Time</th></tr>`;
    data.forEach(item => {
        html += `<tr><td>${item.room_number}</td>
        <td style="color:${item.status === 'accepted' ? 'green' : 'orange'}"><b>${item.status.toUpperCase()}</b></td>
        <td>${new Date(item.created_at).toLocaleString()}</td></tr>`;
    });
    html += `</table>`;
    document.getElementById('hk-table').innerHTML = html;
}

// Ratings
function renderRatings(data) {
    let html = `<table><tr><th>Rating</th><th>Comment</th><th>Time</th></tr>`;
    let sum = 0;
    data.forEach(item => {
        sum += item.rating;
        html += `<tr><td>${'⭐'.repeat(item.rating)}</td><td>${item.comment || '-'}</td><td>${new Date(item.created_at).toLocaleString()}</td></tr>`;
    });
    html += `</table>`;
    
    let avg = data.length > 0 ? (sum / data.length).toFixed(1) : 0;
    document.getElementById('ratings-table').innerHTML = `<h4>Average Rating: ⭐ ${avg}</h4>` + html;
}

// Global Delete
async function deleteItem(table, id, renderCallback) {
    await supabase.from(table).delete().eq('id', id);
    loadData(table, renderCallback);
}

// Real-time Subscriptions
function initRealtime() {
    supabase.channel('public:housekeeping_requests')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'housekeeping_requests' }, () => {
            if (document.getElementById('housekeeping-section').style.display === 'block') {
                loadData('housekeeping_requests', renderHousekeeping);
            }
        })
        .subscribe();

    supabase.channel('public:housekeeping_ratings')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'housekeeping_ratings' }, () => {
            if (document.getElementById('ratings-section').style.display === 'block') {
                loadData('housekeeping_ratings', renderRatings);
            }
        })
        .subscribe();
}

// Start Real-time after auth
supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN') {
        initRealtime();
    }
});
