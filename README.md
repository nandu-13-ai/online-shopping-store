# 🛍️ NammaStore — Luxury Modern E-Commerce Platform

> **NammaStore** ("Our Store") is a world-class, premium e-commerce web platform celebrating India's rich artisanal heritage alongside cutting-edge modern consumer technology. Designed with high-end glassmorphism, responsive micro-interactions, dark/light mode themes, and complete end-to-end shopping functionality.

---

## ✨ Features Overview

### 1. 🎨 Visual Design & Luxury Experience
- **Glassmorphism & Royal Color Palette**: Warm amber gold, obsidian slate, emerald green accents, and subtle backdrop blurs.
- **Dark Mode & Light Mode**: Seamless 1-click switcher with local storage persistence and smooth CSS color transitions.
- **Global Currency Switcher**: Instant price conversion across **₹ INR**, **$ USD**, **€ EUR**, **£ GBP**, and **AED** with accurate exchange rates and localized number formatting.
- **Fluid Micro-Interactions**: Hover lens zoom on product cards, animated badges, quantity counters, and smooth drawer transitions.

### 2. 🔍 Smart Discovery & Search
- **Instant Search with Autocomplete**: Real-time keyword matching across titles, brands, categories, and descriptions with rich thumbnail suggestions.
- **Voice Search (Speech Recognition)**: Integrated Web Speech API (`webkitSpeechRecognition` / `SpeechRecognition`) for hands-free voice search.
- **Keyboard Shortcut**: Press `/` or `Ctrl+K` from anywhere to immediately focus the search bar.
- **Dynamic Category Pills**: One-click horizontal category filter bar (Electronics, Handloom Fashion, Home Decor, Single-Estate Gourmet, Ayurvedic Beauty, Artisanal Crafts).
- **Multi-Faceted Filtering & Sorting**:
  - Filter by In-Stock Only
  - Filter by 24h Express Delivery
  - Sort by Featured, Price (Low to High), Price (High to Low), Customer Rating, and Discount Percentage
  - Toggle between Grid View and List View

### 3. 📦 Interactive Product Cards & Quick View Modal
- **Multi-Angle Hover Previews**: Secondary product image smoothly reveals on card hover.
- **Quick View Modal**:
  - High-res image gallery with interactive thumbnail selector
  - Real-time Color and Size / Storage variant selectors
  - PIN Code Delivery Checker (validates 6-digit Indian PIN codes and estimates arrival time)
  - Tabbed information: Specifications Table, Customer Reviews with interactive rating submission form, and Shipping/Return policies
  - "Frequently Bought Together" bundle logic with discount calculation

### 4. 🛒 Slide-Over Cart Drawer
- **Off-Canvas Drawer Navigation**: Smooth slide-in drawer accessible from header or mobile bottom bar.
- **Interactive Steppers**: Increase, decrease, or remove cart items on the fly.
- **Free Shipping Tracker**: Dynamic progress bar toward the ₹999 free express shipping threshold.
- **Promo Code Engine**:
  - `NAMMA20`: 20% discount on entire order
  - `FIRSTBUY`: Flat ₹500 discount for new club members
  - `FESTIVE`: 15% festive celebration discount
  - `FREESHIP`: Unconditional free shipping waiver
- One-click coupon chips with instant validation and itemized price breakdown.

### 5. 💳 Comprehensive Multi-Step Checkout Experience
- **Step 1: Shipping Address**:
  - Saved addresses manager (Home, Work)
  - Full address form with real-time validation
  - "Use GPS Auto-Detect" simulation for instant 1-click address fill
- **Step 2: Shipping Speed**:
  - Standard Surface Delivery (3-5 days, Free over ₹999)
  - NammaExpress Next-Day Delivery (24 hours, ₹99)
  - Same-Day Rush Sprint (Within 6 hours, ₹199)
- **Step 3: Realistic Payment Gateway**:
  - **UPI / Dynamic QR Code**: Authentic SVG QR code generator with live 10-minute countdown timer and instant VPA verification.
  - **Interactive 3D Credit/Debit Card**: Real-time 3D card preview that renders cardholder name, formatted card digits, and flips 180° to display the magnetic strip & CVV when security code is focused!
  - **Net Banking**: One-click selection of top Indian banks (HDFC, SBI, ICICI, Axis, Kotak).
  - **Cash on Delivery (COD)**: Includes automated numeric Captcha validation.
  - **NammaCoins Loyalty Wallet**: Apply accumulated reward coins for direct checkout discounts.
- **Step 4: Order Confirmation & Invoice**:
  - Celebratory full-screen confetti burst (`canvas-confetti`)
  - Unique Order ID & NammaExpress Tracking AWB generated
  - Printable / Downloadable Tax Invoice receipt with GSTIN breakdown

### 6. ⚖️ Product Comparison Matrix
- Compare up to 4 products side-by-side in a dedicated drawer.
- Compares brand, category, ratings, delivery speed, and specifications with 1-click "Add to Cart" directly from the matrix.

### 7. 🚚 Live Order Tracking
- Dedicated modal tracking order status step-by-step:
  * Order Placed & Payment Verified
  * Packing & Quality Inspection
  * Dispatched via NammaExpress
  * Out for Delivery
  * Delivered

### 8. 📢 Live Social Proof Popups
- Subtle, dismissible live sales notification toasts every 28 seconds (e.g., *"Priya from Bengaluru just ordered Kanjeevaram Mulberry Silk Saree! ✨"*).

---

## 🚀 How to Run

### Run the Project (1-Step Automatic Startup)

Just clone the repository, install packages, and start:

```powershell
Set-Location nammastore
npm install
npm run dev
```

That's it! When you type `npm run dev` (or `npm.cmd run dev`):
1. **The website starts immediately** and prints `http://localhost:3000`.
2. **Docker Compose is automatically attached** in the background: it automatically brings up PostgreSQL (port `5433`), Kafka (port `29092`), and OpenSearch (port `9200`).
3. If `.env` is missing on a new computer, it automatically creates it from `.env.example`.
4. If Docker is not yet installed or booting on a machine, the website still opens and runs cleanly in local preview mode.

The Compose file is for local development: it runs single-node services and disables OpenSearch security. Do not expose these ports or use the sample credentials on a public network. Set a private random `SESSION_SECRET` and strong database password before any deployment.

---

## 📁 Project Structure

```
nammastore/
├── index.html              # Main responsive e-commerce web application
├── css/
│   └── styles.css          # Design system, 3D card animations, dark mode, glassmorphism
├── js/
│   ├── products-data.js    # Curated catalog, categories, currencies, and coupon rules
│   ├── store.js            # State engine: cart, wishlist, compare, currency, orders, storage
│   └── app.js              # Controllers, autocomplete, voice search, checkout, confetti
├── server.js               # Optional Express.js REST API server & static host
├── services/
│   └── platform.js         # PostgreSQL, Kafka outbox/consumer, OpenSearch API
├── db/
│   └── schema.sql          # Durable catalog, customers, carts, orders, and events
├── docker-compose.yml      # Local PostgreSQL, Kafka, and OpenSearch services
├── package.json            # Node configuration & scripts
└── README.md               # Documentation & setup guide
```
