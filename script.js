/**
 * Garden Inn Resort - Frontend JavaScript V4
 * Housekeeping codes, multi-lang content, Telegram notifications
 */

// ==================== SUPABASE ====================
const ROOT_SUPABASE_URL = 'https://klnxybjaaxtlfabnzxcd.supabase.co';
const ROOT_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtsbnh5YmphYXh0bGZhYm56eGNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NjA2MjksImV4cCI6MjA4OTQzNjYyOX0.uUAxzL-8nBkgqoYkQg74Ych0BzKFBVcN_IJlqoZ8tQM';
// Expose globally so bookings.js (IIFE) can access them
window.ROOT_SUPABASE_URL = ROOT_SUPABASE_URL;
window.ROOT_SUPABASE_KEY = ROOT_SUPABASE_KEY;
window.supabaseUrl = ROOT_SUPABASE_URL;
const supabaseClient = window.supabase ? window.supabase.createClient(ROOT_SUPABASE_URL, ROOT_SUPABASE_KEY) : null;
window.supabaseClient = supabaseClient;

// Dynamic notification recipients (loaded from DB)
let notificationRecipients = { telegram: [], email: [] };

// ==================== TRANSLATIONS (UI buttons/labels - hardcoded) ====================
let translations = {
    en: { welcome: "Welcome", tagline: "Garden Inn Resort & Spa", services: "Services", rules: "Rules", minibar: "Mini Bar", tours: "Tours", housekeeping: "Housekeeping", contact: "Get in Touch", contactMenu: "Contact Us", wifiMenu: "WiFi", otherContact: "Other", otherMethodsTitle: "Other Methods", more: "More", gallery: "Gallery", price: "Price", about: "Garden Inn Resort offers luxury in a private paradise.", copied: "Copied!", wifi: "WiFi", network: "Network:", password: "Password:", copy: "Copy", wifiInstructions: "Scan QR or enter password.", hkTabCall: "Call", hkTabRate: "Rate", hkRoomLabel: "Room Number", hkRoomPlaceholder: "Enter your room number", hkCallNow: "Call Now", hkSending: "Sending...", hkSuccessTitle: "Request sent! Staff notified.", hkYourCode: "Your code:", hkCodeHint: "Save this code to rate our housekeeping service later.", hkEnterCode: "Enter your 6-digit code", hkHowWas: "How was the cleaning?", hkCommentLabel: "Comments (optional)", hkCommentPlaceholder: "Tell us about your experience...", hkSubmitRating: "Submit Rating", hkThanks: "Thank you for your feedback!", hkBannerTitle: "Housekeeping", hkBannerText: "Staff has accepted your request and is on the way.", hkAlertRoom: "Please enter your room number!", hkAlertConnection: "Connection error. Try again later.", hkAlertError: "Error sending request. Please try again.", hkInvalidCode: "Please enter a valid 6-digit code.", hkCodeNotFound: "Invalid code. Please check and try again.", hkAlreadyRated: "This code has already been used for rating.", bookingFormTitle: "Book Service", bookingHowItWorks: "📋 How it works", bookingStep1: "Fill in your details below", bookingStep2: "Our staff will review your request", bookingStep3: "You'll receive a notification with the result", bookingGuestName: "👤 Your Name", bookingNamePlaceholder: "Enter your name", bookingDate: "📅 Select Date", bookingTime: "🕐 Select Time", bookingTimeFrom: "FROM", bookingTimeTo: "TO", bookingSubmit: "Book Now", bookingHint: "💡 You will be notified on this page once your booking is approved or rejected.", bookingSuccess: "Booking submitted! We will notify you once it's reviewed.", hkHowItWorks: "📋 How it works", hkStep1: "Click \"Call Now\" to request room cleaning", hkStep2: "Staff will receive your request immediately", hkStep3: "You will get a notification when staff is on the way", hkHint: "You will be notified once the staff accepts your request.", myBookings: "My Bookings", myBookingsEmpty: "You have no active bookings yet.", noBookingsYet: "No bookings yet", bookingConfirmTitle: "Do you want to book this service?", bookingPickupTime: "PICKUP", bookingPickupTimeLabel: "Pickup Time", approved: "Approved", pending: "Pending", rejected: "Rejected", cancelled: "Cancelled", hotDeals: "HOT DEAL", hotDealsTitle: "🔥 Hot Deals", hotDealsEmpty: "No active deals right now. Check back later!" },
    ru: { welcome: "Добро пожаловать", tagline: "Garden Inn Resort & Spa", services: "Услуги", rules: "Правила", minibar: "Мини-бар", tours: "Туры", housekeeping: "Уборка", contact: "Связаться", contactMenu: "Контакты", wifiMenu: "WiFi", otherContact: "Другое", otherMethodsTitle: "Другие способы", more: "Подробнее", gallery: "Галерея", price: "Цена", about: "Garden Inn Resort — роскошный отдых в райском уголке с живописными садами.", copied: "Скопировано!", wifi: "WiFi", network: "Сеть:", password: "Пароль:", copy: "Копировать", wifiInstructions: "Отсканируйте QR-код или введите пароль вручную.", hkTabCall: "Вызвать", hkTabRate: "Оценить", hkRoomLabel: "Номер комнаты", hkRoomPlaceholder: "Введите номер комнаты", hkCallNow: "Вызвать", hkSending: "Отправка...", hkSuccessTitle: "Запрос отправлен! Персонал уведомлен.", hkYourCode: "Ваш код:", hkCodeHint: "Сохраните этот код, чтобы оценить уборку позже.", hkEnterCode: "Введите 6-значный код", hkHowWas: "Как была уборка?", hkCommentLabel: "Комментарий (необязательно)", hkCommentPlaceholder: "Расскажите о вашем опыте...", hkSubmitRating: "Отправить оценку", hkThanks: "Спасибо за ваш отзыв!", hkBannerTitle: "Уборка", hkBannerText: "Персонал принял ваш запрос и уже в пути.", hkAlertRoom: "Пожалуйста, введите номер комнаты!", hkAlertConnection: "Ошибка соединения. Попробуйте позже.", hkAlertError: "Ошибка отправки запроса. Попробуйте снова.", hkInvalidCode: "Пожалуйста, введите корректный 6-значный код.", hkCodeNotFound: "Неверный код. Проверьте и попробуйте снова.", hkAlreadyRated: "Этот код уже был использован для оценки.", bookingFormTitle: "Бронирование услуги", bookingHowItWorks: "📋 Как это работает", bookingStep1: "Заполните свои данные ниже", bookingStep2: "Наш персонал рассмотрит ваш запрос", bookingStep3: "Вы получите уведомление с результатом", bookingGuestName: "👤 Ваше Имя", bookingNamePlaceholder: "Введите ваше имя", bookingDate: "📅 Выберите дату", bookingTime: "🕐 Выберите время", bookingTimeFrom: "С", bookingTimeTo: "ДО", bookingSubmit: "Забронировать", bookingHint: "💡 Вы получите уведомление на этой странице, как только ваше бронирование будет подтверждено или отклонено.", bookingSuccess: "Бронирование отправлено! Мы уведомим вас после проверки.", hkHowItWorks: "📋 Как это работает", hkStep1: "Нажмите \"Вызвать\", чтобы запросить уборку номера", hkStep2: "Персонал немедленно получит ваш запрос", hkStep3: "Вы получите уведомление, когда персонал будет в пути", hkHint: "Вы получите уведомление, как только персонал примет ваш запрос.", myBookings: "Мои брони", myBookingsEmpty: "У вас нет активных бронирований.", noBookingsYet: "У вас нет броней", bookingConfirmTitle: "Хотите забронировать эту услугу?", bookingPickupTime: "ВЫЕЗД", bookingPickupTimeLabel: "Время выезда", approved: "Одобрено", pending: "Ожидание", rejected: "Отклонено", cancelled: "Отменено", hotDeals: "ПРЕДЛОЖЕНИЯ", hotDealsTitle: "🔥 Горячие предложения", hotDealsEmpty: "Сейчас нет активных предложений. Загляните позже!" },
    hy: { welcome: "Բարի գալուստ", tagline: "Garden Inn Resort & Spa", services: "Ծառայություններ", rules: "Կանոններ", minibar: "Մինի-բար", tours: "Տուրեր", housekeeping: "Մաքրություն", contact: "Կապ", contactMenu: "Կապ մեզ հետ", wifiMenu: "WiFi", otherContact: "Այլ", otherMethodsTitle: "Այլ եղանակներ", more: "Ավելին", gallery: "Պատկերասրահ", price: "Գին", about: "Garden Inn Resort — շքեղ հանգիստ գեղեցիկ այգիներով։", copied: "Պատճենվեց!", wifi: "WiFi", network: "Ցանց՝", password: "Գաղտնաբառ՝", copy: "Պատճենել", wifiInstructions: "Սկանավորեք QR կոդը կամ մուտքագրեք գաղտնաբառը։", hkTabCall: "Կանչել", hkTabRate: "Գնահատել", hkRoomLabel: "Սենյակի համար", hkRoomPlaceholder: "Մուտքագրեք սենյակի համարը", hkCallNow: "Կանչել", hkSending: "Ուղարկվում է...", hkSuccessTitle: "Հարցումը ուղարկվեց! Անձնակազմը տեղեկացվեց։", hkYourCode: "Ձեր կոդը՝", hkCodeHint: "Պահեք այս կոդը՝ հետո մաքրությունը գնահատելու համար։", hkEnterCode: "Մուտքագրեք 6-նիշ կոդը", hkHowWas: "Ինչպես էր մաքրությունը։", hkCommentLabel: "Մեկնաբանություն (կամավոր)", hkCommentPlaceholder: "Պատմեք ձեր փորձի մասին...", hkSubmitRating: "Ուղարկել գնահատականը", hkThanks: "Շնորհակալություն ձեր կարծիքի համար!", hkBannerTitle: "Մաքրություն", hkBannerText: "Անձնակազմը ընդունել է ձեր հարցումը և արդեն ճանապարհին է։", hkAlertRoom: "Խնդրում ենք, մուտքագրեք սենյակի համարը!", hkAlertConnection: "Կապի սխալ։ Փորձեք ավելի ուշ.", hkAlertError: "Սխալ հարցում ուղարկելիս։ Փորձեք կրկին։", hkInvalidCode: "Խնդրում ենք, մուտքագրեք ճիշտ 6-նիշ կոդ։", hkCodeNotFound: "Սխալ կոդ։ Ստուգեք և նորից փորձեք։", hkAlreadyRated: "Այս կոդը արդեն օգտագործվել է գնահատման համար։", bookingFormTitle: "Ծառայության ամրագրում", bookingHowItWorks: "📋 Ինչպես է սա աշխատում", bookingStep1: "Լրացրեք ձեր տվյալները ստորև", bookingStep2: "Մեր անձնակազմը կքննարկի ձեր հարցումը", bookingStep3: "Դուք կստանաք ծանուցում արդյունքի վերաբերյալ", bookingGuestName: "👤 Ձեր Անունը", bookingNamePlaceholder: "Մուտքագրեք ձեր անունը", bookingDate: "📅 Ընտրեք ամսաթիվը", bookingTime: "🕐 Ընտրեք ժամանակը", bookingTimeFrom: "ՍԿՍԱԾ", bookingTimeTo: "ՄԻՆՉԵՎ", bookingSubmit: "Ամրագրել հիմա", bookingHint: "💡 Դուք կծանուցվեք այս էջում, երբ ձեր ամրագրումը հաստատվի կամ մերժվի:", bookingSuccess: "Ամրագրումը ուղարկված է։ Մենք կտեղեկացնենք ձեզ ստուգումից հետո:", hkHowItWorks: "📋 Ինչպես է սա աշխատում", hkStep1: "Սեղմեք «Կանչել» սենյակի մաքրում պատվիրելու համար", hkStep2: "Անձնակազմը անմիջապես կստանա ձեր հարցումը", hkStep3: "Դուք ծանուցում կստանաք, երբ անձնակազմը ճանապարհին լինի", hkHint: "Դուք կծանուցվեք, հենց որ անձնակազմը ընդունի ձեր հարցումը:", myBookings: "Իմ ամրագրումները", myBookingsEmpty: "Դուք չունեք ակտիվ ամրագրումներ:", noBookingsYet: "Դեռ ամրագրումներ չկան", bookingConfirmTitle: "Ցանկանու՞մ եք ամրագրել այս ծառայությունը", bookingPickupTime: "ՄԵԿՆՈՒՄ", bookingPickupTimeLabel: "Մեկնման ժամ", approved: "Հաստատված է", pending: "Սպասում է", rejected: "Մերժված է", cancelled: "Չեղարկված է", hotDeals: "ԱՌԱՋԱՐԿՆԵՐ", hotDealsTitle: "🔥 Թեժ Առաջարկներ", hotDealsEmpty: "Այս պահին ակտիվ առաջարկներ չկան։" }
};

