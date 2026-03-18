/**
 * LUXORA Resort - Enhanced JavaScript
 * Multi-language support, modal system, lightbox, and animations
 */

// ==================== TRANSLATIONS ====================
const translations = {
    en: {
        welcome: "Welcome",
        tagline: "Garden Green Resort & Spa",
        services: "Services",
        rules: "Rules",
        minibar: "Mini Bar",
        tours: "Tours",
        contact: "Get in Touch",
        contactMenu: "Contact Us",
        wifiMenu: "WiFi",
        otherContact: "Other",
        otherMethodsTitle: "Other Methods",
        more: "More →",
        gallery: "Gallery",
        price: "Price",
        about: "Garden Inn Resort offers unparalleled luxury in a private paradise with beautiful green gardens.",
        rule1: "No smoking inside rooms",
        rule2: "Quiet hours 22:00–08:00",
        rule3: "Pets not allowed",
        rule4: "Pool closes at 20:00",
        // Service details
        poolTitle: "Pool",
        poolDesc: "Open-air pool with stunning views on our cottages. <br><br><strong>Hours:</strong> 08:00–20:00<br><strong>Access:</strong> Free for all guests<br><strong>Amenities:</strong> Free towels, sun loungers, pool bar",
        saunaTitle: "Sauna & SPA",
        saunaDesc: "Relax and rejuvenate in our premium sauna and spa facilities.<br><br><strong>Pricing:</strong><br>1 hour — 15,000 AMD<br>2 hours — 25,000 AMD<br>Day pass — 35,000 AMD",
        restaurantTitle: "Signature Restaurant",
        restaurantDesc: "Exquisite cuisine with panoramic sea views.<br><br><strong>Hours:</strong> 08:00–23:00<br><strong>Cuisine:</strong> Armenian & International<br><strong>Reservations:</strong> Recommended",
        // Tour details
        tour1Title: "Mountain Hike",
        tour1Desc: "4-hour guided mountain trek with scenic viewpoints.<br><br><strong>Includes:</strong> Transportation, lunch, insurance<br><strong>Difficulty:</strong> Easy-Medium<br><strong>Group size:</strong> Max 10 people",
        tour2Title: "Boat Cruise",
        tour2Desc: "3-hour lake cruise with dinner and drinks.<br><br><strong>Includes:</strong> Dinner, unlimited drinks, music<br><strong>Duration:</strong> 3 hours<br><strong>Departure:</strong> 18:00",
        tour3Title: "Ancient Ruins",
        tour3Desc: "Full-day tour of ancient Armenian historical sites.<br><br><strong>Includes:</strong> Guide, entrance tickets, lunch<br><strong>Duration:</strong> 6 hours<br><strong>Highlights:</strong> Temple of Garni, Monastery of Geghard",
        // WiFi modal
        copied: "Copied!",
        wifi: "WiFi",
        network: "Network:",
        password: "Password:",
        copy: "Copy",
        wifiInstructions: "Scan the QR code or enter the password manually to connect to WiFi."
    },
    ru: {
        welcome: "Добро пожаловать",
        tagline: "Садово-Зелёный Курорт и Спа",
        services: "Услуги",
        rules: "Правила",
        minibar: "Мини-Бар",
        tours: "Туры",
        contact: "Связаться с нами",
        contactMenu: "Связаться",
        wifiMenu: "WiFi",
        otherContact: "Другое",
        otherMethodsTitle: "Другие способы",
        more: "Подробнее →",
        gallery: "Галерея",
        price: "Цена",
        about: "Garden Inn Resort предлагает непревзойдённую роскошь в частном раю с прекрасными зелёными садами.",
        rule1: "Не курить в номерах",
        rule2: "Тихие часы 22:00–08:00",
        rule3: "Животные запрещены",
        rule4: "Бассейн закрывается в 20:00",
        // Service details
        poolTitle: "Открытый бассейн",
        poolDesc: "Открытый бассейн c видом на номера, и на наш ресторан.<br><br><strong>Часы работы:</strong> c  08:00–21:00<br><strong>Доступ:</strong> Бесплатно для гостей<br><strong>Удобства:</strong> Полотенца, шезлонги, бар рядом с бассейна",
        saunaTitle: "Сауна и СПА",
        saunaDesc: "Расслабьтесь и омолодитесь в наших премиальных спа-услугах.<br><br><strong>Цены:</strong><br>1 час — 15 000 AMD<br>2 часа — 25 000 AMD<br>Дневной абонемент — 35 000 AMD",
        restaurantTitle: "Ресторан Signature",
        restaurantDesc: "Изысканная кухня с панорамным видом на море.<br><br><strong>Часы работы:</strong> 08:00–23:00<br><strong>Кухня:</strong> Армянская и международная<br><strong>Бронирование:</strong> Рекомендуется",
        // Tour details
        tour1Title: "Горный поход",
        tour1Desc: "4-часовой поход с гидом по горным тропам.<br><br><strong>Включено:</strong> Транспорт, обед, страховка<br><strong>Сложность:</strong> Легкая-Средняя<br><strong>Группа:</strong> Макс. 10 человек",
        tour2Title: "Прогулка на лодке",
        tour2Desc: "3-часовая прогулка по озеру с ужином.<br><br><strong>Включено:</strong> Ужин, напитки, музыка<br><strong>Продолжительность:</strong> 3 часа<br><strong>Отправление:</strong> 18:00",
        tour3Title: "Древние руины",
        tour3Desc: "Полный день: экскурсия по древним армянским памятникам.<br><br><strong>Включено:</strong> Гид, билеты, обед<br><strong>Продолжительность:</strong> 6 часов<br><strong>Особенности:</strong> Храм Гарни, монастырь Гегард",
        // WiFi modal
        copied: "Скопировано!",
        wifi: "WiFi",
        network: "Сеть:",
        password: "Пароль:",
        copy: "Копировать",
        wifiInstructions: "Отсканируйте QR код или введите пароль вручную для подключения к WiFi."
    },
    hy: {
        welcome: "Բարի գալուստ",
        tagline: "Սակայն-Կանաչ Հանգստյան Գոտի և ՍպԱ",
        services: "Ծառայություններ",
        rules: "Կանոններ",
        minibar: "Մինի-Բար",
        tours: "Տուրեր",
        contact: "Կապվեք մեզ հետ",
        contactMenu: "Կապ",
        wifiMenu: "WiFi",
        otherContact: "Այլ",
        otherMethodsTitle: "Այլ Եղանակներ",
        more: "Ավելին →",
        gallery: "Պատկերասրահ",
        price: "Գինը",
        about: "Garden Inn Resort առաջարկում է անհավանական շքեղություն գեղեցիկ կանաչ պարտեզներով մասնավոր դրախտում:",
        rule1: "Չծխել սենյակներում",
        rule2: "Հանգիստ ժամեր 22:00–08:00",
        rule3: "Կենդանիներ չեն թույլատրվում",
        rule4: "Լողավազանը փակվում է 20:00-ին",
        // Service details
        poolTitle: "Լողավազան",
        poolDesc: "Բաց լողավազան քոթթեջներին նայող տեսքով:<br><br><strong>Ժամեր:</strong> 08:00–20:00<br><strong>Մուտք:</strong> Անվճար հյուրերի համար<br><strong>Հարմարություններ:</strong> Կտորներ, նստինգներ, բար",
        saunaTitle: "Սաունա և ՍՊԱ",
        saunaDesc: "Հանգստացեք մեր պրեմիում սպա ծառայություններում:<br><br><strong>Գներ:</strong><br>1 ժամ — 15,000 AMD<br>2 ժամ — 25,000 AMD<br>Օրվա անցում — 35,000 AMD",
        restaurantTitle: "Ստորագրության Ռեստորան",
        restaurantDesc: "Նրբաճաշակ խոհանոց ծովի համայնապատկերով:<br><br><strong>Ժամեր:</strong> 08:00–23:00<br><strong>Խոհանոց:</strong> Հայկական և միջազգային<br><strong>Ամրագրում:</strong> Սովորաբար խորհուրդ է տրվում",
        // Tour details
        tour1Title: "Լեռնային Քայլարշավ",
        tour1Desc: "4-ժամյան ուղեկցվող լեռնային զբոսանք:<br><br><strong>Ներառված է:</strong> Տրանսպորտ, ճաշ, հիմնադրամ<br><strong>Բարդություն:</strong> Հեշտ-Միջին<br><strong>Խումբ:</strong> Մինչև 10 մարդ",
        tour2Title: "Նավով Զբոսանք",
        tour2Desc: "3-ժամյան լճի զբոսնում ընթրիքով:<br><br><strong>Ներառված է:</strong> Ընթրիք, ըմպելիքներ, երաժշտություն<br><strong>Տևողություն:</strong> 3 ժամ<br><strong>Մեկնում:</strong> 18:00",
        tour3Title: "Հին Ավերակներ",
        tour3Desc: "Ամբողջ օր հին հայկական պատմական վայրերի ուղևորություն:<br><br><strong>Ներառված է:</strong> Ուղեցույց, տոմսեր, ճաշ<br><strong>Տևողություն:</strong> 6 ժամ<br><strong>Առանձնահատկություններ:</strong> Գառնի տաճատ, Գեղարդ վանք",
        // WiFi modal
        copied: "Պատճենվել է!",
        wifi: "WiFi",
        network: "Ցանց:",
        password: "Գաղտնաբառ:",
        copy: "Պատճենել",
        wifiInstructions: "Սկան QR կոդը կամ ձեռքով մուտքագրեք գաղտնաբառը WiFi-ին միանալու համար:"
    }
};

