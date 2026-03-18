/**
 * Garden Inn Resort - Frontend JavaScript V4
 * Housekeeping codes, multi-lang content, Telegram notifications
 */

// ==================== SUPABASE ====================
const ROOT_SUPABASE_URL = 'https://klnxybjaaxtlfabnzxcd.supabase.co';
const ROOT_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtsbnh5YmphYXh0bGZhYm56eGNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NjA2MjksImV4cCI6MjA4OTQzNjYyOX0.uUAxzL-8nBkgqoYkQg74Ych0BzKFBVcN_IJlqoZ8tQM';
const supabaseClient = window.supabase ? window.supabase.createClient(ROOT_SUPABASE_URL, ROOT_SUPABASE_KEY) : null;

// Telegram config (for housekeeping notifications)
const TG_BOT_TOKEN = '8391061984:AAEwBuzl8vY50jSkorqc2yJ623rvhKr7sG8';
const TG_CHAT_IDS = ['743938415'];

// ==================== TRANSLATIONS (UI buttons/labels - hardcoded) ====================
let translations = {
    en: { welcome: "Welcome", tagline: "Garden Inn Resort & Spa", services: "Services", rules: "Rules", minibar: "Mini Bar", tours: "Tours", housekeeping: "Housekeeping", contact: "Get in Touch", contactMenu: "Contact Us", wifiMenu: "WiFi", otherContact: "Other", otherMethodsTitle: "Other Methods", more: "More", gallery: "Gallery", price: "Price", about: "Garden Inn Resort offers luxury in a private paradise.", copied: "Copied!", wifi: "WiFi", network: "Network:", password: "Password:", copy: "Copy", wifiInstructions: "Scan QR or enter password." },
    ru: { welcome: "Dobro pozhalovat'", tagline: "Garden Inn Resort & Spa", services: "Uslugi", rules: "Pravila", minibar: "Mini-Bar", tours: "Tury", housekeeping: "Uborka", contact: "Svyaz'", contactMenu: "Kontakty", wifiMenu: "WiFi", otherContact: "Drugoe", otherMethodsTitle: "Drugie sposoby", more: "Podrobnee", gallery: "Galereya", price: "Tsena", about: "Garden Inn Resort predlagaet roskosh'.", copied: "Skopirovano!", wifi: "WiFi", network: "Set':", password: "Parol':", copy: "Kopirovat'", wifiInstructions: "Otskanirujte kod." },
    hy: { welcome: "Bari galust", tagline: "Garden Inn Resort & Spa", services: "Tsarayutyunner", rules: "Kanonner", minibar: "Mini-Bar", tours: "Turer", housekeeping: "Maqrutyun", contact: "Kap", contactMenu: "Kapvel", wifiMenu: "WiFi", otherContact: "Ayl", otherMethodsTitle: "Ayl yeghanaknere", more: "Avelin", gallery: "Patkerasrah", price: "Gine", about: "Garden Inn Resort.", copied: "OK!", wifi: "WiFi", network: "Tsants:", password: "Gaghtnabary:", copy: "Patchenel", wifiInstructions: "Skan QR kody." }
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
            article.innerHTML = '<div class="product-image" data-images=\'["' + item.image_url + '"]\'>' +
                '<img src="' + item.image_url + '" alt="' + item.name + '" loading="lazy" onerror="this.style.display=\'none\'">' +
                '<div class="product-overlay"><button class="view-btn">&#128065;</button></div>' +
                '</div>' +
                '<div class="product-info"><h4>' + item.name + '</h4><p class="price">' + item.price + ' AMD</p></div>';
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
            var title = item['title_' + currentLang] || item.title_en || '';
            var article = document.createElement('article');
            article.className = 'service-card';
            article.dataset.service = item.service_key;
            article.innerHTML = '<div class="service-icon">' + item.icon + '</div>' +
                '<h3>' + title + '</h3>' +
                '<span class="status ' + item.status_type + '">' + item.status_type.toUpperCase() + '</span>' +
                '<button class="more-btn">' + (translations[currentLang].more || 'More') + '</button>';
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
            var title = item['title_' + currentLang] || item.title_en || '';
            var article = document.createElement('article');
            article.className = 'service-card';
            article.dataset.service = item.tour_key;
            article.innerHTML = '<div class="service-icon">' + item.icon + '</div>' +
                '<h3>' + title + '</h3>' +
                '<span class="price">' + item.price + '</span>' +
                '<button class="more-btn">' + (translations[currentLang].more || 'More') + '</button>';
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
        const container = document.querySelector('#rules-modal .rules-grid, #rules-modal .rules-list');
        if (!container || !data || data.length === 0) return;
        container.innerHTML = '';
        data.forEach(item => {
            var text = item['text_' + currentLang] || item.text_en || '';
            var el = document.createElement(container.tagName === 'UL' ? 'li' : 'div');
            if (container.tagName !== 'UL') el.className = 'rule-item';
            el.innerHTML = '<span class="rule-icon">' + item.icon + '</span><span>' + text + '</span>';
            container.appendChild(el);
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
    loadRules();
}

function updateTexts() {
    var t = translations[currentLang] || translations.en;
    document.querySelectorAll('[data-key]').forEach(el => {
        var key = el.dataset.key;
        if (el.classList.contains('price')) return;
        if (t[key]) el.innerHTML = t[key];
    });
    document.title = 'Garden Inn Resort | ' + (t.tagline || 'Resort');
}

// ==================== THEME ====================

function initTheme() {
    var toggle = document.getElementById('theme-toggle');
    if (!toggle) return;
    setTheme(localStorage.getItem('theme') || 'dark');
    toggle.onclick = () => setTheme(currentTheme === 'dark' ? 'light' : 'dark');
}

function setTheme(theme) {
    currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    var icon = document.querySelector('#theme-toggle .theme-icon');
    if (icon) icon.textContent = theme === 'light' ? '\uD83C\uDF19' : '\u2600\uFE0F';
}

// ==================== MODALS ====================

function openModal(id) {
    var modal = document.getElementById(id + '-modal');
    if (modal) { modal.classList.add('active'); document.body.style.overflow = 'hidden'; }
}

function closeModal(modal) {
    if (modal) { modal.classList.remove('active'); document.body.style.overflow = ''; }
}

function initModals() {
    document.querySelectorAll('.nav-btn[data-modal]').forEach(btn => {
        btn.onclick = () => openModal(btn.dataset.modal);
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
    var data = dynamicServices.find(s => s.service_key === serviceKey) || dynamicTours.find(t => t.tour_key === serviceKey);
    if (!data) return;

    var titleEl = document.getElementById('detail-title');
    var contentEl = document.getElementById('detail-content');
    var galleryEl = document.getElementById('detail-gallery');

    var title = data['title_' + currentLang] || data.title_en || '';
    var desc = data['description_' + currentLang] || data.description_en || '';

    if (titleEl) titleEl.textContent = title;
    if (contentEl) contentEl.innerHTML = desc;

    if (galleryEl) {
        galleryEl.innerHTML = '';
        var imgs = data.images || [];
        if (typeof imgs === 'string') { try { imgs = JSON.parse(imgs); } catch(e) { imgs = []; } }
        imgs.forEach((src, i) => {
            var img = document.createElement('img');
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
    var lb = document.getElementById('lightbox');
    var img = document.getElementById('lightbox-image');
    if (!lb || !img) return;
    img.src = images[index];
    var cur = document.getElementById('lightbox-current');
    var tot = document.getElementById('lightbox-total');
    if (cur) cur.textContent = index + 1;
    if (tot) tot.textContent = images.length;
    lb.classList.add('active');
}

function initLightbox() {
    var lb = document.getElementById('lightbox');
    if (!lb) return;
    var closeBtn = lb.querySelector('.lightbox-close');
    var prevBtn = lb.querySelector('.lightbox-prev');
    var nextBtn = lb.querySelector('.lightbox-next');
    if (closeBtn) closeBtn.onclick = () => { lb.classList.remove('active'); document.body.style.overflow = ''; };
    if (prevBtn) prevBtn.onclick = () => navLightbox(-1);
    if (nextBtn) nextBtn.onclick = () => navLightbox(1);
    lb.onclick = (e) => { if (e.target === lb) { lb.classList.remove('active'); document.body.style.overflow = ''; } };
}

function navLightbox(dir) {
    if (lightboxImages.length === 0) return;
    lightboxIndex = (lightboxIndex + dir + lightboxImages.length) % lightboxImages.length;
    var img = document.getElementById('lightbox-image');
    var cur = document.getElementById('lightbox-current');
    if (img) img.src = lightboxImages[lightboxIndex];
    if (cur) cur.textContent = lightboxIndex + 1;
}

function initLightboxTriggers() {
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.onclick = () => {
            var card = btn.closest('.product-image');
            if (!card) return;
            try {
                var imgs = JSON.parse(card.dataset.images);
                openLightbox(imgs, 0);
            } catch(e) {}
        };
    });
}

// ==================== KEYBOARD ====================

function initKeyboard() {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            var lb = document.getElementById('lightbox');
            if (lb && lb.classList.contains('active')) { lb.classList.remove('active'); document.body.style.overflow = ''; return; }
            var active = document.querySelector('.modal.active');
            if (active) closeModal(active);
        }
        var lb2 = document.getElementById('lightbox');
        if (lb2 && lb2.classList.contains('active')) {
            if (e.key === 'ArrowLeft') navLightbox(-1);
            if (e.key === 'ArrowRight') navLightbox(1);
        }
    });
}

// ==================== WIFI ====================

function initWiFi() {
    var btn = document.getElementById('wifi-connect-btn');
    if (btn) btn.onclick = () => openModal('wifi');
    var copyBtn = document.getElementById('wifi-copy-btn');
    if (copyBtn) {
        copyBtn.onclick = () => {
            navigator.clipboard.writeText('094146454').then(() => {
                var span = copyBtn.querySelector('span');
                if (span) {
                    var original = span.textContent;
                    span.textContent = (translations[currentLang] && translations[currentLang].copied) || 'Copied!';
                    setTimeout(() => { span.textContent = original; }, 2000);
                }
            }).catch(() => {});
        };
    }
}

// ==================== CONTACT ====================

function initContactModal() {
    var otherBtn = document.getElementById('contact-other-btn');
    var otherDetails = document.getElementById('contact-other-details');
    if (otherBtn && otherDetails) {
        otherBtn.onclick = () => {
            otherDetails.style.display = otherDetails.style.display === 'none' ? 'block' : 'none';
        };
    }
}

// ==================== HOUSEKEEPING (CODE SYSTEM) ====================

// Generate 6-digit code
function generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Switch between Call and Rate tabs
window.switchHkTab = function(tab) {
    var callView = document.getElementById('hk-call-view');
    var rateView = document.getElementById('hk-rate-view');
    var tabCall = document.getElementById('hk-tab-call');
    var tabRate = document.getElementById('hk-tab-rate');
    if (tab === 'call') {
        callView.style.display = 'flex';
        rateView.style.display = 'none';
        tabCall.style.background = 'var(--color-primary)';
        tabCall.style.color = 'white';
        tabCall.style.border = 'none';
        tabRate.style.background = 'var(--color-glass)';
        tabRate.style.color = 'var(--color-text)';
        tabRate.style.border = '1px solid var(--color-glass-border)';
    } else {
        callView.style.display = 'none';
        rateView.style.display = 'flex';
        tabRate.style.background = 'var(--color-primary)';
        tabRate.style.color = 'white';
        tabRate.style.border = 'none';
        tabCall.style.background = 'var(--color-glass)';
        tabCall.style.color = 'var(--color-text)';
        tabCall.style.border = '1px solid var(--color-glass-border)';
    }
};

// Send Telegram notification
async function sendTelegramNotification(room, code) {
    var text = '🧹 *Housekeeping Requested*\nRoom: *' + room + '*\nCode: `' + code + '`';
    var url = 'https://api.telegram.org/bot' + TG_BOT_TOKEN + '/sendMessage';
    for (var i = 0; i < TG_CHAT_IDS.length; i++) {
        try {
            await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: TG_CHAT_IDS[i],
                    text: text,
                    parse_mode: 'Markdown'
                })
            });
        } catch (e) {
            console.error('Telegram error:', e);
        }
    }
}