// ==================== STATE ====================
let currentLang = 'en';
let currentTheme = 'dark';
let dynamicServices = [];
let dynamicTours = [];
let lightboxImages = [];
let lightboxIndex = 0;
let dynamicMinibar = [];
let dynamicHotDeals = [];

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
        if (!data || data.length === 0) return;
        dynamicMinibar = data;
        renderMinibar();
    } catch (e) { console.error('Minibar error:', e); }
}

function renderMinibar() {
    const container = document.querySelector('.products-grid');
    if (!container || !dynamicMinibar || dynamicMinibar.length === 0) return;
    container.innerHTML = '';
    dynamicMinibar.forEach(item => {
        let priceHtml = item.price + ' AMD';
        let badgeHtml = '';
        if (typeof dynamicHotDeals !== 'undefined') {
            let deal = dynamicHotDeals.find(d => d.reference_id === item.id && d.type === 'discount' && d.is_active);
            if (deal) {
                let displayP = (deal.new_price || '🔥 Sale').split('\n')[0];
                priceHtml = '<span style="text-decoration:line-through; font-size:0.8em; color:#7f8fa6;">' + item.price + ' AMD</span> <br><span style="color:#4cd137; font-weight:bold;">' + displayP + '</span>';
                badgeHtml = '<div style="position:absolute; top:8px; left:8px; background:#ff4757; color:#fff; padding:2px 6px; border-radius:4px; font-size:10px; font-weight:bold; z-index:2;">🔥 % SALE</div>';
            }
        }
        const article = document.createElement('article');
        article.className = 'product-card';
        article.style.position = 'relative';
        article.innerHTML = badgeHtml + '<div class="product-image" data-images=\'["' + item.image_url + '"]\'>' +
            '<img src="' + item.image_url + '" alt="' + item.name + '" loading="lazy" onerror="this.style.display=\'none\'">' +
            '<div class="product-overlay"><button class="view-btn">&#128065;</button></div>' +
            '</div>' +
            '<div class="product-info"><h4>' + item.name + '</h4><p class="price" style="line-height:1.2; margin-top:4px;">' + priceHtml + '</p></div>';
        container.appendChild(article);
    });
    initLightboxTriggers();
}

