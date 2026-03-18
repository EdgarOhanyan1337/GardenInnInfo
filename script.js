/**
 * Garden Inn Resort - Frontend JavaScript
 * Dynamic content from Supabase, multi-language, modals, lightbox
 */

// ==================== SUPABASE ====================
const ROOT_SUPABASE_URL = 'https://klnxybjaaxtlfabnzxcd.supabase.co';
const ROOT_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtsbnh5YmphYXh0bGZhYm56eGNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NjA2MjksImV4cCI6MjA4OTQzNjYyOX0.uUAxzL-8nBkgqoYkQg74Ych0BzKFBVcN_IJlqoZ8tQM';
const supabaseClient = window.supabase ? window.supabase.createClient(ROOT_SUPABASE_URL, ROOT_SUPABASE_KEY) : null;

// ==================== TRANSLATIONS (FALLBACK - real text comes from DB) ====================
let translations = {
    en: { welcome: "Welcome", tagline: "Garden Inn Resort & Spa", services: "Services", rules: "Rules", minibar: "Mini Bar", tours: "Tours", housekeeping: "Housekeeping", rating: "Rate Us", contact: "Get in Touch", contactMenu: "Contact Us", wifiMenu: "WiFi", otherContact: "Other", otherMethodsTitle: "Other Methods", more: "More", gallery: "Gallery", price: "Price", about: "Garden Inn Resort offers luxury.", copied: "Copied!", wifi: "WiFi", network: "Network:", password: "Password:", copy: "Copy", wifiInstructions: "Scan QR or enter password." },
    ru: { welcome: "Welcome", tagline: "Garden Inn Resort", services: "Services", rules: "Rules", minibar: "Mini Bar", tours: "Tours", housekeeping: "Housekeeping", rating: "Rate Us", contact: "Contact", contactMenu: "Contact", wifiMenu: "WiFi", otherContact: "Other", otherMethodsTitle: "Other", more: "More", gallery: "Gallery", price: "Price", about: "Garden Inn Resort.", copied: "OK!", wifi: "WiFi", network: "Network:", password: "Password:", copy: "Copy", wifiInstructions: "Scan QR." },
    hy: { welcome: "Welcome", tagline: "Garden Inn Resort", services: "Services", rules: "Rules", minibar: "Mini Bar", tours: "Tours", housekeeping: "Housekeeping", rating: "Rate Us", contact: "Contact", contactMenu: "Contact", wifiMenu: "WiFi", otherContact: "Other", otherMethodsTitle: "Other", more: "More", gallery: "Gallery", price: "Price", about: "Garden Inn Resort.", copied: "OK!", wifi: "WiFi", network: "Network:", password: "Password:", copy: "Copy", wifiInstructions: "Scan QR." }
};

// ==================== STATE ====================
let currentLang = 'en';
let currentTheme = 'dark';
let dynamicServices = [];
let dynamicTours = [];
let lightboxImages = [];
let lightboxIndex = 0;

// ==================== SUPABASE LOADING ====================

async function loadTranslations() {
    if (!supabaseClient) return;
    try {
        const { data, error } = await supabaseClient.from('translations').select('*');
        if (error || !data || data.length === 0) return;
        const dbT = { en: {}, ru: {}, hy: {} };
        data.forEach(r => { dbT.en[r.key] = r.en; dbT.ru[r.key] = r.ru; dbT.hy[r.key] = r.hy; });
        ['en', 'ru', 'hy'].forEach(lang => {
            translations[lang] = { ...translations[lang], ...dbT[lang] };
        });
        updateTexts();
    } catch (e) { console.error('Translations error:', e); }
}