// ==================== STATE ====================
let currentLang = 'en';
let currentImages = [];
let lightboxIndex = 0;
let currentTheme = 'dark';

// ==================== LANGUAGE FUNCTIONS ====================
function initLanguage() {
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            setLanguage(btn.dataset.lang);
        });
    });
    updateTexts();
}

function setLanguage(lang) {
    currentLang = lang;
    
    // Update button states
    document.querySelectorAll('.lang-btn').forEach(btn => {
        const isActive = btn.dataset.lang === lang;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-pressed', isActive);
    });
    
    updateTexts();
}

function updateTexts() {
    document.querySelectorAll('[data-key]').forEach(el => {
        const key = el.dataset.key;
        
        // Skip translation for price elements - they should stay fixed
        if (el.classList.contains('price')) {
            return;
        }
        
        if (translations[currentLang][key]) {
            el.textContent = translations[currentLang][key];
        }
    });
    
    // Update document title
    document.title = `Garden Inn Resort | ${translations[currentLang].tagline}`;
}

// ==================== THEME FUNCTIONS ====================
function initTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;
    
    // Load saved theme
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    
    themeToggle.addEventListener('click', () => {
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
    });
}

function setTheme(theme) {
    currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        const icon = themeToggle.querySelector('.theme-icon');
        
        if (theme === 'light') {
            icon.textContent = '🌙';
            themeToggle.setAttribute('aria-label', 'Переключить на тёмную тему');
        } else {
            icon.textContent = '☀️';
            themeToggle.setAttribute('aria-label', 'Переключить на светлую тему');
        }
    }
}

