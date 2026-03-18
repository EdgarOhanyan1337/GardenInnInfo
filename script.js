/**
 * LUXORA Resort - Enhanced JavaScript
 * Multi-language support, modal system, lightbox, and animations
 */

// ==================== SUPABASE INITIALIZATION ====================
const ROOT_SUPABASE_URL = 'https://klnxybjaaxtlfabnzxcd.supabase.co';
const ROOT_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtsbnh5YmphYXh0bGZhYm56eGNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NjA2MjksImV4cCI6MjA4OTQzNjYyOX0.uUAxzL-8nBkgqoYkQg74Ych0BzKFBVcN_IJlqoZ8tQM';
const supabaseClient = window.supabase ? window.supabase.createClient(ROOT_SUPABASE_URL, ROOT_SUPABASE_KEY) : null;

// ==================== TRANSLATIONS (DEFAULT FALLBACK) ====================
let translations = {
    en: { welcome: "Welcome", tagline: "Garden Inn Resort & Spa", services: "Services", rules: "Rules", minibar: "Mini Bar", tours: "Tours", housekeeping: "Housekeeping", rating: "Rate Us", contact: "Get in Touch", contactMenu: "Contact Us", wifiMenu: "WiFi", otherContact: "Other", more: "More →", gallery: "Gallery", price: "Price", about: "Garden Inn Resort offers luxury in private paradise.", copied: "Copied!", wifi: "WiFi", network: "Network:", password: "Password:", copy: "Copy", wifiInstructions: "Scan QR or enter password." },
    ru: { welcome: "Добро пожаловать", tagline: "Садово-Зелёный Курорт и Спа", services: "Услуги", rules: "Правила", minibar: "Мини-Бар", tours: "Туры", housekeeping: "Уборка", rating: "Оценить нас", contact: "Связаться с нами", contactMenu: "Связаться", wifiMenu: "WiFi", otherContact: "Другое", more: "Подробнее →", gallery: "Галерея", price: "Цена", about: "Garden Inn Resort предлагает непревзойдённую роскошь.", copied: "Скопировано!", wifi: "WiFi", network: "Сеть:", password: "Пароль:", copy: "Копировать", wifiInstructions: "Отсканируйте код." },
    hy: { welcome: "Բարի գալուստ", tagline: "Սակայն-Կանաչ Հանգստյան Գոտի և ՍպԱ", services: "Ծառայություններ", rules: "Կանոններ", minibar: "Մինի-Բար", tours: "Տուրեր", housekeeping: "Մաքրություն", rating: "Գնահատել մեզ", contact: "Կապվեք մեզ հետ", contactMenu: "Կապ", wifiMenu: "WiFi", otherContact: "Այլ", more: "Ավելին →", gallery: "Պատկերասրահ", price: "Գինը", about: "Garden Inn Resort առաջարկում է անհավանական շքեղություն:", copied: "Պատճենվել է!", wifi: "WiFi", network: "Ցանց:", password: "Գաղտնաբառ:", copy: "Պատճենել", wifiInstructions: "Սկան QR կոդը:" }
};

// ==================== STATE ====================
let currentLang = 'en';
let currentTheme = 'dark';
let dynamicServices = [];
let dynamicTours = [];

// ==================== SUPABASE DATA LOADING ====================

async function loadTranslations() {
    if (!supabaseClient) return;
    try {
        const { data, error } = await supabaseClient.from('translations').select('*');
        if (error) throw error;
        if (data && data.length > 0) {
            // Rebuild the translations object from DB
            const dbTrans = { en: {}, ru: {}, hy: {} };
            data.forEach(row => {
                dbTrans.en[row.key] = row.en;
                dbTrans.ru[row.key] = row.ru;
                dbTrans.hy[row.key] = row.hy;
            });
            translations = dbTrans;
            updateTexts();
        }
    } catch (err) { console.error("Error loading translations:", err); }
}

async function loadMinibar() {
    if (!supabaseClient) return;
    try {
        const { data, error } = await supabaseClient.from('minibar_items').select('*').order('created_at', { ascending: true });
        const container = document.querySelector('.products-grid');
        if (container && data && data.length > 0) {
            container.innerHTML = '';
            data.forEach(item => {
                const article = document.createElement('article');
                article.className = 'product-card';
                article.innerHTML = `
                    <div class="product-image" data-images='["${item.image_url}"]'>
                        <img src="${item.image_url}" alt="${item.name}" loading="lazy">
                        <div class="product-overlay"><button class="view-btn">👁</button></div>
                    </div>
                    <div class="product-info"><h4>${item.name}</h4><p class="price">${item.price} AMD</p></div>
                `;
                container.appendChild(article);
            });
            initLightboxTriggers();
        }
    } catch (err) { console.error(err); }
}

