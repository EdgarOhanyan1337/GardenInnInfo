# Garden Inn Resort & Spa 🌿

A premium, highly-interactive landing page and management system for the **Garden Inn Resort**. Built with a focus on luxury aesthetics, smooth animations, a seamless user experience, and a powerful backend.

🔗 **Live Demo:** [Garden Inn Resort](https://edgarohanyan1337.github.io/GardenInnInfo/)

## ✨ Key Features

* **Premium UI/UX:** Stunning glassmorphism design, sleek hover effects, and ultra-smooth backdrop transitions.
* **Advanced Animations:** A custom, sequential stroke-drawing and leaf-rising SVG effect for the logo that elegantly fills with a glowing finish upon loading.
* **Multi-Language Support (i18n):** Native, instant switching between English (Default), Russian (Cyrillic), and Armenian without page reloads.
* **Smart Modals & Lightbox:** A robust Vanilla JS modal framework handling comprehensive information (Services, Contact, Tours, Rules) and an image lightbox gallery.
* **Housekeeping System:** Guests can request housekeeping or leave star ratings. Generates a unique 6-digit code and instantly sends a notification via a **Telegram Bot**.
* **Smart WiFi Connection:** Auto-generates a scannable WiFi QR code and includes a 1-click password copy button natively built into the menu.
* **Dark & Light Mode:** Built-in CSS variables allow for instant toggling between elegant Dark (default) and clean Light themes.
* **Fully Responsive:** Custom media queries ensure the resort looks perfect on large displays, tablets, and small mobile screens.

## 🛠️ Tech Stack & Backend

This project combines a lightweight, vanilla frontend with a powerful serverless backend:

* **Frontend:** HTML5, Vanilla CSS3 (variables, flexbox/grid, glassmorphism), and Vanilla JavaScript (ES6+).
* **Backend Component:** [Supabase](https://supabase.com/) (PostgreSQL & Storage) integration for dynamic content management.
* **External Libraries:** `qrcode.min.js` (for WiFi QR generation) and `@supabase/supabase-js`.

## ⚙️ Built-in Admin Panel

The project includes a dedicated, secure **Admin Panel** (`/admin/index.html`) optimized for both desktop and mobile devices:
* Manage and update dynamic content (Tours, Services, Minibar, Rules, Translations) in real-time.
* Upload multiple media files (photos/videos) directly to **Supabase Storage**.
* Define custom pricing or HTML tables for paid services.
* Review incoming housekeeping requests and user ratings.

## 📁 File Structure

```
GardenInnInfo/
│
├── index.html        # Main front-facing layout and dynamic modals
├── styles.css        # Core styling, themes, and UI effect animations
├── script.js         # Frontend logic (Supabase integration, Telegram bot, QR, i18n)
├── admin/            
│   ├── index.html       # The Admin Dashboard UI
│   └── admin-script.js  # Admin logic (Auth, CRUD operations, Media uploads)
└── assets/           # Directory for locally stored baseline media
```

## 🚀 How to Run Locally

Since the frontend is completely decoupled from the serverless backend, running it is incredibly easy:

1. Clone the repository:
   ```bash
   git clone https://github.com/EdgarOhanyan1337/GardenInnInfo.git
   ```
2. Open `index.html` directly in any modern browser, OR use a local server for the best experience:
   ```bash
   npx serve .
   ```
3. To manage dynamic text, pricing, or images, navigate to the `/admin/` route and log in using your Supabase credentials.
4. Enjoy the resort! 🥂

## 👤 Author
Maintained by **[Edgar Ohanyan](https://github.com/EdgarOhanyan1337)**.