async function loadMinibar() {
    if (!supabaseClient) return;
    try {
        const { data } = await supabaseClient.from('minibar_items').select('*');
        const container = document.querySelector('.products-grid');
        if (!container || !data || data.length === 0) return;
        container.innerHTML = '';
        data.forEach(item => {
            const article = document.createElement('article');
            article.className = 'product-card';
            article.innerHTML = `
                <div class="product-image" data-images='["${item.image_url}"]'>
                    <img src="${item.image_url}" alt="${item.name}" loading="lazy" onerror="this.style.display='none'">
                    <div class="product-overlay"><button class="view-btn">&#128065;</button></div>
                </div>
                <div class="product-info"><h4>${item.name}</h4><p class="price">${item.price} AMD</p></div>
            `;
            container.appendChild(article);
        });
        initLightboxTriggers();
    } catch (e) { console.error('Minibar error:', e); }
}

async function loadServices() {
    if (!supabaseClient) return;
    try {
        const { data } = await supabaseClient.from('services').select('*');
        if (!data) return;
        dynamicServices = data;
        const container = document.querySelector('#services-modal .services-grid');
        if (!container) return;
        container.innerHTML = '';
        data.forEach(item => {
            const article = document.createElement('article');
            article.className = 'service-card';
            article.dataset.service = item.service_key;
            article.innerHTML = `
                <div class="service-icon">${item.icon}</div>
                <h3>${item.title}</h3>
                <span class="status ${item.status_type}">${item.status_type.toUpperCase()}</span>
                <button class="more-btn">${translations[currentLang].more || 'More'}</button>
            `;
            container.appendChild(article);
        });
        container.querySelectorAll('.more-btn').forEach(btn => {
            btn.onclick = () => openDetail(btn.closest('.service-card').dataset.service);
        });
    } catch (e) { console.error('Services error:', e); }
}

async function loadTours() {
    if (!supabaseClient) return;
    try {
        const { data } = await supabaseClient.from('tours').select('*');
        if (!data) return;
        dynamicTours = data;
        const container = document.querySelector('#tours-modal .services-grid');
        if (!container) return;
        container.innerHTML = '';
        data.forEach(item => {
            const article = document.createElement('article');
            article.className = 'service-card';
            article.dataset.service = item.tour_key;
            article.innerHTML = `
                <div class="service-icon">${item.icon}</div>
                <h3>${item.title}</h3>
                <span class="price">${item.price}</span>
                <button class="more-btn">${translations[currentLang].more || 'More'}</button>
            `;
            container.appendChild(article);
        });
        container.querySelectorAll('.more-btn').forEach(btn => {
            btn.onclick = () => openDetail(btn.closest('.service-card').dataset.service);
        });
    } catch (e) { console.error('Tours error:', e); }
}

async function loadRules() {
    if (!supabaseClient) return;
    try {
        const { data } = await supabaseClient.from('rules').select('*');
        const container = document.querySelector('#rules-modal .rules-grid');
        if (!container || !data) return;
        container.innerHTML = '';
        data.forEach(item => {
            const div = document.createElement('div');
            div.className = 'rule-item';
            div.innerHTML = '<span class="rule-icon">' + item.icon + '</span><p>' + item.text + '</p>';
            container.appendChild(div);
        });
    } catch (e) { console.error('Rules error:', e); }
}

// ==================== LANGUAGE ====================

function initLanguage() {
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', () => setLanguage(btn.dataset.lang));
    });
    updateTexts();
}

function setLanguage(lang) {
    currentLang = lang;
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === lang);
    });
    updateTexts();
    loadServices();
    loadTours();
}

function updateTexts() {
    const t = translations[currentLang] || translations.en;
    document.querySelectorAll('[data-key]').forEach(el => {
        const key = el.dataset.key;
        if (el.classList.contains('price')) return;
        if (t[key]) el.innerHTML = t[key];
    });
    document.title = 'Garden Inn Resort | ' + (t.tagline || 'Resort');
}

// ==================== THEME ====================

function initTheme() {
    const toggle = document.getElementById('theme-toggle');
    if (!toggle) return;
    setTheme(localStorage.getItem('theme') || 'dark');
    toggle.onclick = () => setTheme(currentTheme === 'dark' ? 'light' : 'dark');
}

function setTheme(theme) {
    currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    const icon = document.querySelector('#theme-toggle .theme-icon');
    if (icon) icon.textContent = theme === 'light' ? '\uD83C\uDF19' : '\u2600\uFE0F';
}

