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
const supabaseClient = window.supabase ? window.supabase.createClient(ROOT_SUPABASE_URL, ROOT_SUPABASE_KEY) : null;
window.supabaseClient = supabaseClient;

// Dynamic notification recipients (loaded from DB)
let notificationRecipients = { telegram: [], email: [] };

// ==================== TRANSLATIONS (UI buttons/labels - hardcoded) ====================
let translations = {
    en: { welcome: "Welcome", tagline: "Garden Inn Resort & Spa", services: "Services", rules: "Rules", minibar: "Mini Bar", tours: "Tours", housekeeping: "Housekeeping", contact: "Get in Touch", contactMenu: "Contact Us", wifiMenu: "WiFi", otherContact: "Other", otherMethodsTitle: "Other Methods", more: "More", gallery: "Gallery", price: "Price", about: "Garden Inn Resort offers luxury in a private paradise.", copied: "Copied!", wifi: "WiFi", network: "Network:", password: "Password:", copy: "Copy", wifiInstructions: "Scan QR or enter password.", hkTabCall: "Call", hkTabRate: "Rate", hkRoomLabel: "Room Number", hkRoomPlaceholder: "Enter your room number", hkCallNow: "Call Now", hkSending: "Sending...", hkSuccessTitle: "Request sent! Staff notified.", hkYourCode: "Your code:", hkCodeHint: "Save this code to rate our housekeeping service later.", hkEnterCode: "Enter your 6-digit code", hkHowWas: "How was the cleaning?", hkCommentLabel: "Comments (optional)", hkCommentPlaceholder: "Tell us about your experience...", hkSubmitRating: "Submit Rating", hkThanks: "Thank you for your feedback!", hkBannerTitle: "Housekeeping", hkBannerText: "Staff has accepted your request and is on the way.", hkAlertRoom: "Please enter your room number!", hkAlertConnection: "Connection error. Try again later.", hkAlertError: "Error sending request. Please try again.", hkInvalidCode: "Please enter a valid 6-digit code.", hkCodeNotFound: "Invalid code. Please check and try again.", hkAlreadyRated: "This code has already been used for rating." },
    ru: { welcome: "\u0414\u043e\u0431\u0440\u043e \u043f\u043e\u0436\u0430\u043b\u043e\u0432\u0430\u0442\u044c", tagline: "Garden Inn Resort & Spa", services: "\u0423\u0441\u043b\u0443\u0433\u0438", rules: "\u041f\u0440\u0430\u0432\u0438\u043b\u0430", minibar: "\u041c\u0438\u043d\u0438-\u0431\u0430\u0440", tours: "\u0422\u0443\u0440\u044b", housekeeping: "\u0423\u0431\u043e\u0440\u043a\u0430", contact: "\u0421\u0432\u044f\u0437\u0430\u0442\u044c\u0441\u044f", contactMenu: "\u041a\u043e\u043d\u0442\u0430\u043a\u0442\u044b", wifiMenu: "WiFi", otherContact: "\u0414\u0440\u0443\u0433\u043e\u0435", otherMethodsTitle: "\u0414\u0440\u0443\u0433\u0438\u0435 \u0441\u043f\u043e\u0441\u043e\u0431\u044b", more: "\u041f\u043e\u0434\u0440\u043e\u0431\u043d\u0435\u0435", gallery: "\u0413\u0430\u043b\u0435\u0440\u0435\u044f", price: "\u0426\u0435\u043d\u0430", about: "Garden Inn Resort \u2014 \u0440\u043e\u0441\u043a\u043e\u0448\u043d\u044b\u0439 \u043e\u0442\u0434\u044b\u0445 \u0432 \u0440\u0430\u0439\u0441\u043a\u043e\u043c \u0443\u0433\u043e\u043b\u043a\u0435 \u0441 \u0436\u0438\u0432\u043e\u043f\u0438\u0441\u043d\u044b\u043c\u0438 \u0441\u0430\u0434\u0430\u043c\u0438.", copied: "\u0421\u043a\u043e\u043f\u0438\u0440\u043e\u0432\u0430\u043d\u043e!", wifi: "WiFi", network: "\u0421\u0435\u0442\u044c:", password: "\u041f\u0430\u0440\u043e\u043b\u044c:", copy: "\u041a\u043e\u043f\u0438\u0440\u043e\u0432\u0430\u0442\u044c", wifiInstructions: "\u041e\u0442\u0441\u043a\u0430\u043d\u0438\u0440\u0443\u0439\u0442\u0435 QR-\u043a\u043e\u0434 \u0438\u043b\u0438 \u0432\u0432\u0435\u0434\u0438\u0442\u0435 \u043f\u0430\u0440\u043e\u043b\u044c \u0432\u0440\u0443\u0447\u043d\u0443\u044e.", hkTabCall: "\u0412\u044b\u0437\u0432\u0430\u0442\u044c", hkTabRate: "\u041e\u0446\u0435\u043d\u0438\u0442\u044c", hkRoomLabel: "\u041d\u043e\u043c\u0435\u0440 \u043a\u043e\u043c\u043d\u0430\u0442\u044b", hkRoomPlaceholder: "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043d\u043e\u043c\u0435\u0440 \u043a\u043e\u043c\u043d\u0430\u0442\u044b", hkCallNow: "\u0412\u044b\u0437\u0432\u0430\u0442\u044c", hkSending: "\u041e\u0442\u043f\u0440\u0430\u0432\u043a\u0430...", hkSuccessTitle: "\u0417\u0430\u043f\u0440\u043e\u0441 \u043e\u0442\u043f\u0440\u0430\u0432\u043b\u0435\u043d! \u041f\u0435\u0440\u0441\u043e\u043d\u0430\u043b \u0443\u0432\u0435\u0434\u043e\u043c\u043b\u0435\u043d.", hkYourCode: "\u0412\u0430\u0448 \u043a\u043e\u0434:", hkCodeHint: "\u0421\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u0435 \u044d\u0442\u043e\u0442 \u043a\u043e\u0434, \u0447\u0442\u043e\u0431\u044b \u043e\u0446\u0435\u043d\u0438\u0442\u044c \u0443\u0431\u043e\u0440\u043a\u0443 \u043f\u043e\u0437\u0436\u0435.", hkEnterCode: "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 6-\u0437\u043d\u0430\u0447\u043d\u044b\u0439 \u043a\u043e\u0434", hkHowWas: "\u041a\u0430\u043a \u0431\u044b\u043b\u0430 \u0443\u0431\u043e\u0440\u043a\u0430?", hkCommentLabel: "\u041a\u043e\u043c\u043c\u0435\u043d\u0442\u0430\u0440\u0438\u0439 (\u043d\u0435\u043e\u0431\u044f\u0437\u0430\u0442\u0435\u043b\u044c\u043d\u043e)", hkCommentPlaceholder: "\u0420\u0430\u0441\u0441\u043a\u0430\u0436\u0438\u0442\u0435 \u043e \u0432\u0430\u0448\u0435\u043c \u043e\u043f\u044b\u0442\u0435...", hkSubmitRating: "\u041e\u0442\u043f\u0440\u0430\u0432\u0438\u0442\u044c \u043e\u0446\u0435\u043d\u043a\u0443", hkThanks: "\u0421\u043f\u0430\u0441\u0438\u0431\u043e \u0437\u0430 \u0432\u0430\u0448 \u043e\u0442\u0437\u044b\u0432!", hkBannerTitle: "\u0423\u0431\u043e\u0440\u043a\u0430", hkBannerText: "\u041f\u0435\u0440\u0441\u043e\u043d\u0430\u043b \u043f\u0440\u0438\u043d\u044f\u043b \u0432\u0430\u0448 \u0437\u0430\u043f\u0440\u043e\u0441 \u0438 \u0443\u0436\u0435 \u0432 \u043f\u0443\u0442\u0438.", hkAlertRoom: "\u041f\u043e\u0436\u0430\u043b\u0443\u0439\u0441\u0442\u0430, \u0432\u0432\u0435\u0434\u0438\u0442\u0435 \u043d\u043e\u043c\u0435\u0440 \u043a\u043e\u043c\u043d\u0430\u0442\u044b!", hkAlertConnection: "\u041e\u0448\u0438\u0431\u043a\u0430 \u0441\u043e\u0435\u0434\u0438\u043d\u0435\u043d\u0438\u044f. \u041f\u043e\u043f\u0440\u043e\u0431\u0443\u0439\u0442\u0435 \u043f\u043e\u0437\u0436\u0435.", hkAlertError: "\u041e\u0448\u0438\u0431\u043a\u0430 \u043e\u0442\u043f\u0440\u0430\u0432\u043a\u0438 \u0437\u0430\u043f\u0440\u043e\u0441\u0430. \u041f\u043e\u043f\u0440\u043e\u0431\u0443\u0439\u0442\u0435 \u0441\u043d\u043e\u0432\u0430.", hkInvalidCode: "\u041f\u043e\u0436\u0430\u043b\u0443\u0439\u0441\u0442\u0430, \u0432\u0432\u0435\u0434\u0438\u0442\u0435 \u043a\u043e\u0440\u0440\u0435\u043a\u0442\u043d\u044b\u0439 6-\u0437\u043d\u0430\u0447\u043d\u044b\u0439 \u043a\u043e\u0434.", hkCodeNotFound: "\u041d\u0435\u0432\u0435\u0440\u043d\u044b\u0439 \u043a\u043e\u0434. \u041f\u0440\u043e\u0432\u0435\u0440\u044c\u0442\u0435 \u0438 \u043f\u043e\u043f\u0440\u043e\u0431\u0443\u0439\u0442\u0435 \u0441\u043d\u043e\u0432\u0430.", hkAlreadyRated: "\u042d\u0442\u043e\u0442 \u043a\u043e\u0434 \u0443\u0436\u0435 \u0431\u044b\u043b \u0438\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u043d \u0434\u043b\u044f \u043e\u0446\u0435\u043d\u043a\u0438." },
    hy: { welcome: "\u0532\u0561\u0580\u056b \u0563\u0561\u056c\u0578\u0582\u057d\u057f", tagline: "Garden Inn Resort & Spa", services: "\u053e\u0561\u057c\u0561\u0575\u0578\u0582\u0569\u0575\u0578\u0582\u0576\u0576\u0565\u0580", rules: "\u053f\u0561\u0576\u0578\u0576\u0576\u0565\u0580", minibar: "\u0544\u056b\u0576\u056b-\u0562\u0561\u0580", tours: "\u054f\u0578\u0582\u0580\u0565\u0580", housekeeping: "\u0544\u0561\u0584\u0580\u0578\u0582\u0569\u0575\u0578\u0582\u0576", contact: "\u053f\u0561\u057a", contactMenu: "\u053f\u0561\u057a \u0574\u0565\u0566 \u0570\u0565\u057f", wifiMenu: "WiFi", otherContact: "\u0531\u0575\u056c", otherMethodsTitle: "\u0531\u0575\u056c \u0565\u0572\u0561\u0576\u0561\u056f\u0576\u0565\u0580", more: "\u0531\u057e\u0565\u056c\u056b\u0576", gallery: "\u054a\u0561\u057f\u056f\u0565\u0580\u0561\u057d\u0580\u0561\u0570", price: "\u0533\u056b\u0576", about: "Garden Inn Resort \u2014 \u0577\u0584\u0565\u0572 \u0570\u0561\u0576\u0563\u056b\u057d\u057f \u0563\u0565\u0572\u0565\u0581\u056b\u056f \u0561\u0575\u0563\u056b\u0576\u0565\u0580\u0578\u057e\u0589", copied: "\u054a\u0561\u057f\u0573\u0565\u0576\u057e\u0565\u0581!", wifi: "WiFi", network: "\u0551\u0561\u0576\u0581\u055d", password: "\u0533\u0561\u0572\u057f\u0576\u0561\u0562\u0561\u057c\u055d", copy: "\u054a\u0561\u057f\u0573\u0565\u0576\u0565\u056c", wifiInstructions: "\u054d\u056f\u0561\u0576\u0561\u057e\u0578\u0580\u0565\u0584 QR \u056f\u0578\u0564\u0568 \u056f\u0561\u0574 \u0574\u0578\u0582\u057f\u0584\u0561\u0563\u0580\u0565\u0584 \u0563\u0561\u0572\u057f\u0576\u0561\u0562\u0561\u057c\u0568\u0589", hkTabCall: "\u053f\u0561\u0576\u0579\u0565\u056c", hkTabRate: "\u0533\u0576\u0561\u0570\u0561\u057f\u0565\u056c", hkRoomLabel: "\u054d\u0565\u0576\u0575\u0561\u056f\u056b \u0570\u0561\u0574\u0561\u0580", hkRoomPlaceholder: "\u0544\u0578\u0582\u057f\u0584\u0561\u0563\u0580\u0565\u0584 \u057d\u0565\u0576\u0575\u0561\u056f\u056b \u0570\u0561\u0574\u0561\u0580\u0568", hkCallNow: "\u053f\u0561\u0576\u0579\u0565\u056c", hkSending: "\u0548\u0582\u0572\u0561\u0580\u056f\u057e\u0578\u0582\u0574 \u0567...", hkSuccessTitle: "\u0540\u0561\u0580\u0581\u0578\u0582\u0574\u0568 \u0578\u0582\u0572\u0561\u0580\u056f\u057e\u0565\u0581! \u0531\u0576\u0571\u0576\u0561\u056f\u0561\u0566\u0574\u0568 \u057f\u0565\u0572\u0565\u056f\u0561\u0581\u057e\u0565\u0581\u0589", hkYourCode: "\u0541\u0565\u0580 \u056f\u0578\u0564\u0568\u055d", hkCodeHint: "\u054a\u0561\u0570\u0565\u0584 \u0561\u0575\u057d \u056f\u0578\u0564\u0568\u055d \u0570\u0565\u057f\u0578 \u0574\u0561\u0584\u0580\u0578\u0582\u0569\u0575\u0578\u0582\u0576\u0568 \u0563\u0576\u0561\u0570\u0561\u057f\u0565\u056c\u0578\u0582 \u0570\u0561\u0574\u0561\u0580\u0589", hkEnterCode: "\u0544\u0578\u0582\u057f\u0584\u0561\u0563\u0580\u0565\u0584 6-\u0576\u056b\u0577 \u056f\u0578\u0564\u0568", hkHowWas: "\u053b\u0576\u0579\u057a\u0565\u057d \u0567\u0580 \u0574\u0561\u0584\u0580\u0578\u0582\u0569\u0575\u0578\u0582\u0576\u0568\u0589", hkCommentLabel: "\u0544\u0565\u056f\u0576\u0561\u0562\u0561\u0576\u0578\u0582\u0569\u0575\u0578\u0582\u0576 (\u056f\u0561\u0574\u0561\u057e\u0578\u0580)", hkCommentPlaceholder: "\u054a\u0561\u057f\u0574\u0565\u0584 \u0571\u0565\u0580 \u0583\u0578\u0580\u0571\u056b \u0574\u0561\u057d\u056b\u0576...", hkSubmitRating: "\u0548\u0582\u0572\u0561\u0580\u056f\u0565\u056c \u0563\u0576\u0561\u0570\u0561\u057f\u0561\u056f\u0561\u0576\u0568", hkThanks: "\u0547\u0576\u0578\u0580\u0570\u0561\u056f\u0561\u056c\u0578\u0582\u0569\u0575\u0578\u0582\u0576 \u0571\u0565\u0580 \u056f\u0561\u0580\u056e\u056b\u0584\u056b \u0570\u0561\u0574\u0561\u0580!", hkBannerTitle: "\u0544\u0561\u0584\u0580\u0578\u0582\u0569\u0575\u0578\u0582\u0576", hkBannerText: "\u0531\u0576\u0571\u0576\u0561\u056f\u0561\u0566\u0574\u0568 \u0568\u0576\u0564\u0578\u0582\u0576\u0565\u056c \u0567 \u0571\u0565\u0580 \u0570\u0561\u0580\u0581\u0578\u0582\u0574\u0568 \u0587 \u0561\u0580\u0564\u0565\u0576 \u0573\u0561\u0576\u0561\u057a\u0561\u0580\u0570\u056b\u0576 \u0567\u0589", hkAlertRoom: "\u053d\u0576\u0564\u0580\u0578\u0582\u0574 \u0565\u0576\u0584, \u0574\u0578\u0582\u057f\u0584\u0561\u0563\u0580\u0565\u0584 \u057d\u0565\u0576\u0575\u0561\u056f\u056b \u0570\u0561\u0574\u0561\u0580\u0568!", hkAlertConnection: "\u053f\u0561\u057a\u056b \u057d\u056d\u0561\u056c\u0589 \u0553\u0578\u0580\u0571\u0565\u0584 \u0561\u057e\u0565\u056c\u056b \u0578\u0582\u0577.", hkAlertError: "\u054d\u056d\u0561\u056c \u0570\u0561\u0580\u0581\u0578\u0582\u0574 \u0578\u0582\u0572\u0561\u0580\u056f\u0565\u056c\u056b\u057d\u0589 \u0553\u0578\u0580\u0571\u0565\u0584 \u056f\u0580\u056f\u056b\u0576\u0589", hkInvalidCode: "\u053d\u0576\u0564\u0580\u0578\u0582\u0574 \u0565\u0576\u0584, \u0574\u0578\u0582\u057f\u0584\u0561\u0563\u0580\u0565\u0584 \u0573\u056b\u0577\u057f 6-\u0576\u056b\u0577 \u056f\u0578\u0564\u0589", hkCodeNotFound: "\u054d\u056d\u0561\u056c \u056f\u0578\u0564\u0589 \u054d\u057f\u0578\u0582\u0563\u0565\u0584 \u0587 \u0576\u0578\u0580\u056b\u0581 \u0583\u0578\u0580\u0571\u0565\u0584\u0589", hkAlreadyRated: "\u0531\u0575\u057d \u056f\u0578\u0564\u0568 \u0561\u0580\u0564\u0565\u0576 \u0585\u0563\u057f\u0561\u0563\u0578\u0580\u056e\u057e\u0565\u056c \u0567 \u0563\u0576\u0561\u0570\u0561\u057f\u0574\u0561\u0576 \u0570\u0561\u0574\u0561\u0580\u0589" }
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
            if (item.is_paid) article.dataset.isPaid = 'true';
            
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
                '<span class="status paid" style="text-transform: none;">' + item.price + '</span>' +
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
    // Translate placeholders
    document.querySelectorAll('[data-placeholder-key]').forEach(el => {
        var pKey = el.dataset.placeholderKey;
        if (t[pKey]) el.placeholder = t[pKey];
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

    // Append price info if it exists
    var priceInfo = '';
    if (data.price) {
        // Convert newlines to breaks just in case they typed multiple lines
        var formattedPrice = data.price.replace(/\n/g, '<br>');
        priceInfo = '<div class="detail-price-box" style="margin-top: 16px; padding: 12px; background: rgba(26, 188, 156, 0.1); border: 1px dashed var(--color-primary); border-radius: 8px; color: var(--color-primary-light); font-weight: 500;">' + formattedPrice + '</div>';
    }

    if (titleEl) titleEl.textContent = title;
    if (contentEl) {
        contentEl.innerHTML = desc + priceInfo;
        
        // Add booking button if service is paid
        if (data.is_paid) {
            var sName = data['title_' + currentLang] || data.title_en || '';
            var bookBtn = document.createElement('button');
            bookBtn.className = 'hk-submit-btn';
            bookBtn.style.marginTop = '24px';
            var t = translations[currentLang] || translations.en;
            bookBtn.innerHTML = '<span>📅</span> <span>' + (t.bookingSubmit || 'Book Now') + '</span>';
            bookBtn.onclick = () => {
                closeModal(document.getElementById('detail-modal'));
                if (window.showBookingConfirm) window.showBookingConfirm(data.id, sName, data.has_calendar);
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
        if (codeDisplay) codeDisplay.textContent = code;
        if (msgDiv) msgDiv.style.display = 'block';
        if (submitBtn) submitBtn.style.display = 'none';
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
    checkPersistentNotification();
    if (window.initNotifications) initNotifications();
    if (window.initBookingRealtime) initBookingRealtime();
});