async function loadServices() {
    if (!supabaseClient) return;
    try {
        const { data } = await supabaseClient.from('services').select('*');
        if (!data) return;
        dynamicServices = data;
        renderServices();
    } catch (e) { console.error('Services error:', e); }
}

function renderServices() {
    const container = document.querySelector('#services-modal .services-grid');
    if (!container || !dynamicServices) return;
    container.innerHTML = '';
    dynamicServices.forEach(item => {
        var title = item['title_' + currentLang] || item.title_en || '';
        let statusHtml = '<span class="status ' + item.status_type + '">' + item.status_type.toUpperCase() + '</span>';
        
        if (typeof dynamicHotDeals !== 'undefined') {
            let deal = dynamicHotDeals.find(d => d.reference_id === item.service_key && d.type === 'discount' && d.is_active);
            if (deal) {
                let displayP = (deal.new_price || 'SALE').split('\n')[0];
                statusHtml = '<span class="status paid" style="background:rgba(231,76,60,0.2); color:#e74c3c; font-weight:bold; letter-spacing:0.5px;">🔥 ' + displayP + '</span>';
            }
        }

        var article = document.createElement('article');
        article.className = 'service-card';
        article.dataset.service = item.service_key;
        if (item.is_paid) article.dataset.isPaid = 'true';
        
        article.innerHTML = '<div class="service-icon">' + item.icon + '</div>' +
            '<h3>' + title + '</h3>' +
            statusHtml +
            '<button class="more-btn">' + (translations[currentLang].more || 'More') + '</button>';
        container.appendChild(article);
    });
    container.querySelectorAll('.more-btn').forEach(btn => {
        btn.onclick = () => openDetail(btn.closest('.service-card').dataset.service);
    });
}