// ==================== MODALS ====================

function openModal(id) {
    const modal = document.getElementById(id + '-modal');
    if (modal) { modal.classList.add('active'); document.body.style.overflow = 'hidden'; }
}

function closeModal(modal) {
    if (modal) { modal.classList.remove('active'); document.body.style.overflow = ''; }
}

function initModals() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.onclick = () => { if (btn.dataset.modal) openModal(btn.dataset.modal); };
    });
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.onclick = () => closeModal(btn.closest('.modal'));
    });
    document.querySelectorAll('.modal').forEach(m => {
        m.onclick = (e) => { if (e.target === m) closeModal(m); };
    });
}

// ==================== DETAIL MODAL ====================

function openDetail(serviceKey) {
    const data = dynamicServices.find(s => s.service_key === serviceKey) || dynamicTours.find(t => t.tour_key === serviceKey);
    if (!data) return;

    const titleEl = document.getElementById('detail-title');
    const contentEl = document.getElementById('detail-content');
    const galleryEl = document.getElementById('detail-gallery');

    if (titleEl) titleEl.textContent = data.title;
    if (contentEl) contentEl.innerHTML = data.description || '';

    if (galleryEl) {
        galleryEl.innerHTML = '';
        let imgs = data.images || [];
        if (typeof imgs === 'string') { try { imgs = JSON.parse(imgs); } catch(e) { imgs = []; } }
        imgs.forEach((src, i) => {
            const img = document.createElement('img');
            img.src = src;
            img.onclick = () => openLightbox(imgs, i);
            galleryEl.appendChild(img);
        });
    }
    openModal('detail');
}

// ==================== LIGHTBOX ====================

function openLightbox(images, index) {
    if (!images || images.length === 0) return;
    lightboxImages = images;
    lightboxIndex = index;
    const lb = document.getElementById('lightbox');
    const img = document.getElementById('lightbox-image');
    if (!lb || !img) return;
    img.src = images[index];
    const cur = document.getElementById('lightbox-current');
    const tot = document.getElementById('lightbox-total');
    if (cur) cur.textContent = index + 1;
    if (tot) tot.textContent = images.length;
    lb.classList.add('active');
}

function initLightbox() {
    const lb = document.getElementById('lightbox');
    if (!lb) return;
    const closeBtn = lb.querySelector('.lightbox-close');
    const prevBtn = lb.querySelector('.lightbox-prev');
    const nextBtn = lb.querySelector('.lightbox-next');
    if (closeBtn) closeBtn.onclick = () => { lb.classList.remove('active'); document.body.style.overflow = ''; };
    if (prevBtn) prevBtn.onclick = () => navLightbox(-1);
    if (nextBtn) nextBtn.onclick = () => navLightbox(1);
    lb.onclick = (e) => { if (e.target === lb) { lb.classList.remove('active'); document.body.style.overflow = ''; } };
}

function navLightbox(dir) {
    if (lightboxImages.length === 0) return;
    lightboxIndex = (lightboxIndex + dir + lightboxImages.length) % lightboxImages.length;
    const img = document.getElementById('lightbox-image');
    const cur = document.getElementById('lightbox-current');
    if (img) img.src = lightboxImages[lightboxIndex];
    if (cur) cur.textContent = lightboxIndex + 1;
}

function initLightboxTriggers() {
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.onclick = () => {
            const card = btn.closest('.product-image');
            if (!card) return;
            try {
                const imgs = JSON.parse(card.dataset.images);
                openLightbox(imgs, 0);
            } catch(e) {}
        };
    });
}

// ==================== KEYBOARD ====================

function initKeyboard() {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const lb = document.getElementById('lightbox');
            if (lb && lb.classList.contains('active')) { lb.classList.remove('active'); document.body.style.overflow = ''; return; }
            const active = document.querySelector('.modal.active');
            if (active) closeModal(active);
        }
        const lb = document.getElementById('lightbox');
        if (lb && lb.classList.contains('active')) {
            if (e.key === 'ArrowLeft') navLightbox(-1);
            if (e.key === 'ArrowRight') navLightbox(1);
        }
    });
}

