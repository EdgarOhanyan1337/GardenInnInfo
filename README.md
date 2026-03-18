# Garden Green Resort & Spa 🌿

A premium, highly-interactive landing page for the **Garden Inn Resort**. Built with a focus on luxury aesthetics, smooth animations, and a seamless user experience.

🔗 **Live Demo:** [Garden Inn Resort](https://edgarohanyan1337.github.io/GardenInnInfo/)

## ✨ Key Features

* **Premium UI/UX:** Stunning glassmorphism design, sleek hover effects, and ultra-smooth backdrop transitions.
* **Advanced SVG Animation:** A custom, sequential stroke-drawing effect for the logo that elegantly fills with a glowing finish upon loading.
* **Multi-Language Support (i18n):** Native, instant switching between English (Default), Russian, and Armenian without page reloads.
* **Dynamic Modals & Lightbox:** A robust Vanilla JS modal framework handling comprehensive information (Services, Contact, Tours, Rules) and an image lightbox for the gallery and minibar items.
* **Smart WiFi Connection:** Auto-generates a scannable WiFi QR code and includes a 1-click password copy button natively built in the menu.
* **Dark & Light Mode:** Built-in CSS variables allow for instant toggling between elegant Dark (default) and clean Light themes.
* **Fully Responsive:** Custom media queries ensure the resort looks perfect on large displays, tablets, and small mobile screens.

## 🛠️ Tech Stack

This project is meticulously crafted **without heavy frameworks** to ensure maximum performance and maintainability:

* **HTML5:** Semantic, accessible component structure.
* **Vanilla CSS3:** Advanced animations (keyframe stroke-drawing), CSS variables, grid/flexbox layouts, and glassmorphism styling.
* **Vanilla JavaScript (ES6+):** For translation state management, modal logic, dynamic SVG animation sequencing, and QR generation.
* **External Library:** [QRCode.js](https://davidshimjs.github.io/qrcodejs/) (Loaded via CDN).

## 📁 File Structure

```
GardenInnInfo/
│
├── index.html        # Main HTML layout, modals, and SVG definitions
├── styles.css        # All custom styling, theming rules, and CSS animations
├── script.js         # Core logic (translations, modals, animations, QR logic)
└── assets/           # Directory for images, media, and gallery content
```

## 🚀 How to Run Locally

Since this is a static webpage without a backend, it is incredibly easy to run locally:

1. Clone the repository:
   ```bash
   git clone https://github.com/EdgarOhanyan1337/GardenInnInfo.git
   ```
2. Open `index.html` directly in any modern browser, OR use a local server for the best experience (e.g., VS Code Live Server):
   ```bash
   # If you use Node / npx:
   npx serve .
   ```
3. Enjoy the resort! 🥂

## 👤 Author
Maintained by **[Edgar Ohanyan](https://github.com/EdgarOhanyan1337)**.