async function loadTours() {
    if (!supabaseClient) return;
    try {
        const { data } = await supabaseClient.from('tours').select('*');
        if (!data) return;
        dynamicTours = data;
        renderTours();
    } catch (e) { console.error('Tours error:', e); }
}

function renderTours() {
    const container = document.querySelector('#tours-modal .services-grid');
    if (!container || !dynamicTours) return;
    container.innerHTML = '';
    dynamicTours.forEach(item => {
        var title = item['title_' + currentLang] || item.title_en || '';
        let statusHtml = '<span class="status paid" style="text-transform: none;">' + item.price + '</span>';
        
        if (typeof dynamicHotDeals !== 'undefined') {
            let deal = dynamicHotDeals.find(d => d.reference_id === item.tour_key && d.type === 'discount' && d.is_active);
            if (deal) {
                let displayP = (deal.new_price || 'SALE').split('\n')[0];
                statusHtml = '<span class="status paid" style="background:rgba(231,76,60,0.2); color:#e74c3c; font-weight:bold; letter-spacing:0.5px;">🔥 ' + displayP + '</span>';
            }
        }

        var article = document.createElement('article');
        article.className = 'service-card';
        article.dataset.service = item.tour_key;
        article.innerHTML = '<div class="service-icon">' + item.icon + '</div>' +
            '<h3>' + title + '</h3>' +
            statusHtml +
            '<button class="more-btn">' + (translations[currentLang].more || 'More') + '</button>';
        container.appendChild(article);
    });
    container.querySelectorAll('.more-btn').forEach(btn => {
        btn.onclick = () => openDetail(btn.closest('.service-card').dataset.service);
    });
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
    loadHotDeals();
}

function updateTexts() {
    var t = translations[currentLang] || translations.en;
    document.querySelectorAll('[data-key]').forEach(el => {
        var key = el.dataset.key;
        if (el.classList.contains('price')) return;
        if (t[key]) el.innerHTML = t[key];
    });
    // Translate placeholders
    document.querySelectorAll('[data-placeholder-key]').forEach(el => {
        var pKey = el.dataset.placeholderKey;
        if (t[pKey]) el.placeholder = t[pKey];
    });
    document.title = 'Garden Inn Resort | ' + (t.tagline || 'Resort');
    
    // Update "My Bookings" button text specifically
    if (window.updateMyBookingsButton) window.updateMyBookingsButton();
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
    if (modal) { 
        // If there's already an active modal, close it first
        var activeModals = document.querySelectorAll('.modal.active');
        activeModals.forEach(function(m) {
            if (m !== modal) closeModal(m);
        });

        modal.classList.add('active'); 
        document.body.style.overflow = 'hidden'; 
    }
}

function closeModal(modal) {
    if (modal) { 
        modal.classList.remove('active');
        document.body.style.overflow = ''; 
    }
}