// ==================== MODAL FUNCTIONS ====================
function openModal(id) {
    const modal = document.getElementById(id + '-modal');
    if (!modal) return;
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Focus trap for accessibility
    const closeBtn = modal.querySelector('.modal-close');
    if (closeBtn) {
        setTimeout(() => closeBtn.focus(), 100);
    }
}

function closeModal(modal) {
    if (!modal) return;
    
    modal.classList.remove('active');
    document.body.style.overflow = '';
    
    // Return focus to trigger element
    if (modal.triggerElement) {
        modal.triggerElement.focus();
    }
}

function initModals() {
    // Open modals via nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const modalId = btn.dataset.modal;
            if (modalId) {
                const modal = document.getElementById(modalId + '-modal');
                if (modal) {
                    modal.triggerElement = btn;
                    openModal(modalId);
                }
            }
        });
    });
    
    // Close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
            const modalId = btn.dataset.modal;
            const modal = document.getElementById(modalId + '-modal');
            closeModal(modal);
        });
    });
    
    // Click outside to close
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal);
            }
        });
    });
    
    // More buttons (Services + Tours)
    document.querySelectorAll('.more-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const card = btn.closest('.service-card');
            if (card) {
                openDetail(card.dataset.service);
            }
        });
    });
}

// ==================== DETAIL MODAL ====================
function openDetail(service) {
    // Close any currently open parent modal (services, tours, minibar)
    const parentModals = document.querySelectorAll('.modal.active');
    parentModals.forEach(modal => {
        if (modal.id !== 'detail-modal' && modal.id !== 'lightbox') {
            modal.classList.remove('active');
        }
    });
    
    const modal = document.getElementById('detail-modal');
    const title = document.getElementById('detail-title');
    const content = document.getElementById('detail-content');
    const gallery = document.getElementById('detail-gallery');
    
    // Get translations
    const t = translations[currentLang];
    
    // Set content based on service
    const serviceData = {
        pool: { title: t.poolTitle, desc: t.poolDesc, images: [
            'https://picsum.photos/id/1015/1200/800',
            'https://picsum.photos/id/1016/1200/800',
            'https://picsum.photos/id/1000/1200/800'
        ]},
        sauna: { title: t.saunaTitle, desc: t.saunaDesc, images: [
            'https://picsum.photos/id/201/1200/800',
            'https://picsum.photos/id/202/1200/800'
        ]},
        restaurant: { title: t.restaurantTitle, desc: t.restaurantDesc, images: [
            'https://picsum.photos/id/180/1200/800',
            'https://picsum.photos/id/181/1200/800'
        ]},
        tour1: { title: t.tour1Title, desc: t.tour1Desc, images: [
            'https://picsum.photos/id/1015/1200/800',
            'https://picsum.photos/id/1016/1200/800'
        ]},
        tour2: { title: t.tour2Title, desc: t.tour2Desc, images: [
            'https://picsum.photos/id/201/1200/800'
        ]},
        tour3: { title: t.tour3Title, desc: t.tour3Desc, images: [
            'https://picsum.photos/id/180/1200/800',
            'https://picsum.photos/id/160/1200/800'
        ]}
    };
    
    const data = serviceData[service];
    if (!data) return;
    
    // Clear gallery
    gallery.innerHTML = '';
    
    // Set content
    title.textContent = data.title;
    content.innerHTML = data.desc;
    currentImages = data.images;
    
    // Build gallery
    data.images.forEach((src, i) => {
        const img = document.createElement('img');
        img.src = src;
        img.alt = `${data.title} - Image ${i + 1}`;
        img.loading = 'lazy';
        img.onclick = () => openLightbox(i);
        gallery.appendChild(img);
    });
    
    openModal('detail');
}