// ==================== WIFI ====================

function initWiFi() {
    const btn = document.getElementById('wifi-connect-btn');
    if (btn) btn.onclick = () => openModal('wifi');
    const copyBtn = document.getElementById('wifi-copy-btn');
    if (copyBtn) {
        copyBtn.onclick = () => {
            navigator.clipboard.writeText('094146454').then(() => {
                const span = copyBtn.querySelector('span');
                if (span) {
                    const original = span.textContent;
                    span.textContent = (translations[currentLang] && translations[currentLang].copied) || 'Copied!';
                    setTimeout(() => { span.textContent = original; }, 2000);
                }
            }).catch(() => {});
        };
    }
}

// ==================== CONTACT ====================

function initContactModal() {
    const otherBtn = document.getElementById('contact-other-btn');
    const otherDetails = document.getElementById('contact-other-details');
    if (otherBtn && otherDetails) {
        otherBtn.onclick = () => {
            otherDetails.style.display = otherDetails.style.display === 'none' ? 'block' : 'none';
        };
    }
}

// ==================== HOUSEKEEPING & RATING ====================

function initHousekeeping() {
    const form = document.getElementById('hk-form');
    if (!form || !supabaseClient) return;
    form.onsubmit = async (e) => {
        e.preventDefault();
        const roomEl = document.getElementById('hk-room');
        const room = roomEl ? roomEl.value : '';
        if (!room) return;
        await supabaseClient.from('housekeeping_requests').insert([{ room_number: room }]);
        const msg = document.getElementById('hk-msg');
        if (msg) msg.style.display = 'block';
        form.reset();
    };
}

function initRating() {
    const form = document.getElementById('rating-form');
    if (!form || !supabaseClient) return;
    form.onsubmit = async (e) => {
        e.preventDefault();
        const checkedEl = document.querySelector('input[name="rating"]:checked');
        const rating = checkedEl ? checkedEl.value : null;
        const commentEl = document.getElementById('rating-comment');
        const comment = commentEl ? commentEl.value : '';
        if (!rating) return alert('Please select a rating!');
        await supabaseClient.from('housekeeping_ratings').insert([{ rating: parseInt(rating), comment: comment }]);
        const msg = document.getElementById('rating-msg');
        if (msg) msg.style.display = 'block';
        form.reset();
    };
}

// ==================== VIDEO ====================

function initVideo() {
    const video = document.getElementById('bg-video');
    if (!video) return;
    video.play().catch(() => {});
    video.onerror = () => { video.style.display = 'none'; };
}

// ==================== LOGO ANIMATION ====================

function initLogoAnimation() {
    const letters = document.querySelectorAll('.logo-svg-text .logo-letter');
    if (!letters.length) return;
    setTimeout(() => {
        letters.forEach((letter, i) => {
            setTimeout(() => letter.classList.add('fill-color'), i * 80);
        });
    }, 2600);
}

// ==================== SUPABASE FEATURES ====================

async function initSupabaseFeatures() {
    if (!supabaseClient) return;
    await loadTranslations();
    loadMinibar();
    loadServices();
    loadTours();
    loadRules();

    // Real-time
    supabaseClient.channel('public_live')
        .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
            if (payload.table === 'translations') loadTranslations();
            if (payload.table === 'minibar_items') loadMinibar();
            if (payload.table === 'services') loadServices();
            if (payload.table === 'tours') loadTours();
            if (payload.table === 'rules') loadRules();
        })
        .subscribe();
}

// ==================== INIT ====================

document.addEventListener('DOMContentLoaded', () => {
    initLanguage();
    initTheme();
    initWiFi();
    initModals();
    initLightbox();
    initKeyboard();
    initVideo();
    initLogoAnimation();
    initContactModal();
    initHousekeeping();
    initRating();
    initSupabaseFeatures();
});