function initModals() {
    document.querySelectorAll('.nav-btn[data-modal]').forEach(btn => {
        if (btn.dataset.modal === 'my-bookings') {
            btn.onclick = () => { if (window.openMyBookings) window.openMyBookings(); };
        } else {
            btn.onclick = () => openModal(btn.dataset.modal);
        }
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

    // Append price info if it exists
    var priceInfo = '';
    let deal = null;
    if (typeof dynamicHotDeals !== 'undefined') {
        deal = dynamicHotDeals.find(d => (d.reference_id === serviceKey || d.reference_id === data.id) && d.type === 'discount' && d.is_active);
    }
    
    if (deal) {
        var formattedPrice = data.price ? data.price.replace(/\n/g, '<br>') : '';
        var dealTitle = deal['title_' + currentLang] || deal.title_en || 'Discount!';
        priceInfo = '<div class="detail-price-box" style="margin-top: 16px; padding: 12px; background: rgba(26, 188, 156, 0.05); border: 1px solid rgba(255, 71, 87, 0.4); border-radius: 8px; font-weight: 500;">';
        if (formattedPrice) {
            priceInfo += '<div style="text-decoration:line-through; opacity:0.6; font-size:0.9em; margin-bottom: 8px;">' + formattedPrice + '</div>';
        }
        priceInfo += '<div style="color:#ff4757; font-size:1.1em; font-weight:bold; margin-bottom:10px;">🔥 ' + dealTitle + '</div>';
        
        if (deal.new_price) {
            let oldLines = (deal.old_price || '').split('\n');
            let newLines = (deal.new_price || '').split('\n');
            let maxLines = Math.max(oldLines.length, newLines.length);
            
            priceInfo += '<div style="display:flex; flex-direction:column; gap:6px;">';
            for (let i = 0; i < maxLines; i++) {
                let oPrice = oldLines[i];
                let nPrice = newLines[i];
                if (!oPrice && !nPrice) continue;
                // Centre the price items and use a bottom border for a clean, centered list look
                priceInfo += '<div style="display:flex; flex-direction:column; align-items:center; background:rgba(0,0,0,0.1); padding:8px 12px; border-radius:6px; border-bottom: 2px solid #ff4757;">';
                if (oPrice) priceInfo += '<span style="text-decoration:line-through; opacity:0.6; font-size:0.85em; margin-bottom:2px;">' + oPrice + '</span>';
                if (nPrice) priceInfo += '<span style="color:#4cd137; font-size:1.05em; font-weight:bold;">' + nPrice + '</span>';
                priceInfo += '</div>';
            }
            priceInfo += '</div>';
        }
        priceInfo += '</div>';
    } else if (data.price) {
        var formattedPrice = data.price.replace(/\n/g, '<br>');
        priceInfo = '<div class="detail-price-box" style="margin-top: 16px; padding: 12px; background: rgba(26, 188, 156, 0.1); border: 1px dashed var(--color-primary); border-radius: 8px; color: var(--color-primary-light); font-weight: 500;">' + formattedPrice + '</div>';
    }

    if (titleEl) titleEl.textContent = title;
    if (contentEl) {
        contentEl.innerHTML = desc + priceInfo;
        
        // Add booking button if paid or if it's a tour
        if (data.is_paid || data.tour_key) {
            var sName = data['title_' + currentLang] || data.title_en || '';
            var bookBtn = document.createElement('button');
            bookBtn.className = 'hk-submit-btn';
            bookBtn.style.marginTop = '24px';
            var t = translations[currentLang] || translations.en;
            bookBtn.innerHTML = '<span>📅</span> <span>' + (t.bookingSubmit || 'Book Now') + '</span>';
            bookBtn.onclick = () => {
                closeModal(document.getElementById('detail-modal'));
                var type = data.tour_key ? 'tour' : 'service';
                if (window.showBookingConfirm) window.showBookingConfirm(data.id, sName, data.has_calendar, type);
            };
            contentEl.appendChild(bookBtn);
        }
    }

    if (galleryEl) {
        galleryEl.innerHTML = '';
        var imgs = data.images || [];
        if (typeof imgs === 'string') { try { imgs = JSON.parse(imgs); } catch (e) { imgs = []; } }
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
    
    var prevBtn = lb.querySelector('.lightbox-prev');
    var nextBtn = lb.querySelector('.lightbox-next');
    var counter = lb.querySelector('.lightbox-counter');
    if (images.length <= 1) {
        if (prevBtn) prevBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';
        if (counter) counter.style.display = 'none';
    } else {
        if (prevBtn) prevBtn.style.display = 'flex';
        if (nextBtn) nextBtn.style.display = 'flex';
        if (counter) counter.style.display = 'block';
    }
    
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
            } catch (e) { }
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
            }).catch(() => { });
        };
    }
}

// ==================== QR CODE ====================

function initQRCode() {
    var container = document.getElementById('wifi-qr-container');
    if (!container || typeof QRCode === 'undefined') return;
    container.innerHTML = '';
    var wifiString = 'WIFI:T:WPA;S:Rostelecom_23488;P:094146454;;';
    new QRCode(container, {
        text: wifiString,
        width: 180,
        height: 180,
        colorDark: '#1b3323',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M
    });
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
window.switchHkTab = function (tab) {
    var callView = document.getElementById('hk-call-view');
    var rateView = document.getElementById('hk-rate-view');
    var tabCall = document.getElementById('hk-tab-call');
    var tabRate = document.getElementById('hk-tab-rate');
    if (tab === 'call') {
        callView.style.display = 'flex';
        rateView.style.display = 'none';
        tabCall.classList.add('active');
        tabRate.classList.remove('active');
    } else {
        callView.style.display = 'none';
        rateView.style.display = 'flex';
        tabRate.classList.add('active');
        tabCall.classList.remove('active');
    }
};

// Load notification recipients from DB
async function loadNotificationRecipients() {
    if (!supabaseClient) return;
    try {
        var { data } = await supabaseClient.from('notification_recipients').select('*').eq('enabled', true);
        if (!data) return;
        notificationRecipients = { telegram: [], email: [] };
        data.forEach(function(r) {
            if (r.type === 'telegram') notificationRecipients.telegram.push(r.value);
            if (r.type === 'email') notificationRecipients.email.push({ address: r.value, label: r.label || '' });
        });
    } catch (e) { console.error('Failed to load notification recipients:', e); }
}


// Send Email notification via Supabase Edge Function
async function sendEmailNotification(room) {
    var emails = notificationRecipients.email;
    if (emails.length === 0) return;
    var recipients = emails.map(function(e) { return e.address; });
    try {
        await fetch(ROOT_SUPABASE_URL + '/functions/v1/send-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + ROOT_SUPABASE_KEY
            },
            body: JSON.stringify({
                to: recipients,
                subject: '🧹 Housekeeping Request — Room ' + room,
                body: 'A guest in Room ' + room + ' has requested housekeeping service.\n\nPlease attend to this request as soon as possible.\n\n— Garden Inn Resort System'
            })
        });
    } catch (e) {
        console.error('Email notification error:', e);
    }
}

// Send Telegram notification via Supabase Edge Function
async function sendTelegramNotification(room, id) {
    try {
        await fetch(ROOT_SUPABASE_URL + '/functions/v1/telegram-bot', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + ROOT_SUPABASE_KEY
            },
            body: JSON.stringify({
                type: 'INSERT',
                table: 'housekeeping_requests',
                record: {
                    id: id,
                    room_number: room
                }
            })
        });
    } catch (e) {
        console.error('Telegram notification error:', e);
    }
}

