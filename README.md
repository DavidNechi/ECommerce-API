# ECommerce API

Full-stack e-commerce application with:

- `backend`: Express + PostgreSQL + Passport session auth + Stripe payment intent flow
- `frontend`: React + Vite + Tailwind-based styling (`@apply` in `App.css`)

## What Is Implemented

### Backend
- Session-based authentication (`/auth/register`, `/auth/login`, `/auth/me`, `/auth/logout`)
- Product catalog CRUD (`/products`)
- Cart management per user (`/carts/:userId`, `/carts/:userId/items`)
- Order retrieval and status update (`/orders`, `/orders/users/:userId`, `/orders/:id`, `/orders/:id/status`)
- Checkout flow (`/checkout/:userId`) that:
  - validates cart exists and is not empty
  - checks stock
  - creates an order and order items
  - decrements product stock
  - clears the cart
- Stripe payment intent creation (`/payments/create-intent/:userId`)
- Swagger docs served at `/api-docs`

### Frontend
- Route-based app with protected pages (`Cart`, `Checkout`, `Orders`, `Profile`)
- Centralized API helper (`frontend/src/lib/api.js`)
- Centralized auth state with React context (`frontend/src/context/AuthContext.jsx`)
- Pages implemented:
  - Products + Product details
  - Login + Register
  - Cart + Checkout
  - Orders + Profile
- Navbar with auth-aware navigation and logo
- Styling consolidated in `frontend/src/App.css` with semantic class names

## Current Business Rules

- Stock is reduced when checkout succeeds (`POST /checkout/:userId`).
- Cart actions do not reserve stock.
- `POST /orders` currently records order data but does not drive stock changes in the same way checkout does.

## Tech Stack

- Backend: Express 5, PostgreSQL (`pg`), Passport Local, express-session, Stripe, Jest, Supertest
- Frontend: React 19, React Router, Vite, Tailwind CSS 4

## Local Setup

### 1) Install dependencies
```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2) Configure environment
Create `backend/.env` with at least:

```env
PORT=4001
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=your_db
SESSION_SECRET=your_session_secret
STRIPE_KEY=your_stripe_secret_key
```

### 3) Create database schema
Run SQL in:
- `backend/model/schema.sql`

### 4) Run the app
```bash
cd backend && npm run dev
cd frontend && npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4001`
- API docs: `http://localhost:4001/api-docs`

## Test Commands

```bash
cd backend
npm test
```