// Call Housekeeping
window.callHousekeeping = async function() {
    var roomInput = document.getElementById('hk-room');
    var room = roomInput ? roomInput.value.trim() : '';
    if (!room) { alert('Please enter your room number!'); return; }
    if (!supabaseClient) { alert('Connection error. Try again later.'); return; }

    var code = generateCode();
    var submitBtn = document.getElementById('hk-submit-btn');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending...'; }

    try {
        // Save to database
        var { error } = await supabaseClient.from('housekeeping_requests').insert([{ room_number: room, code: code }]);
        if (error) { alert('Error: ' + error.message); return; }

        // Send Telegram notification
        await sendTelegramNotification(room, code);

        // Show success + code
        var msgDiv = document.getElementById('hk-msg');
        var codeDisplay = document.getElementById('hk-code-display');
        if (codeDisplay) codeDisplay.textContent = code;
        if (msgDiv) msgDiv.style.display = 'block';
        if (roomInput) roomInput.style.display = 'none';
        if (submitBtn) submitBtn.style.display = 'none';
    } catch (e) {
        console.error('Housekeeping error:', e);
        alert('Error sending request. Please try again.');
    } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Call Now'; }
    }
};

// Rate Housekeeping
window.rateHousekeeping = async function() {
    var codeInput = document.getElementById('hk-rate-code');
    var starsSelect = document.getElementById('hk-rate-stars');
    var commentInput = document.getElementById('hk-rate-comment');
    var errDiv = document.getElementById('hk-rate-err');
    var msgDiv = document.getElementById('hk-rate-msg');
    if (errDiv) { errDiv.style.display = 'none'; errDiv.textContent = ''; }

    var code = codeInput ? codeInput.value.trim() : '';
    if (!code || code.length !== 6) {
        if (errDiv) { errDiv.textContent = 'Please enter a valid 6-digit code.'; errDiv.style.display = 'block'; }
        return;
    }

    if (!supabaseClient) { alert('Connection error.'); return; }

    // Verify code exists
    var { data: requests } = await supabaseClient.from('housekeeping_requests').select('id').eq('code', code);
    if (!requests || requests.length === 0) {
        if (errDiv) { errDiv.textContent = 'Invalid code. Please check and try again.'; errDiv.style.display = 'block'; }
        return;
    }

    // Check if already rated
    var { data: existing } = await supabaseClient.from('housekeeping_ratings').select('id').eq('code', code);
    if (existing && existing.length > 0) {
        if (errDiv) { errDiv.textContent = 'This code has already been used for rating.'; errDiv.style.display = 'block'; }
        return;
    }

    var rating = starsSelect ? parseInt(starsSelect.value) : 5;
    var comment = commentInput ? commentInput.value : '';

    var { error } = await supabaseClient.from('housekeeping_ratings').insert([{ code: code, rating: rating, comment: comment }]);
    if (error) {
        if (errDiv) { errDiv.textContent = 'Error: ' + error.message; errDiv.style.display = 'block'; }
        return;
    }

    if (msgDiv) msgDiv.style.display = 'block';
    if (codeInput) codeInput.disabled = true;
    if (starsSelect) starsSelect.disabled = true;
    if (commentInput) commentInput.disabled = true;
};

// ==================== VIDEO ====================

function initVideo() {
    var video = document.getElementById('bg-video');
    if (!video) return;
    video.play().catch(() => {});
    video.onerror = () => { video.style.display = 'none'; };
}

// ==================== LOGO ANIMATION ====================

function initLogoAnimation() {
    var letters = document.querySelectorAll('.logo-svg-text .logo-letter');
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
    initSupabaseFeatures();
});