// Show toast notification on website
function showToast(message) {
    var existing = document.getElementById('hk-toast');
    if (existing) existing.remove();

    var toast = document.createElement('div');
    toast.id = 'hk-toast';
    toast.innerHTML = message;
    toast.style.cssText = 'position:fixed; top:20px; left:50%; transform:translateX(-50%); background:linear-gradient(135deg, #18bc9c, #1abc9c); color:white; padding:16px 32px; border-radius:12px; font-weight:bold; font-size:16px; z-index:99999; box-shadow:0 8px 32px rgba(0,0,0,0.3); animation:slideDown 0.5s ease; text-align:center; max-width:90%;';

    // Add animation CSS
    if (!document.getElementById('toast-styles')) {
        var style = document.createElement('style');
        style.id = 'toast-styles';
        style.textContent = '@keyframes slideDown{from{transform:translateX(-50%) translateY(-100px);opacity:0}to{transform:translateX(-50%) translateY(0);opacity:1}} @keyframes slideUp{from{transform:translateX(-50%) translateY(0);opacity:1}to{transform:translateX(-50%) translateY(-100px);opacity:0}}';
        document.head.appendChild(style);
    }

    document.body.appendChild(toast);

    // Auto-remove after 8 seconds
    setTimeout(function () {
        toast.style.animation = 'slideUp 0.5s ease';
        setTimeout(function () { toast.remove(); }, 500);
    }, 8000);
}
window.showToast = showToast;

// Call Housekeeping
window.callHousekeeping = async function () {
    var room = window.getRoomNumber ? window.getRoomNumber() : '';
    var t = translations[currentLang] || translations.en;
    if (!room) { alert(t.hkAlertRoom || 'Room not detected. Please scan the QR code.'); return; }
    if (!supabaseClient) { alert(t.hkAlertConnection); return; }

    var code = generateCode();
    var submitBtn = document.getElementById('hk-submit-btn');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = t.hkSending; }

    try {
        // Save to database
        var { error, data } = await supabaseClient.from('housekeeping_requests')
            .insert([{ room_number: room, code: code }])
            .select('id').single();
        if (error) { alert('Error: ' + error.message); return; }

        // Save locally to listen for updates later
        localStorage.setItem('hk_pending_room', room);
        localStorage.setItem('hk_pending_id', data.id);

        // Send notifications (Email)
        await sendEmailNotification(room);

        // Send notifications (Telegram)
        await sendTelegramNotification(room, data.id);

        // Show success + code
        var msgDiv = document.getElementById('hk-msg');
        var codeDisplay = document.getElementById('hk-code-display');
        var infoCard = document.getElementById('hk-info-card');
        var hintLabel = document.getElementById('hk-form-hint');
        
        if (codeDisplay) codeDisplay.textContent = code;
        if (msgDiv) msgDiv.style.display = 'block';
        if (submitBtn) submitBtn.style.display = 'none';
        if (infoCard) infoCard.style.display = 'none';
        if (hintLabel) hintLabel.style.display = 'none';
    } catch (e) {
        console.error('Housekeeping error:', e);
        alert(t.hkAlertError);
    } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = '\uD83E\uDDF9 ' + t.hkCallNow; }
    }
};

// Rate Housekeeping
window.rateHousekeeping = async function () {
    var codeInput = document.getElementById('hk-rate-code');
    var starsSelect = document.getElementById('hk-rate-stars');
    var commentInput = document.getElementById('hk-rate-comment');
    var errDiv = document.getElementById('hk-rate-err');
    var msgDiv = document.getElementById('hk-rate-msg');
    if (errDiv) { errDiv.style.display = 'none'; errDiv.textContent = ''; }

    var code = codeInput ? codeInput.value.trim() : '';
    var t = translations[currentLang] || translations.en;
    if (!code || code.length !== 6) {
        if (errDiv) { errDiv.textContent = t.hkInvalidCode; errDiv.style.display = 'block'; }
        return;
    }

    if (!supabaseClient) { alert(t.hkAlertConnection); return; }

    // Verify code exists
    var { data: requests } = await supabaseClient.from('housekeeping_requests').select('id').eq('code', code);
    if (!requests || requests.length === 0) {
        if (errDiv) { errDiv.textContent = t.hkCodeNotFound; errDiv.style.display = 'block'; }
        return;
    }

    // Check if already rated
    var { data: existing } = await supabaseClient.from('housekeeping_ratings').select('id').eq('code', code);
    if (existing && existing.length > 0) {
        if (errDiv) { errDiv.textContent = t.hkAlreadyRated; errDiv.style.display = 'block'; }
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
    video.play().catch(() => { });
    video.onerror = () => { video.style.display = 'none'; };
}

// ==================== LOGO ANIMATION ====================

function initLogoAnimation() {
    // Animate leaf petals sequentially from bottom
    var leaves = document.querySelectorAll('#logo-img .leaf');
    leaves.forEach(function(leaf, i) {
        leaf.style.animationDelay = (i * 0.4) + 's';
    });

    // Animate text letters
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
    await loadNotificationRecipients();
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
            if (payload.table === 'hot_deals' || payload.table === 'app_settings') loadHotDeals();
            
            // Listen for housekeeping acceptance and completion
            if (payload.table === 'housekeeping_requests' && payload.eventType === 'UPDATE') {
                var newRec = payload.new;
                var pendingId = localStorage.getItem('hk_pending_id');
                var t = translations[currentLang] || translations.en;
                // If this is our request and it just got accepted
                if (pendingId && pendingId == newRec.id && newRec.status === 'accepted') {
                    showHousekeepingAcceptedBanner();
                    // Save id for completion tracking, but remove pending state
                    localStorage.setItem('hk_accepted_id', pendingId);
                    localStorage.removeItem('hk_pending_id');
                    localStorage.removeItem('hk_pending_room');
                }
                // If this is our request and cleaning is completed
                var acceptedId = localStorage.getItem('hk_accepted_id');
                if (acceptedId && acceptedId == newRec.id && newRec.status === 'completed') {
                    showHousekeepingCompletedBanner();
                    localStorage.removeItem('hk_accepted_id');
                }
            }
        })
        .subscribe();
}

