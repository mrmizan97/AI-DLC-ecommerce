# AI-DLC Frontend — Project Context

## Overview

A Daraz-style e-commerce storefront + admin dashboard built with **Next.js 16 (App Router)** in **JavaScript**. Consumes the Express backend API at `http://localhost:3000/api`.

---

## Tech Stack

| Layer          | Technology                    |
| -------------- | ----------------------------- |
| Framework      | Next.js 16 (App Router)       |
| Language       | JavaScript                    |
| Styling        | Tailwind CSS 4                |
| State          | Zustand (with `persist`)      |
| HTTP Client    | Axios (with JWT interceptor)  |
| Charts         | Recharts                      |
| Icons          | Lucide React                  |
| Toasts         | React Hot Toast               |

---

## Project Structure

```
frontend/
├── .env.local                            # NEXT_PUBLIC_API_URL
├── .env.example
├── CONTEXT.md                            # This file — global frontend context
├── context/                              # Feature-specific context docs
│   ├── api/
│   ├── layout/
│   ├── auth/
│   ├── product/
│   ├── cart/
│   ├── checkout/
│   ├── order/
│   ├── profile/
│   └── admin/
├── public/
└── src/
    ├── app/                              # Next.js App Router pages
    │   ├── layout.js                     # Root layout (Header + Footer + Toaster)
    │   ├── page.js                       # Home
    │   ├── globals.css                   # Tailwind + theme tokens
    │   ├── login/
    │   ├── register/
    │   ├── profile/
    │   ├── products/
    │   │   ├── page.js                   # List with filters
    │   │   └── [id]/page.js              # Detail
    │   ├── cart/
    │   ├── checkout/
    │   ├── orders/
    │   │   ├── page.js
    │   │   └── [id]/page.js
    │   └── admin/
    │       ├── layout.js                 # Admin auth guard + sidebar
    │       ├── page.js                   # Dashboard (stats + charts)
    │       ├── products/
    │       ├── categories/
    │       ├── tags/
    │       ├── orders/
    │       └── users/
    ├── components/
    │   ├── Header.js                     # Top nav — search, cart, user menu
    │   ├── Footer.js                     # 4-column footer
    │   └── ProductCard.js                # Reusable product tile
    ├── lib/
    │   └── api.js                        # Axios client with JWT interceptor
    └── store/
        ├── authStore.js                  # Zustand auth store (persisted)
        └── cartStore.js                  # Zustand cart store (persisted)
```

---

## Architecture

```
User action (page / button)
  │
  ▼
Page component (src/app/.../page.js)
  │
  ├─── Reads state from Zustand stores (auth, cart)
  ├─── Calls API via src/lib/api.js (axios)
  └─── Updates UI
  │
  ▼
Backend API (http://localhost:3000/api)
```

### Layer Rules

- **Pages** (`src/app/*/page.js`) handle UI, state access, and API calls.
- **Components** (`src/components/`) are reusable UI pieces — no API calls unless they own a widget action (e.g., `ProductCard` → add to cart).
- **Stores** (`src/store/`) hold client-side state (auth token, cart). Persisted to `localStorage`.
- **API client** (`src/lib/api.js`) centralizes axios config — base URL, JWT attach, 401 handling.
- **No server-side API calls** — all fetching is client-side (`"use client"`). This keeps auth simple (JWT in `localStorage`, not cookies).

---

## Environment Variables (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

- Prefix `NEXT_PUBLIC_` is required for Next.js to expose the variable to client code.

---

## Routing Map

### Public routes
| Route | Description |
|-------|-------------|
| `/` | Home — hero banner, categories, featured products |
| `/products` | Product listing with filters (search, category, price, sort, pagination) |
| `/products/[id]` | Product detail — gallery, price, add to cart, buy now |
| `/login` | Login form |
| `/register` | Signup form |
| `/cart` | Cart with quantity controls |

### Authenticated routes (redirect to /login if not authed)
| Route | Description |
|-------|-------------|
| `/checkout` | Shipping address + place order |
| `/orders` | User's order history |
| `/orders/[id]` | Order detail + cancel (if pending) |
| `/profile` | User profile |

### Admin-only routes (redirect to / if not admin)
| Route | Description |
|-------|-------------|
| `/admin` | Dashboard summary with 4 charts + stat cards |
| `/admin/products` | Product CRUD |
| `/admin/categories` | Category CRUD |
| `/admin/tags` | Tag CRUD |
| `/admin/orders` | Order list + status update + detail modal |
| `/admin/users` | User management (edit role / active, delete) |

---

## State Management (Zustand)

### Auth Store (`src/store/authStore.js`)
- Persisted key: `auth-storage`
- State: `{ user, token }`
- Actions: `login(user, token)`, `logout()`, `isAuthenticated()`, `isAdmin()`
- Also mirrors to plain `localStorage` keys `token` and `user` (consumed by axios interceptor).

### Cart Store (`src/store/cartStore.js`)
- Persisted key: `cart-storage`
- State: `{ items: [{ product_id, name, price, image_url, stock, quantity }] }`
- Actions: `addItem(product, qty)`, `removeItem(id)`, `updateQuantity(id, qty)`, `clear()`, `totalItems()`, `totalAmount()`

---

## Theme & Styling

CSS variables defined in `src/app/globals.css`:

```css
--primary: #f85606;        /* Daraz-orange */
--primary-dark: #d14800;
--secondary: #2abbe8;      /* Daraz-cyan */
--background: #f5f5f5;
```

Exposed to Tailwind via `@theme inline`, so use `bg-primary`, `text-primary`, `bg-primary-dark`, etc.

---

## Coding Conventions

- **File naming**: camelCase for utility/store files, PascalCase for React components.
- **Client components**: Any file using hooks, state, or browser APIs must start with `"use client"`.
- **Imports**: use `@/*` alias (resolves to `src/*`) for absolute imports.
- **Quotes**: Double quotes for strings.
- **Semicolons**: Always use semicolons.
- **API responses**: Backend returns `{ success, message?, data, errors?, pagination? }`. Destructure `res.data.data` to get payload.
- **Error handling**: catch axios errors, pull `err.response?.data?.message`, show via `toast.error()`.
- **Loading states**: show skeleton (`animate-pulse`) or "Loading…" text while fetching.

---

## Feature Contexts

Each feature has its own context docs under `context/<feature>/`:

| Feature  | Docs Location         | Pages/Components                                 |
| -------- | --------------------- | ------------------------------------------------ |
| API      | `context/api/`        | axios client + JWT handling                      |
| Layout   | `context/layout/`     | Header, Footer, root layout                      |
| Auth     | `context/auth/`       | login, register, authStore                       |
| Product  | `context/product/`    | products list + detail + ProductCard             |
| Cart     | `context/cart/`       | cart page + cartStore                            |
| Checkout | `context/checkout/`   | checkout flow                                    |
| Order    | `context/order/`      | orders list + detail + cancel                    |
| Profile  | `context/profile/`    | user profile page                                |
| Admin    | `context/admin/`      | dashboard + 5 management pages                   |