async function loadServices() {
    if (!supabaseClient) return;
    try {
        const { data, error } = await supabaseClient.from('services').select('*').order('created_at', { ascending: true });
        if (data) {
            dynamicServices = data;
            const container = document.querySelector('#services-modal .services-grid');
            if (container) {
                container.innerHTML = '';
                data.forEach(item => {
                    const article = document.createElement('article');
                    article.className = 'service-card';
                    article.dataset.service = item.service_key;
                    article.innerHTML = `
                        <div class="service-icon">${item.icon}</div>
                        <h3>${item.title}</h3>
                        <span class="status ${item.status_type}">${item.status_type.toUpperCase()}</span>
                        <button class="more-btn" data-key="more">${translations[currentLang].more}</button>
                    `;
                    container.appendChild(article);
                });
                // Re-init detail buttons
                container.querySelectorAll('.more-btn').forEach(btn => btn.onclick = () => openDetail(btn.closest('.service-card').dataset.service));
            }
        }
    } catch (err) { console.error(err); }
}

async function loadTours() {
    if (!supabaseClient) return;
    try {
        const { data, error } = await supabaseClient.from('tours').select('*').order('created_at', { ascending: true });
        if (data) {
            dynamicTours = data;
            const container = document.querySelector('#tours-modal .services-grid');
            if (container) {
                container.innerHTML = '';
                data.forEach(item => {
                    const article = document.createElement('article');
                    article.className = 'service-card';
                    article.dataset.service = item.tour_key;
                    article.innerHTML = `
                        <div class="service-icon">${item.icon}</div>
                        <h3>${item.title}</h3>
                        <span class="price">${item.price}</span>
                        <button class="more-btn" data-key="more">${translations[currentLang].more}</button>
                    `;
                    container.appendChild(article);
                });
                container.querySelectorAll('.more-btn').forEach(btn => btn.onclick = () => openDetail(btn.closest('.service-card').dataset.service));
            }
        }
    } catch (err) { console.error(err); }
}

async function loadRules() {
    if (!supabaseClient) return;
    try {
        const { data, error } = await supabaseClient.from('rules').select('*').order('created_at', { ascending: true });
        const container = document.querySelector('#rules-modal .rules-grid');
        if (container && data) {
            container.innerHTML = '';
            data.forEach(item => {
                const div = document.createElement('div');
                div.className = 'rule-item';
                div.innerHTML = `<span class="rule-icon">${item.icon}</span><p>${item.text}</p>`;
                container.appendChild(div);
            });
        }
    } catch (err) { console.error(err); }
}

// ==================== CORE FUNCTIONS ====================

function initLanguage() {
    document.querySelectorAll('.lang-btn').forEach(btn => btn.addEventListener('click', () => setLanguage(btn.dataset.lang)));
    updateTexts();
}

function setLanguage(lang) {
    currentLang = lang;
    document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.lang === lang));
    updateTexts();
    // Refresh dynamic lists to apply new "More" button text
    loadServices();
    loadTours();
}

function updateTexts() {
    document.querySelectorAll('[data-key]').forEach(el => {
        const key = el.dataset.key;
        if (translations[currentLang][key]) el.innerHTML = translations[currentLang][key];
    });
    document.title = `Garden Inn Resort | ${translations[currentLang].tagline || 'Resort'}`;
}

function initTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    themeToggle.onclick = () => setTheme(currentTheme === 'dark' ? 'light' : 'dark');
}

function setTheme(theme) {
    currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    const icon = document.querySelector('#theme-toggle .theme-icon');
    if (icon) icon.textContent = theme === 'light' ? '🌙' : '☀️';
}

function openModal(id) {
    const modal = document.getElementById(id + '-modal');
    if (modal) { modal.classList.add('active'); document.body.style.overflow = 'hidden'; }
}

function closeModal(modal) {
    if (modal) { modal.classList.remove('active'); document.body.style.overflow = ''; }
}