// ==================== REALTIME BANNER LOGIC ====================

let titleFlashInterval = null;
const originalTitle = document.title;

function playNotificationSound() {
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
    } catch (e) { console.error("Audio API error:", e); }
}

function startTitleFlash() {
    if (titleFlashInterval) clearInterval(titleFlashInterval);
    var isAlt = false;
    titleFlashInterval = setInterval(() => {
        document.title = isAlt ? originalTitle : "🔔 1 Notification";
        isAlt = !isAlt;
    }, 1500);
}

function stopTitleFlash() {
    if (titleFlashInterval) clearInterval(titleFlashInterval);
    document.title = originalTitle;
}

window.dismissHousekeepingBanner = function() {
    var banner = document.getElementById('hk-realtime-banner');
    if (banner) {
        banner.classList.remove('show');
        setTimeout(() => banner.remove(), 600);
    }
    stopTitleFlash();
    localStorage.removeItem('hk_active_notification');
};

function showHousekeepingAcceptedBanner() {
    // Save to local storage so it persists if they reload the page
    localStorage.setItem('hk_active_notification', 'accepted');
    
    // Remove completed banner if exists
    var existingCompleted = document.getElementById('hk-completed-banner');
    if (existingCompleted) existingCompleted.remove();
    
    // Check if it already exists
    if (document.getElementById('hk-realtime-banner')) return;
    
    var banner = document.createElement('div');
    banner.id = 'hk-realtime-banner';
    banner.className = 'hk-notification-banner';
    var t = translations[currentLang] || translations.en;
    banner.innerHTML = `
        <div class="hk-banner-icon">🧹</div>
        <div class="hk-banner-content">
            <div class="hk-banner-title">${t.hkBannerTitle}</div>
            <div class="hk-banner-text">${t.hkBannerText}</div>
        </div>
        <button class="hk-banner-close" onclick="dismissHousekeepingBanner()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12" />
            </svg>
        </button>
    `;
    
    document.body.appendChild(banner);
    
    // Animate in
    setTimeout(() => {
        banner.classList.add('show');
        playNotificationSound();
        startTitleFlash();
    }, 100);
}

function showHousekeepingCompletedBanner() {
    localStorage.setItem('hk_active_notification', 'completed');
    
    // Remove accepted banner if exists
    dismissHousekeepingBanner();
    
    // Check if it already exists
    if (document.getElementById('hk-completed-banner')) return;
    
    var banner = document.createElement('div');
    banner.id = 'hk-completed-banner';
    banner.className = 'hk-notification-banner hk-completed-banner';
    var t = translations[currentLang] || translations.en;
    banner.innerHTML = `
        <div class="hk-banner-icon">✨</div>
        <div class="hk-banner-content">
            <div class="hk-banner-title">${t.hkCompletedTitle || 'Housekeeping'}</div>
            <div class="hk-banner-text">${t.hkCompletedText || 'Cleaning is complete! Enjoy your stay.'}</div>
        </div>
        <button class="hk-banner-close" onclick="dismissCompletedBanner()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12" />
            </svg>
        </button>
    `;
    
    document.body.appendChild(banner);
    
    setTimeout(() => {
        banner.classList.add('show');
        playNotificationSound();
        startTitleFlash();
    }, 100);
}

window.dismissCompletedBanner = function() {
    var banner = document.getElementById('hk-completed-banner');
    if (banner) {
        banner.classList.remove('show');
        setTimeout(() => banner.remove(), 600);
    }
    stopTitleFlash();
    localStorage.removeItem('hk_active_notification');
};

function checkPersistentNotification() {
    var notifState = localStorage.getItem('hk_active_notification');
    if (notifState === 'accepted' || notifState === 'true') {
        showHousekeepingAcceptedBanner();
    } else if (notifState === 'completed') {
        showHousekeepingCompletedBanner();
    }
}

// ==================== STAR RATING ====================

function initStarRating() {
    var container = document.getElementById('hk-star-rating');
    var hiddenInput = document.getElementById('hk-rate-stars');
    if (!container || !hiddenInput) return;

    var stars = container.querySelectorAll('.hk-star');
    stars.forEach(function(star) {
        star.addEventListener('click', function() {
            var val = parseInt(star.dataset.value);
            hiddenInput.value = val;
            stars.forEach(function(s) {
                s.classList.toggle('active', parseInt(s.dataset.value) <= val);
            });
        });
        star.addEventListener('mouseenter', function() {
            var val = parseInt(star.dataset.value);
            stars.forEach(function(s) {
                s.classList.toggle('active', parseInt(s.dataset.value) <= val);
            });
        });
    });
    container.addEventListener('mouseleave', function() {
        var currentVal = parseInt(hiddenInput.value);
        stars.forEach(function(s) {
            s.classList.toggle('active', parseInt(s.dataset.value) <= currentVal);
        });
    });
}
// ==================== HOT DEALS ====================

