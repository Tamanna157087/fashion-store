# 🛍️ AI Fashion Store — Production-Ready MERN E-Commerce Platform

A commercial-grade, Myntra-style MERN stack AI Fashion Platform with an intelligent AI Stylist Assistant, Natural Language Search, Complete-the-Look Outfit Engine, Real-time Admin Dashboard Analytics, and seamless Payment Gateway integration.

---

## ✨ Key Features & Architecture

### 🤖 1. AI Features & Grounded Stylist
* **Floating AI Stylist ("Aura")**: Site-wide expandable chatbot widget with typing indicator, suggested prompt chips, and grounded product recommendations.
* **AI Provider Abstraction**: Supports **Google Gemini**, **OpenAI GPT**, **Anthropic Claude**, or **Smart MongoDB Regex Fallback** when no API key is set.
* **Strict Anti-Hallucination**: The AI extracts user intent (category, color, gender, occasion, budget, brand) and searches MongoDB to return *only real products*.
* **Natural Language Search**: Convert complex queries like `"Black dress under 2000"` or `"Shoes for office"` into structured database filters.
* **"Complete the Look" Engine**: Dynamic outfit recommendation component pairing tops, bottom wear, footwear, watches, and accessories.

### 🛍️ 2. Premium Customer Experience
* **Myntra-Grade Homepage**: Hero banner carousel with auto-play, Flash Sale live countdown timer, Category grid, Trending collections, AI Picks, and customer reviews.
* **Advanced Product Experience**: Image gallery with zoom preview, SKU & variant selection (color/size stock tracking), PIN code delivery estimator, share links, stock countdown badges, and side-by-side product comparison.
* **Wishlist & Cart**: One-click "Move to Cart", "Save for Later", Free Shipping threshold progress bar (`₹999`), and auto-suggested promo coupons (`FASHION20`, `WELCOME10`).

### 📊 3. Seller & Admin Panel
* **Shopify-Style Analytics**: Recharts visualizations for Monthly Sales (AreaChart), Weekly Orders (BarChart), Revenue Trends, and Category/Brand Sales.
* **Bulk Catalog Management**: Multi-select products to perform bulk delete, category updates, brand changes, percentage discounts, stock updates, and CSV export/import.
* **Fulfillment & Tracking**: Order status progression (Pending → Confirmed → Packed → Shipped → Delivered → Returned), printable PDF Invoices & Express Shipping Labels.
* **Global Search (`Ctrl+K`)**: Instant search across products, orders, users, and promo codes.
* **Admin Notification Drawer**: Real-time alerts for new orders, cancellations, returns, and low stock.

---

## 🛠️ Tech Stack

* **Frontend**: React 19, Vite 8, TailwindCSS, Recharts, React Toastify, React Router DOM.
* **Backend**: Node.js, Express 5, MongoDB Mongoose 9, JWT Authentication, bcryptjs, Helmet, CORS, Express Rate Limit.
* **AI Providers**: Google Generative AI (@google/generative-ai), OpenAI SDK, or Local MongoDB Aggregation NLP parser.
* **Media & Documents**: Cloudinary media storage, HTML-to-PDF invoice printing, printable Thermal Shipping Labels.

---

## 🚀 Environment Setup

### 1. Server Configuration (`server/.env`)

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ai_fashion_store
JWT_SECRET=your_super_secret_jwt_key_here
CLIENT_URL=http://localhost:5173
NODE_ENV=development

# Optional AI Providers (System auto-falls back if empty)
AI_PROVIDER=gemini # gemini | openai | claude | fallback
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here

# Cloudinary (Optional for media uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 2. Client Configuration (`client/.env`)

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## 💻 Local Development Guide

1. **Install Server Dependencies & Start**:
   ```bash
   cd server
   npm install
   npm start
   ```

2. **Install Client Dependencies & Start**:
   ```bash
   cd client
   npm install
   npm run dev
   ```

3. **Seed Initial Database**:
   ```bash
   cd server
   node src/seed/seed.js
   ```

---

## 🧪 Build & Production Verification

* **Backend Syntax Check**:
  ```bash
  node --check server/server.js server/src/**/*.js
  ```
* **Frontend Vite Build**:
  ```bash
  cd client
  npm run build
  ```

---

## 🌐 Production Deployment

* **Frontend (Vercel)**: Configured with `vercel.json` SPA route rewrite rules.
* **Backend (Render / Railway)**: Configured with `render.yaml` Node environment setup.