function initModals() {
    document.querySelectorAll('.nav-btn').forEach(btn => btn.onclick = () => openModal(btn.dataset.modal));
    document.querySelectorAll('.modal-close').forEach(btn => btn.onclick = () => closeModal(btn.closest('.modal')));
    document.querySelectorAll('.modal').forEach(m => m.onclick = (e) => { if(e.target === m) closeModal(m); });
}

function openDetail(serviceKey) {
    const data = dynamicServices.find(s => s.service_key === serviceKey) || dynamicTours.find(t => t.tour_key === serviceKey);
    if (!data) return;

    document.getElementById('detail-title').textContent = data.title;
    document.getElementById('detail-content').innerHTML = data.description || data.desc;
    
    const gallery = document.getElementById('detail-gallery');
    gallery.innerHTML = '';
    const images = (typeof data.images === 'string' ? JSON.parse(data.images) : data.images) || [];
    images.forEach((src, i) => {
        const img = document.createElement('img');
        img.src = src;
        img.onclick = () => openLightbox(images, i);
        gallery.appendChild(img);
    });

    openModal('detail');
}

let lightboxImages = [];
let lightboxIndex = 0;

function openLightbox(images, index) {
    lightboxImages = images;
    lightboxIndex = index;
    const lb = document.getElementById('lightbox');
    const img = document.getElementById('lightbox-image');
    img.src = images[index];
    document.getElementById('lightbox-current').textContent = index + 1;
    document.getElementById('lightbox-total').textContent = images.length;
    lb.classList.add('active');
}

function initLightbox() {
    const lb = document.getElementById('lightbox');
    lb.querySelector('.lightbox-close').onclick = () => lb.classList.remove('active');
    lb.querySelector('.lightbox-prev').onclick = () => {
        lightboxIndex = (lightboxIndex - 1 + lightboxImages.length) % lightboxImages.length;
        document.getElementById('lightbox-image').src = lightboxImages[lightboxIndex];
        document.getElementById('lightbox-current').textContent = lightboxIndex + 1;
    };
    lb.querySelector('.lightbox-next').onclick = () => {
        lightboxIndex = (lightboxIndex + 1) % lightboxImages.length;
        document.getElementById('lightbox-image').src = lightboxImages[lightboxIndex];
        document.getElementById('lightbox-current').textContent = lightboxIndex + 1;
    };
}

function initLightboxTriggers() {
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.onclick = () => {
            const card = btn.closest('.product-image');
            const imgs = JSON.parse(card.dataset.images);
            openLightbox(imgs, 0);
        };
    });
}

function initWiFi() {
    const btn = document.getElementById('wifi-connect-btn');
    if (btn) btn.onclick = () => openModal('wifi');
    const copyBtn = document.getElementById('wifi-copy-btn');
    if (copyBtn) copyBtn.onclick = () => {
        navigator.clipboard.writeText('094146454');
        copyBtn.querySelector('span').textContent = translations[currentLang].copied;
        setTimeout(() => copyBtn.querySelector('span').textContent = translations[currentLang].copy, 2000);
    };
}

function initHousekeeping() {
    const form = document.getElementById('hk-form');
    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            const room = document.getElementById('hk-room').value;
            await supabaseClient.from('housekeeping_requests').insert([{ room_number: room }]);
            document.getElementById('hk-msg').style.display = 'block';
            form.reset();
        };
    }
}

function initRating() {
    const form = document.getElementById('rating-form');
    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            const rating = document.querySelector('input[name="rating"]:checked')?.value;
            const comment = document.getElementById('rating-comment').value;
            if (!rating) return alert('Select stars!');
            await supabaseClient.from('housekeeping_ratings').insert([{ rating: parseInt(rating), comment }]);
            document.getElementById('rating-msg').style.display = 'block';
            form.reset();
        };
    }
}

async function initSupabaseFeatures() {
    if (!supabaseClient) return;
    await loadTranslations();
    loadMinibar();
    loadServices();
    loadTours();
    loadRules();
    
    // Real-time Update
    supabaseClient.channel('public_changes').on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
        if (payload.table === 'translations') loadTranslations();
        if (payload.table === 'minibar_items') loadMinibar();
        if (payload.table === 'services') loadServices();
        if (payload.table === 'tours') loadTours();
        if (payload.table === 'rules') loadRules();
    }).subscribe();
}

document.addEventListener('DOMContentLoaded', () => {
    initLanguage();
    initTheme();
    initWiFi();
    initModals();
    initLightbox();
    initHousekeeping();
    initRating();
    initSupabaseFeatures();
});