async function loadHotDeals() {
    if (!supabaseClient) return;
    try {
        // 1. Check if Hot Deals is globally enabled
        const { data: config } = await supabaseClient.from('app_settings')
            .select('value').eq('key', 'hot_deals_active').single();
        
        const isEnabled = config && config.value === 'true';
        const hotDealBtn = document.getElementById('hot-deals-wrap');
        
        if (!isEnabled && hotDealBtn) {
            hotDealBtn.style.display = 'none';
            dynamicHotDeals = [];
            if (typeof renderMinibar === 'function') renderMinibar();
            if (typeof renderServices === 'function') renderServices();
            if (typeof renderTours === 'function') renderTours();
            return;
        }

        // 2. Load active deals
        const { data: deals } = await supabaseClient.from('hot_deals')
            .select('*').eq('is_active', true).order('created_at', { ascending: false });
            
        dynamicHotDeals = deals || [];

        // Trigger updates so the badges reflect dynamically
        if (typeof renderMinibar === 'function') renderMinibar();
        if (typeof renderServices === 'function') renderServices();
        if (typeof renderTours === 'function') renderTours();

        if (hotDealBtn) {
            // Show button only if feature is active AND there is at least one active deal
            hotDealBtn.style.display = (dynamicHotDeals.length > 0) ? 'flex' : 'none';
        }

        const container = document.getElementById('hot-deals-list');
        const emptyState = document.getElementById('hot-deals-empty');
        const loadingState = document.getElementById('hot-deals-loading');
        if (!container) return;

        if (loadingState) loadingState.style.display = 'none';

        if (dynamicHotDeals.length === 0) {
            container.innerHTML = '';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';
        container.innerHTML = '';

        dynamicHotDeals.forEach(deal => {
            const title = deal['title_' + currentLang] || deal.title_en;
            const desc = deal['description_' + currentLang] || deal.description_en;
            let priceHtml = '';

            let displayOldPrice = (deal.old_price || '').split('\n')[0];
            let displayNewPrice = (deal.new_price || '').split('\n')[0];

            if (deal.type === 'discount' && displayOldPrice) {
                priceHtml = `
                    <div class="hot-deal-price-box" style="text-align:center; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px; width: 100%;">
                        <span class="hot-deal-old-price">${displayOldPrice}</span>
                        <span class="hot-deal-new-price">${displayNewPrice || 'FREE'}</span>
                    </div>
                `;
            } else if (displayNewPrice) {
                 priceHtml = `
                    <div class="hot-deal-price-box" style="text-align:center; display:flex; flex-direction:column; align-items:center; justify-content:center; width: 100%;">
                        <span class="hot-deal-new-price">${displayNewPrice}</span>
                    </div>
                `;
            } else if (deal.type === 'announcement') {
                priceHtml = ``;
            }

            let actionHtml = '';
            let isService = dynamicServices.some(s => s.service_key === deal.reference_id);
            if (deal.reference_id && window.openDetail && isService) {
                 actionHtml = `<div style="position: absolute; right: 0; bottom: 0;"><button class="hk-submit-btn" style="padding: 6px 16px; font-size: 0.85rem; border-radius: 6px; margin:0;" onclick="openDetail('${deal.reference_id}')">${translations[currentLang].more}</button></div>`;
            }

            const imgHtml = deal.image_url ? `
                <div class="product-image hot-deal-image-wrapper" data-images='["${deal.image_url}"]'>
                    <img src="${deal.image_url}" class="hot-deal-image" onerror="this.style.display='none'">
                    <div class="product-overlay">
                        <button class="view-btn" aria-label="View Image">&#128065;</button>
                    </div>
                </div>` : '';
            const badgeHtml = deal.type === 'discount' ? `<div class="hot-deal-badge" style="z-index: 5;">SALE</div>` : '';

            const article = document.createElement('div');
            article.className = 'hot-deal-card';
            article.innerHTML = `
                ${badgeHtml}
                ${imgHtml}
                <div class="hot-deal-content">
                    <h3 class="hot-deal-title">${title}</h3>
                    <p class="hot-deal-desc">${desc || ''}</p>
                    <div class="hot-deal-footer" style="display:flex; justify-content:center; align-items:center; position: relative;">
                        ${priceHtml}
                        ${actionHtml}
                    </div>
                </div>
            `;
            container.appendChild(article);
        });
        
        // Initialize lightbox logic for the new .view-btn elements
        if (typeof initLightboxTriggers === 'function') {
            initLightboxTriggers();
        }
    } catch(e) {
        console.error('Error loading hot deals:', e);
    }
}

// ==================== INIT ====================

document.addEventListener('DOMContentLoaded', async () => {
    // Room auth must be first — determines room context for all features
    if (window.initRoomAuth) await initRoomAuth();
    
    initLanguage();
    initTheme();
    initWiFi();
    initQRCode();
    initModals();
    initLightbox();
    initKeyboard();
    initVideo();
    initLogoAnimation();
    initContactModal();
    initStarRating();
    initSupabaseFeatures();
    loadHotDeals();
    checkPersistentNotification();
    if (window.initNotifications) initNotifications();
    if (window.initBookingRealtime) initBookingRealtime();
});

