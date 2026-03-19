# Garden Inn Resort & Spa 🌿

[*Read in Russian / Читать на русском*](#-описание-проекта-на-русском)

A premium, highly-interactive landing page and management system for the **Garden Inn Resort**. Built with a focus on luxury aesthetics, smooth animations, a seamless user experience, and a powerful backend.

🔗 **Live Demo:** [Garden Inn Resort](https://edgarohanyan1337.github.io/GardenInnInfo/)

## ✨ Key Features

* **Premium UI/UX:** Stunning glassmorphism design, sleek hover effects, and ultra-smooth background transitions.
* **Advanced Animations:** A custom, sequential stroke-drawing and leaf-rising SVG effect for the logo that elegantly fills with a glowing finish upon loading.
* **Multi-Language Support (i18n):** Native, instant switching between English (Default), Russian (Cyrillic), and Armenian without page reloads.
* **Smart Modals & Lightbox:** A robust Vanilla JS modal framework handling comprehensive information (Services, Contact, Tours, Rules) and an interactive image lightbox gallery.
* **Smart WiFi Connection:** Auto-generates a scannable WiFi QR code and includes a 1-click password copy button natively built into the menu.
* **Dark & Light Mode:** Built-in CSS variables allow for instant toggling between elegant Dark (default) and clean Light themes.
* **Fully Responsive:** Custom media queries ensure the resort looks perfect on large displays, tablets, and small mobile screens.

## 🧹 Smart Housekeeping System

A fully interactive real-time room service system:
* **1-Click Request:** Guests enter their room number on the site and request housekeeping.
* **Instant Staff Notifications:** 
  * 📱 **Telegram Bot:** Staff automatically receive a Telegram notification with an **"✅ I am coming" (Иду)** button.
  * 📧 **Email Notifications:** Simultaneously sends an email to admins via **Resend API**.
* **Real-time Guest Updates:** As soon as a staff member clicks "I am coming" in Telegram, the guest's screen **instantly** drops down a green banner confirming the request! This is powered by **Supabase WebSockets (Realtime)**, accompanied by a Web Audio API chime and a flashing browser tab.
* **Persistent State:** Notification banners persist across page reloads using `localStorage` until manually dismissed by the guest.
* **Rating System:** After submitting a request, guests receive a 6-digit code to rate their housekeeping experience later.

## ⚙️ Built-in Admin Panel

The project includes a dedicated, secure **Admin Panel** (`/admin/index.html`):
* **Content Management:** Update Tours, Services, Minibar, Rules, and Translations in real-time.
* **Media Storage:** Upload photos directly to **Supabase Storage**.
* **Notification Management:** Add or block staff email addresses for housekeeping alerts.
* **Analytics:** Review incoming housekeeping requests and guest ratings natively.

## 🛠️ Tech Stack & Backend

This project combines a lightweight vanilla frontend with a powerful serverless backend:

* **Frontend:** HTML5, Vanilla CSS3 (variables, flexbox/grid, glassmorphism), Vanilla JavaScript, Web Audio API.
* **Backend:** [Supabase](https://supabase.com/) (PostgreSQL & Storage & Realtime).
* **Edge Functions (Deno):** Deno scripts running on Supabase to handle Telegram Webhooks (`telegram-bot`) and sending emails via Resend (`send-email`).
* **External Libraries:** `qrcode.min.js` (for WiFi QR generation) and `@supabase/supabase-js`.

## 📁 File Structure

```
GardenInnInfo/
│
├── index.html        # Main front-facing layout and dynamic modals
├── styles.css        # Core styling, themes, and UI effect animations
├── script.js         # Frontend logic (Supabase, WebSockets, Audio, i18n, QR)
├── schema.sql        # Database schema, grants, and publication setup
├── admin/            
│   ├── index.html       # The Admin Dashboard UI
│   └── admin-script.js  # Admin logic (Auth, CRUD operations, Media uploads)
├── supabase/
│   └── functions/       # Cloud Edge Functions (Deno)
│       ├── telegram-bot/  # Telegram Bot & Webhook handlers
│       └── send-email/    # Resend API integration
└── assets/           # Local media assets
```

---

# 🇷🇺 Описание проекта на русском

Премиальный, интерактивный интерфейс и система управления для **Garden Inn Resort**. Создано с упором на эстетику, плавные анимации, удобный пользовательский опыт и мощный бекенд.

🔗 **Live Demo:** [Garden Inn Resort](https://edgarohanyan1337.github.io/GardenInnInfo/)

## ✨ Главные особенности

* **Premium UI/UX:** Дизайн в стиле Glassmorphism, стильные эффекты наведения и плавные переходы фона.
* **Сложные анимации:** Уникальная SVG-анимация логотипа с эффектом поочередной отрисовки и свечения.
* **Мультиязычность (i18n):** Мгновенное переключение между Английским (по умолчанию), Русским и Армянским языками без перезагрузки страницы.
* **Модальные окна и Галерея:** Легкий Vanilla JS фреймворк для модальных окон (Услуги, Контакты, Туры, Правила) и интерактивного просмотра фотографий (Lightbox).
* **Система умного WiFi:** Автоматическая генерация QR-кода для подключения к WiFi и кнопка копирования пароля в один клик.
* **Темная и Светлая темы:** Встроенная поддержка CSS-переменных для моментального переключения.
* **Полная адаптивность:** Пользовательские медиа-запросы гарантируют безупречный вид на любых устройствах.

## 🧹 Умная система заявок на уборку (Housekeeping)

Полностью интерактивная система обслуживания номеров:
* **Заказ в 1 клик:** Гость вводит номер комнаты на сайте и отправляет запрос на уборку.
* **Мгновенные уведомления персоналу:**
  * 📱 **Telegram Bot:** Персонал автоматически получает уведомление в Telegram с кнопкой **"✅ Иду"**.
  * 📧 **Email Notifications:** Параллельно отправляется письмо на почту администраторов через интеграцию с **Resend API**.
* **Real-time статус для гостя:** Как только сотрудник нажимает "Иду" в Telegram, гость **моментально** видит на своем экране зеленый баннер об успешном принятии заявки! Это работает через **Supabase WebSockets (Realtime)**, сопровождается звуковым сигналом и мигающей вкладкой браузера.
* **Сохранение состояния:** Уведомления сохраняются даже при перезагрузке страницы (`localStorage`), пока гость сам их не закроет.
* **Система оценки (Рейтинги):** Оценка качества уборки по 5-звездочной шкале по уникальному 6-значному коду.

## ⚙️ Встроенная Admin Panel

Проект включает защищенную **Панель Администратора** (`/admin/index.html`):
* **Управление контентом:** Редактирование Туров, Услуг, Мини-бара, Правил и Переводов в реальном времени.
* **Хранилище медиа:** Загрузка фотографий прямо в **Supabase Storage**.
* **Управление персоналом:** Добавление Email-адресов получателей заявок на уборку.
* **Аналитика:** Просмотр поступающих заявок и отзывов гостей.

## 🛠️ Технологический стек

* **Frontend:** HTML5, Vanilla CSS3, Vanilla JavaScript (ES6+), Web Audio API.
* **Backend:** [Supabase](https://supabase.com/) (PostgreSQL & Storage & Realtime).
* **Edge Functions (Deno):** Deno-скрипты на стороне Supabase для Telegram бота и отправки Email (`send-email`).

## 🚀 Как запустить проект

1. Склонируйте репозиторий:
   ```bash
   git clone https://github.com/EdgarOhanyan1337/GardenInnInfo.git
   ```
2. Откройте `index.html` в браузере или запустите через локальный сервер:
   ```bash
   npx serve .
   ```
3. Для авторизации в админке используйте путь `/admin/`.

## 👤 Автор
Поддерживается **[Edgar Ohanyan](https://github.com/EdgarOhanyan1337)**.