// ==================== LIGHTBOX FUNCTIONS ====================
function openLightbox(index) {
    if (currentImages.length === 0) return;
    
    lightboxIndex = index;
    const lightbox = document.getElementById('lightbox');
    const lightboxImage = document.getElementById('lightbox-image');
    const currentSpan = document.getElementById('lightbox-current');
    const totalSpan = document.getElementById('lightbox-total');
    
    lightboxImage.src = currentImages[lightboxIndex];
    currentSpan.textContent = lightboxIndex + 1;
    totalSpan.textContent = currentImages.length;
    
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
}

function navigateLightbox(direction) {
    if (currentImages.length === 0) return;
    
    lightboxIndex = (lightboxIndex + direction + currentImages.length) % currentImages.length;
    
    const lightboxImage = document.getElementById('lightbox-image');
    const currentSpan = document.getElementById('lightbox-current');
    
    // Fade effect
    lightboxImage.style.opacity = '0';
    setTimeout(() => {
        lightboxImage.src = currentImages[lightboxIndex];
        currentSpan.textContent = lightboxIndex + 1;
        lightboxImage.style.opacity = '1';
    }, 150);
}

function initLightbox() {
    const lightbox = document.getElementById('lightbox');
    const closeBtn = lightbox.querySelector('.lightbox-close');
    const prevBtn = lightbox.querySelector('.lightbox-prev');
    const nextBtn = lightbox.querySelector('.lightbox-next');
    
    // Close button
    closeBtn.addEventListener('click', closeLightbox);
    
    // Navigation
    prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        navigateLightbox(-1);
    });
    
    nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        navigateLightbox(1);
    });
    
    // Click outside to close
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });
    
    // Product lightbox
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const productCard = btn.closest('.product-image');
            const imagesData = productCard.dataset.images;
            if (imagesData) {
                currentImages = JSON.parse(imagesData);
                openLightbox(0);
            }
        });
    });
}

