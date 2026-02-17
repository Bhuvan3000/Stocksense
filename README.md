# 📦 StockSense — Full Stack Inventory Management System

A complete inventory management system built with **React + Vite** (frontend) and **Node.js + Express + MongoDB Atlas** (backend).

---

## 🗂 Project Structure

```
stocksense/
├── backend/                  # Express API
│   ├── models/               # Mongoose models (User, Product, Order)
│   ├── routes/               # API routes (auth, products, orders, dashboard)
│   ├── middleware/           # JWT auth middleware
│   ├── config/               # DB seed script
│   ├── server.js             # Entry point
│   └── .env.example          # Environment variable template
│
├── frontend/                 # React + Vite app
│   ├── src/
│   │   ├── pages/            # Dashboard, Inventory, Orders, Reports, Alerts
│   │   ├── components/       # Sidebar, Icon
│   │   ├── context/          # AuthContext, NotifyContext
│   │   └── utils/            # Axios API instance
│   └── vite.config.js        # Dev proxy → backend
│
└── package.json              # Root scripts (run both with one command)
```

---

## ⚡ Quick Setup

### 1. Install Dependencies

```bash
npm install          # installs root deps (concurrently)
npm run install:all  # installs backend + frontend deps
```

### 2. Configure Environment Variables

```bash
cp backend/.env.example backend/.env
```

Then open `backend/.env` and set your **MongoDB Atlas connection string**:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/stocksense?retryWrites=true&w=majority
JWT_SECRET=your_secret_key_here
PORT=5000
FRONTEND_URL=http://localhost:5173
```

### 3. Seed the Database (optional but recommended)

```bash
npm run seed
```

This creates:
- 👤 Admin user: `admin@stocksense.com` / `admin123`
- 📦 8 sample products across 3 categories
- 📋 4 sample orders (mix of sales and purchases)

### 4. Run the App

```bash
npm run dev
```

This starts both servers concurrently:
- **Backend API** → http://localhost:5000
- **Frontend**    → http://localhost:5173

---

## 🔌 API Reference

### Auth
| Method | Endpoint            | Description        |
|--------|---------------------|--------------------|
| POST   | `/api/auth/register`| Register new user  |
| POST   | `/api/auth/login`   | Login              |
| GET    | `/api/auth/me`      | Get current user   |

### Products
| Method | Endpoint                           | Description          |
|--------|------------------------------------|----------------------|
| GET    | `/api/products`                    | List all products    |
| POST   | `/api/products`                    | Create product       |
| PUT    | `/api/products/:id`                | Update product       |
| DELETE | `/api/products/:id`                | Delete product       |
| PATCH  | `/api/products/:id/adjust-stock`   | Adjust stock qty     |

### Orders
| Method | Endpoint                    | Description           |
|--------|-----------------------------|-----------------------|
| GET    | `/api/orders`               | List all orders       |
| POST   | `/api/orders`               | Create order          |
| PATCH  | `/api/orders/:id/status`    | Update order status   |
| DELETE | `/api/orders/:id`           | Delete pending order  |

### Dashboard
| Method | Endpoint                         | Description             |
|--------|----------------------------------|-------------------------|
| GET    | `/api/dashboard/stats`           | KPI summary             |
| GET    | `/api/dashboard/sales-trend`     | Daily revenue trend     |
| GET    | `/api/dashboard/category-breakdown` | Category stats       |
| GET    | `/api/dashboard/top-products`    | Best sellers            |
| GET    | `/api/dashboard/low-stock`       | Stock alerts            |

---

## ✨ Features

- 🔐 **JWT Authentication** — login/register with role-based access (admin, manager, viewer)
- 📦 **Inventory Management** — full CRUD with search, filter by category, stock status badges
- 🛒 **Orders** — sales and purchase orders with automatic stock deduction/addition on completion
- 📊 **Dashboard** — live KPIs, sales trend chart, top sellers, pending orders
- 📈 **Reports** — revenue, gross profit, inventory valuation, category breakdown
- 🔔 **Stock Alerts** — real-time low stock / out-of-stock alerts with quick restock buttons
- 🌱 **Seed Script** — one command to populate demo data

---

## 🛠 Tech Stack

| Layer     | Technology                        |
|-----------|-----------------------------------|
| Frontend  | React 18, Vite, React Router v6   |
| Styling   | Pure CSS (custom design system)   |
| HTTP      | Axios (with JWT interceptor)      |
| Backend   | Node.js, Express 4                |
| Database  | MongoDB Atlas (via Mongoose 8)    |
| Auth      | JWT + bcryptjs                    |
| Dev Tools | nodemon, concurrently             |
