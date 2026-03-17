const translations = {
    en: { welcome:"Welcome", tagline:"Luxury Resort & Spa", services:"Services", rules:"Rules", minibar:"Mini Bar", tours:"Tours", contact:"Get in Touch", more:"More →", gallery:"Gallery", price:"Price", about:"LUXORA Resort offers unparalleled luxury in a private paradise.", rule1:"No smoking inside rooms", rule2:"Quiet hours 22:00–08:00", rule3:"Pets not allowed", rule4:"Pool closes at 20:00" },
    ru: { welcome:"Добро пожаловать", tagline:"Роскошный Курорт и Спа", services:"Услуги", rules:"Правила", minibar:"Мини-Бар", tours:"Туры", contact:"Связаться с нами", more:"Подробнее →", gallery:"Галерея", price:"Цена", about:"LUXORA Resort предлагает непревзойдённую роскошь в частном раю.", rule1:"Не курить в номерах", rule2:"Тихие часы 22:00–08:00", rule3:"Животные запрещены", rule4:"Бассейн закрывается в 20:00" },
    hy: { welcome:"Բարի գալուստ", tagline:"Շքեղ հանգստյան գոտի և սպա", services:"Ծառայություններ", rules:"Կանոններ", minibar:"Մինի-Բար", tours:"Տուրեր", contact:"Կապվեք մեզ հետ", more:"Ավելին →", gallery:"Պատկերասրահ", price:"Գինը", about:"LUXORA Resort առաջարկում է անհավանական շքեղություն մասնավոր դրախտում.", rule1:"Չծխել սենյակներում", rule2:"Հանգիստ ժամեր 22:00–08:00", rule3:"Կենդանիներ չեն թույլատրվում", rule4:"Լողավազանը փակվում է 20:00-ին" }
};

let currentLang = 'ru';
let currentImages = [];
let lightboxIndex = 0;

document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        currentLang = btn.dataset.lang;
        document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        updateTexts();
    });
});

function updateTexts() {
    document.querySelectorAll('[data-key]').forEach(el => {
        const key = el.dataset.key;
        if (translations[currentLang][key]) el.textContent = translations[currentLang][key];
    });
}

// Modal system
function openModal(id) {
    document.getElementById(id + '-modal').classList.add('active');
}
function closeModal(modal) {
    modal.classList.remove('active');
}

// Detail modal
function openDetail(service) {
    const modal = document.getElementById('detail-modal');
    const title = document.getElementById('detail-title');
    const content = document.getElementById('detail-content');
    const gallery = document.getElementById('detail-gallery');
    gallery.innerHTML = '';

    if (service === 'pool') {
        title.textContent = currentLang === 'hy' ? 'Անվճար Անվերջ լողավազան' : currentLang === 'ru' ? 'Бесплатный Бесконечный бассейн' : 'Free Infinity Pool';
        content.innerHTML = `<p>Открытый бассейн с видом на горы. Работает 24/7. Полотенца бесплатно.</p>`;
        currentImages = ['https://picsum.photos/id/1015/1200/800','https://picsum.photos/id/1016/1200/800'];
    } else if (service === 'sauna') {
        title.textContent = currentLang === 'hy' ? 'Սաունա և ՍՊԱ' : currentLang === 'ru' ? 'Сауна и СПА' : 'Sauna & SPA';
        content.innerHTML = `<p><strong>Цены:</strong><br>1 час — 15 000 AMD<br>2 часа — 25 000 AMD</p>`;
        currentImages = ['https://picsum.photos/id/201/1200/800','https://picsum.photos/id/202/1200/800'];
    } else if (service === 'restaurant') {
        title.textContent = currentLang === 'hy' ? 'Ստորագրության Ռեստորան' : currentLang === 'ru' ? 'Ресторан Signature' : 'Signature Restaurant';
        content.innerHTML = `<p>Изысканная кухня с видом на море. Работает 08:00–23:00.</p>`;
        currentImages = ['https://picsum.photos/id/180/1200/800'];
    } else if (service === 'tour1') {
        title.textContent = currentLang === 'hy' ? 'Լեռնային Քայլարշավ' : currentLang === 'ru' ? 'Горный Поход' : 'Mountain Hike';
        content.innerHTML = `<p>4-часовой поход в горы с гидом. Включает транспорт, обед, страховку.</p>`;
        currentImages = ['https://picsum.photos/id/1015/1200/800','https://picsum.photos/id/1016/1200/800'];
    } else if (service === 'tour2') {
        title.textContent = currentLang === 'hy' ? 'Նավով Զբոսանք' : currentLang === 'ru' ? 'Прогулка на Лодке' : 'Boat Cruise';
        content.innerHTML = `<p>3 часа по озеру с ужином. Напитки включены.</p>`;
        currentImages = ['https://picsum.photos/id/201/1200/800'];
    } else if (service === 'tour3') {
        title.textContent = currentLang === 'hy' ? 'Հին Ավերակներ' : currentLang === 'ru' ? 'Древние Руины' : 'Ancient Ruins';
        content.innerHTML = `<p>6 часов экскурсии. Входные билеты включены.</p>`;
        currentImages = ['https://picsum.photos/id/180/1200/800','https://picsum.photos/id/160/1200/800'];
    }

    currentImages.forEach((src,i) => {
        const img = document.createElement('img');
        img.src = src;
        img.onclick = () => { lightboxIndex = i; showLightbox(); };
        gallery.appendChild(img);
    });

    modal.classList.add('active');
}

// Lightbox
function openProductLightbox(img) {
    currentImages = [img.src];
    lightboxIndex = 0;
    showLightbox();
}
function showLightbox() {
    document.getElementById('lightbox').classList.add('active');
    document.getElementById('lightbox-image').src = currentImages[lightboxIndex];
}

// Lightbox controls
document.querySelector('.lightbox-close').onclick = () => document.getElementById('lightbox').classList.remove('active');
document.querySelector('.lightbox-prev').onclick = () => {
    lightboxIndex = (lightboxIndex - 1 + currentImages.length) % currentImages.length;
    showLightbox();
};
document.querySelector('.lightbox-next').onclick = () => {
    lightboxIndex = (lightboxIndex + 1) % currentImages.length;
    showLightbox();
};
document.getElementById('lightbox').addEventListener('click', e => {
    if (e.target.id === 'lightbox') document.getElementById('lightbox').classList.remove('active');
});

// Main init
document.addEventListener('DOMContentLoaded', () => {
    updateTexts();

    // Open main modals
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => openModal(btn.dataset.modal));
    });

    // Close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.modal;
            document.getElementById(id + '-modal').classList.remove('active');
        });
    });

    // More buttons (Services + Tours)
    document.querySelectorAll('.more-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const card = btn.closest('.service-card');
            openDetail(card.dataset.service);
        });
    });

    // Escape key
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            const active = document.querySelector('.modal.active');
            if (active) active.classList.remove('active');
        }
    });

    // Video fix
    document.getElementById('bg-video').play().catch(() => {});
});