// ==================== KEYBOARD HANDLING ====================
function initKeyboard() {
    document.addEventListener('keydown', (e) => {
        // Escape to close modals
        if (e.key === 'Escape') {
            const activeModal = document.querySelector('.modal.active');
            const lightbox = document.getElementById('lightbox');
            
            if (lightbox.classList.contains('active')) {
                closeLightbox();
            } else if (activeModal) {
                closeModal(activeModal);
            }
        }
        
        // Arrow keys for lightbox
        if (document.getElementById('lightbox').classList.contains('active')) {
            if (e.key === 'ArrowLeft') {
                navigateLightbox(-1);
            } else if (e.key === 'ArrowRight') {
                navigateLightbox(1);
            }
        }
    });
}

// ==================== VIDEO HANDLING ====================
function initVideo() {
    const video = document.getElementById('bg-video');
    
    // Try to play video
    video.play().catch(() => {
        // Autoplay was prevented, show fallback
        video.poster = 'https://picsum.photos/1920/1080';
    });
    
    // Handle video errors
    video.addEventListener('error', () => {
        video.style.display = 'none';
    });
}

// ==================== WIFI FUNCTIONS ====================
// WiFi credentials - EDIT THESE VALUES
const WIFI_CONFIG = {
    ssid: 'Rostelecom_23488',
    password: '094146454'
};

function initWiFi() {
    const wifiBtn = document.getElementById('wifi-connect-btn');
    const wifiModal = document.getElementById('wifi-modal');
    const wifiQRContainer = document.getElementById('wifi-qr-container');
    const wifiCopyBtn = document.getElementById('wifi-copy-btn');
    const wifiPasswordInput = document.getElementById('wifi-password-input');

    // WiFi configuration
    const WIFI_CONFIG = {
        ssid: 'Rostelecom_23488',
        password: '094146454',
        encryption: 'WPA',
        hidden: false
    };

    if (!wifiBtn || !wifiModal) return;

    /**
     * Generate WiFi QR code string in WIFI联盟 format
     * Format: WIFI:T:<encryption>;S:<ssid>;P:<password>;H:<hidden>;;
     */
    function generateWiFiQRString(config) {
        let qrString = `WIFI:T:${config.encryption};S:${config.ssid};P:${config.password};`;
        if (config.hidden) {
            qrString += 'H:true;';
        }
        qrString += ';';
        return qrString;
    }

    /**
     * Generate QR code for WiFi connection
     */
    function generateWiFiQRCode() {
        if (!wifiQRContainer) return;

        // Clear previous QR code
        wifiQRContainer.innerHTML = '';

        // Check if QRCode library is loaded
        if (typeof QRCode === 'undefined') {
            console.error('QRCode library not loaded');
            wifiQRContainer.innerHTML = '<p class="error">QR библиотека не загружена</p>';
            return;
        }

        try {
            const qrString = generateWiFiQRString(WIFI_CONFIG);
            console.log('Generating WiFi QR code for:', qrString);

            // Use QRCode.js library - creates QR code in the container
            // eslint-disable-next-line no-new
            new QRCode(wifiQRContainer, {
                text: qrString,
                width: 200,
                height: 200
            });
            
            console.log('QR code generated successfully');
        } catch (error) {
            console.error('QR Code generation error:', error);
            wifiQRContainer.innerHTML = '<p class="error">Не удалось сгенерировать QR код</p>';
        }
    }

    /**
     * Copy password to clipboard with fallback for older browsers
     */
    async function copyPasswordToClipboard() {
        const password = WIFI_CONFIG.password;

        try {
            // Modern clipboard API
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(password);
                showCopySuccess();
                return;
            }

            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = password;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();

            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);

            if (successful) {
                showCopySuccess();
            } else {
                showCopyError();
            }
        } catch (error) {
            console.error('Copy to clipboard error:', error);
            showCopyError();
        }
    }

    /**
     * Show copy success feedback
     */
    function showCopySuccess() {
        if (!wifiCopyBtn) return;
        
        const originalContent = wifiCopyBtn.innerHTML;
        wifiCopyBtn.classList.add('copied');
        wifiCopyBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>${translations[currentLang]?.copied || 'Copied!'}</span>
        `;

        setTimeout(() => {
            wifiCopyBtn.classList.remove('copied');
            wifiCopyBtn.innerHTML = originalContent;
        }, 2000);
    }

    /**
     * Show copy error feedback
     */
    function showCopyError() {
        if (!wifiPasswordInput) return;
        
        // Select the text for manual copy
        wifiPasswordInput.select();
        wifiPasswordInput.setSelectionRange(0, 99999);
        
        // Show error message
        const originalBorder = wifiPasswordInput.style.borderColor;
        wifiPasswordInput.style.borderColor = '#ef4444';
        
        setTimeout(() => {
            wifiPasswordInput.style.borderColor = originalBorder;
        }, 2000);
    }

    /**
     * Open WiFi modal and generate QR code
     */
    function openWiFiModal() {
        const modal = document.getElementById('wifi-modal');
        if (!modal) return;

        // Generate QR code
        generateWiFiQRCode();

        // Show modal using existing modal system
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Focus close button for accessibility
        const closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) {
            setTimeout(() => closeBtn.focus(), 100);
        }
    }

    // WiFi button click - open modal
    wifiBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openWiFiModal();
    });

    // Copy button click
    if (wifiCopyBtn) {
        wifiCopyBtn.addEventListener('click', (e) => {
            e.preventDefault();
            copyPasswordToClipboard();
        });
    }

    // Generate QR code when modal opens
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.target.id === 'wifi-modal' && 
                mutation.target.classList.contains('active') &&
                mutation.attributeName === 'class') {
                generateWiFiQRCode();
            }
        });
    });

    if (wifiModal) {
        observer.observe(wifiModal, { attributes: true });
    }
}

// ==================== ADVANCED LOGO ANIMATION ====================
function initLogoAnimation() {
    const letters = document.querySelectorAll('.logo-svg-text .logo-letter');
    if (!letters.length) return;
    
    // Stroke animation finishes around 2.6s (1.35s max delay + 1.2s duration)
    // We start the fill color animation shortly after.
    setTimeout(() => {
        letters.forEach((letter, index) => {
            setTimeout(() => {
                letter.classList.add('fill-color');
            }, index * 80); // 80ms sequential ripple for filling
        });
    }, 2600);
}

// ==================== CONTACT MODAL ====================
function initContactModal() {
    const otherBtn = document.getElementById('contact-other-btn');
    const otherDetails = document.getElementById('contact-other-details');
    
    if (otherBtn && otherDetails) {
        otherBtn.addEventListener('click', () => {
            // Toggle display
            if (otherDetails.style.display === 'none') {
                otherDetails.style.display = 'block';
            } else {
                otherDetails.style.display = 'none';
            }
        });
    }
}

// ==================== INITIALIZATION ====================
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
});

// Add smooth CSS transitions for lightbox image
window.addEventListener('load', () => {
    const lightboxImage = document.getElementById('lightbox-image');
    if (lightboxImage) {
        lightboxImage.style.transition = 'opacity 0.15s ease';
    }
});
