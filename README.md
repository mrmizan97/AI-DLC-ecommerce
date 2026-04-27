# AI-DLC Shop

A full-stack e-commerce platform built with Node.js + Express (backend) and Next.js (frontend). Supports multi-vendor selling, AI-powered features, real-time notifications, and a full admin dashboard.

---

## Table of Contents

- [Requirements](#requirements)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [1. Clone & Install](#1-clone--install)
  - [2. Configure Environment](#2-configure-environment)
  - [3. Set Up the Database](#3-set-up-the-database)
  - [4. Run the Servers](#4-run-the-servers)
- [Running Tests](#running-tests)
- [Features & How to Use Them](#features--how-to-use-them)
  - [Authentication](#authentication)
  - [Products & Categories](#products--categories)
  - [Product Variants](#product-variants)
  - [Shopping Cart & Checkout](#shopping-cart--checkout)
  - [Coupon / Discount Codes](#coupon--discount-codes)
  - [Flash Sales](#flash-sales)
  - [Orders](#orders)
  - [Payments (SSLCommerz)](#payments-sslcommerz)
  - [Wishlist](#wishlist)
  - [Address Book](#address-book)
  - [Product Comparison](#product-comparison)
  - [Search & Autocomplete](#search--autocomplete)
  - [Reviews & Ratings](#reviews--ratings)
  - [Return Requests](#return-requests)
  - [Notifications (Real-time)](#notifications-real-time)
  - [Email Notifications](#email-notifications)
  - [Low Stock Alerts](#low-stock-alerts)
  - [Bulk Product Import](#bulk-product-import)
  - [Sales Reports & Export](#sales-reports--export)
  - [Activity Log](#activity-log)
  - [Multi-vendor / Seller](#multi-vendor--seller)
  - [Media Uploads](#media-uploads)
  - [AI Features](#ai-features)
  - [AI Chatbot](#ai-chatbot)
- [API Reference](#api-reference)
- [Admin Panel](#admin-panel)

---

## Requirements

| Tool | Version |
|---|---|
| Node.js | v18+ |
| MySQL | 8.0+ |
| npm | 9+ |

---

## Project Structure

```
ai-dlc-crud/
├── backend/          # Express API + Sequelize ORM
│   ├── src/
│   │   ├── controller/
│   │   ├── service/
│   │   ├── model/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── migrations/
│   ├── tests/
│   └── index.js
└── frontend/         # Next.js 16 App Router
    └── src/
        ├── app/
        ├── components/
        ├── store/
        └── lib/
```

---

## Getting Started

### 1. Clone & Install

```bash
git clone <repo-url>
cd ai-dlc-crud

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment

**Backend** — create `backend/.env` from the example:

```bash
cp backend/.env.example backend/.env
```

Fill in these values:

```env
PORT=3000

# MySQL database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=ai_dlc_crud
DB_USER=root
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=7d

# SSLCommerz payment gateway (sandbox by default)
SSLCZ_STORE_ID=testbox
SSLCZ_STORE_PASSWORD=qwerty
SSLCZ_IS_LIVE=false

# URLs
FRONTEND_URL=http://localhost:3001
BACKEND_URL=http://localhost:3000

# Email (optional — leave blank to disable)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=AI-DLC Shop <your@gmail.com>

# AI features (optional — leave blank to use fallback responses)
ANTHROPIC_API_KEY=sk-ant-...
```

**Frontend** — create `frontend/.env.local`:

```bash
cp frontend/.env.example frontend/.env.local
```

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### 3. Set Up the Database

Create the database in MySQL first:

```sql
CREATE DATABASE ai_dlc_crud;
```

Then run all migrations:

```bash
cd backend
npm run db:migrate
```

Optionally seed demo data:

```bash
npm run db:seed
```

To undo all migrations:

```bash
npm run db:migrate:undo:all
```

### 4. Run the Servers

Open two terminals:

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# Server runs on http://localhost:3000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
# App runs on http://localhost:3001
```

Open your browser at `http://localhost:3001`.

---

## Running Tests

Tests use Jest + Supertest against a real MySQL database. Make sure the database is running and `.env` is configured.

```bash
cd backend
npm test
```

All 305 tests should pass. Test output shows each feature suite (auth, products, orders, wishlist, coupons, etc.).

---

## Features & How to Use Them

### Authentication

- **Register:** `POST /api/auth/register` — `{ name, email, password, phone }`
- **Login:** `POST /api/auth/login` — `{ email, password }` → returns JWT token
- **Profile:** `GET /api/auth/profile` (requires token)

Roles: `customer` (default), `admin`, `vendor`

---

### Products & Categories

Browse products at `/products`. Filter by category, price range, brand, tags, date, and sort by price or date.

Admin can create, edit, and delete products at `/admin/products`.

```bash
GET  /api/products?search=mouse&min_price=100&max_price=500&sort_by=price&sort_order=ASC&page=1&limit=10
GET  /api/products/:id
POST /api/products          # admin
PUT  /api/products/:id      # admin
DELETE /api/products/:id    # admin
```

---

### Product Variants

Products can have size, color, or material variants with their own price and stock.

```bash
GET    /api/product-variants?product_id=1
POST   /api/product-variants           # admin: { product_id, variant_type, variant_value, price, stock, sku }
PUT    /api/product-variants/:id       # admin
DELETE /api/product-variants/:id       # admin
```

On the product detail page, variant selectors appear automatically when variants exist. Selecting one updates the displayed price and stock.

---

### Shopping Cart & Checkout

Cart is stored in the browser (localStorage). No login required to add items.

1. Browse to `/products` and click **Add to Cart**
2. Go to `/cart` to review items and quantities
3. Go to `/checkout` to place the order

Checkout form: shipping address, phone number, payment method (cash / online).

---

### Coupon / Discount Codes

Admins create coupon codes at `/admin/coupons`.

```bash
POST /api/coupons              # admin: { code, type, value, min_order_amount, max_uses, expires_at }
POST /api/coupons/validate     # { code, order_amount } → returns discount amount
GET  /api/coupons              # admin: list all
PUT  /api/coupons/:id          # admin
DELETE /api/coupons/:id        # admin
```

**Types:**
- `percentage` — e.g. value=10 means 10% off
- `fixed` — e.g. value=50 means 50 taka off

On the checkout page, enter a coupon code in the **Coupon Code** field and click **Apply**. The discount shows in the order summary.

---

### Flash Sales

Admins create time-limited sale prices at `/admin/flash-sales`.

```bash
POST /api/flash-sales          # admin: { product_id, sale_price, original_price, start_time, end_time, stock_limit }
GET  /api/flash-sales          # list all
GET  /api/flash-sales/active   # currently running sales only
GET  /api/flash-sales?active_only=true
PUT  /api/flash-sales/:id      # admin
DELETE /api/flash-sales/:id    # admin
```

Active flash sales appear at `/flash-sales` with a live countdown timer. On the product detail page, the flash sale price replaces the normal price automatically.

---

### Orders

```bash
POST /api/orders               # place order: { shipping_address, phone, items: [{ product_id, quantity }] }
GET  /api/orders               # user: own orders | admin: all orders
GET  /api/orders/:id           # order detail
PUT  /api/orders/:id           # admin: update status
```

**Order statuses:** `pending → confirmed → shipped → delivered → cancelled`

Stock is automatically deducted on order creation and restored if cancelled.

---

### Payments (SSLCommerz)

For online payment at checkout:

1. Select **Online Payment** at checkout
2. Redirected to SSLCommerz gateway
3. After payment: redirected to `/payment/success`, `/payment/fail`, or `/payment/cancel`

```bash
POST /api/payment/initiate     # start payment: { order_id }
POST /api/payment/success      # callback from gateway
POST /api/payment/fail
POST /api/payment/cancel
```

For sandbox testing use card number `4111111111111111`, any future expiry, any CVV.

---

### Wishlist

Save products for later. Requires login.

```bash
GET    /api/wishlist                    # list wishlist items
POST   /api/wishlist                    # { product_id }
DELETE /api/wishlist/:productId         # remove item
GET    /api/wishlist/:productId/check   # { wishlisted: true/false }
```

On the product detail page, click the **heart icon** to add/remove from wishlist. View all saved products at `/wishlist`.

---

### Address Book

Save multiple shipping addresses. Requires login.

```bash
GET    /api/addresses           # list addresses
POST   /api/addresses           # { label, recipient_name, phone, address_line, city, postal_code, country, is_default }
PUT    /api/addresses/:id       # update
DELETE /api/addresses/:id       # delete
PATCH  /api/addresses/:id/default  # set as default
```

Manage addresses at `/addresses`. On the checkout page, saved addresses appear in a dropdown to pre-fill the shipping form.

---

### Product Comparison

Compare up to 4 products side by side.

```bash
POST /api/compare    # { product_ids: [1, 2, 3] }
```

1. On any product page, click **Compare** to queue a product
2. Go to `/compare` to see the full comparison table
3. Or visit `/compare?ids=1,2,3` directly

The comparison table shows: price, stock, brand, category, rating, and description for each product.

---

### Search & Autocomplete

```bash
GET /api/search/autocomplete?q=mouse&limit=10    # fast name/brand/sku match
GET /api/search/search?q=&category_id=&min_price=&max_price=
GET /api/search/suggestions?q=                  # products + categories + tags combined
```

Visit `/search` for the dedicated search page. Toggle **AI Search** to use natural language — type something like `"cheap wireless headphones under 2000"` and Claude will extract the filters automatically.

---

### Reviews & Ratings

One review per user per product. Requires login.

```bash
GET  /api/products/:id/reviews    # list reviews
POST /api/products/:id/reviews    # { rating (1-5), comment }
GET  /api/reviews                 # admin: all reviews
DELETE /api/reviews/:id           # admin
```

Reviews and average ratings appear on the product detail page.

---

### Return Requests

Customers can request returns on delivered orders. Requires login.

```bash
POST /api/returns              # { order_id, reason }
GET  /api/returns/mine         # user's own requests
GET  /api/returns              # admin: all requests
PUT  /api/returns/:id          # admin: { status, admin_note, refund_amount }
```

**Statuses:** `pending → approved / rejected → refunded`

Go to `/returns` to submit a new return or track existing requests. Admins manage all returns at `/admin/returns`.

---

### Notifications (Real-time)

Socket.io pushes notifications to users and admins in real time.

```bash
GET /api/notifications    # list notifications for current user
```

Notifications fire when:
- A new order is placed (admin notified)
- Order status changes (customer notified)

Connect with Socket.io using the JWT token:
```js
const socket = io('http://localhost:3000', {
  auth: { token: 'Bearer <jwt>' }
});
socket.on('notification', (data) => console.log(data));
```

---

### Email Notifications

Configure `EMAIL_*` env vars to enable. Emails are sent automatically on:

| Event | Recipient |
|---|---|
| Registration | Customer (welcome email) |
| Order placed | Customer (confirmation) |
| Order status change | Customer |
| Return request update | Customer |
| Stock drops below threshold | Admin |

Email sending is non-blocking — a failed email never breaks the request.

---

### Low Stock Alerts

An alert is created automatically when product stock falls at or below 10 (default threshold) after an order.

```bash
GET   /api/low-stock              # admin: list alerts
GET   /api/low-stock/unresolved   # admin: unresolved only
PATCH /api/low-stock/:id/resolve  # admin: mark resolved
```

View and resolve alerts at `/admin/low-stock`. Rows are color-coded: red for stock=0, yellow for stock ≤ 5.

---

### Bulk Product Import

Import hundreds of products at once via CSV. Admin only.

```bash
GET  /api/bulk-import/template    # download CSV template
POST /api/bulk-import/import      # multipart/form-data: file (CSV)
```

**Steps:**
1. Go to `/admin/bulk-import`
2. Click **Download CSV Template** to get the correct column format
3. Fill in the CSV: `name, description, price, stock, category_id, brand, sku, image_url, status`
4. Upload the CSV file
5. The response shows how many rows succeeded and which rows failed with reasons

---

### Sales Reports & Export

```bash
GET /api/reports/summary?start_date=2026-01-01&end_date=2026-12-31&group_by=month
GET /api/reports/top-products?start_date=&end_date=&limit=10
GET /api/reports/top-customers?start_date=&end_date=&limit=10
GET /api/reports/export/csv    # download full report as CSV
GET /api/reports/export/json   # download full report as JSON
```

View the full dashboard at `/admin/reports`. Select a date range and click **Apply** to update all charts and tables. Export buttons download the report file directly.

---

### Activity Log

Every significant action (login, order update, product create, etc.) is recorded automatically.

```bash
GET /api/activity-logs              # admin: paginated log with filters
GET /api/activity-logs/mine        # user's own activity
```

Filter by: user, action type, entity type, date range. View at `/admin/activity-logs`.

---

### Multi-vendor / Seller

Users with the `vendor` role can manage their own product listings.

```bash
GET  /api/vendors/products          # vendor: own products
POST /api/vendors/products          # vendor: create product
PUT  /api/vendors/products/:id      # vendor: update own product
POST /api/vendors/withdrawals       # vendor: request payout
GET  /api/vendors/withdrawals       # vendor: own withdrawal history
```

Admins set a user's role to `vendor` via `/admin/users`.

---

### Media Uploads

Attach images to products, categories, or users.

```bash
POST /api/media/upload    # multipart/form-data: file, mediable_type (Product/Category/User), mediable_id
GET  /api/media/:type/:id # list media for an entity
```

Supports JPG, PNG, GIF, WebP. Max file size 5MB. Files saved to `backend/uploads/`.

---

### AI Features

Requires `ANTHROPIC_API_KEY` in `.env`. All endpoints have graceful fallbacks when the key is absent.

#### Product Recommendations
```bash
GET /api/ai/recommendations    # returns suggested products based on user history
```

#### Review Sentiment Analysis
```bash
POST /api/ai/sentiment              # { review_text } → { sentiment, confidence, themes, summary }
POST /api/ai/sentiment/bulk         # { review_ids: [1,2,3] } → array of results
```

#### Natural Language Search
```bash
POST /api/ai/search    # { query: "cheap red shoes under 1000" } → structured filters + matching products
```

#### AI Admin Panel
Visit `/admin/ai` for a UI with three tabs:
- **Sentiment Analysis** — paste any review text and analyze it
- **Recommendations** — get product suggestions for any user
- **Bulk Analysis** — select multiple reviews and analyze all at once

---

### AI Chatbot

A floating chat widget appears on every page (bottom-right corner). Click the orange button to open it.

The chatbot is powered by Claude and can help customers:
- Find products
- Answer questions about orders
- Give shopping advice

```bash
POST /api/ai/chat    # { message, conversation_history: [{ role, content }] }
```

No API key needed for the fallback response. Set `ANTHROPIC_API_KEY` for full AI responses.

---

## API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Register |
| POST | `/api/auth/login` | — | Login |
| GET | `/api/auth/profile` | user | Profile |
| GET | `/api/products` | — | List products |
| POST | `/api/products` | admin | Create product |
| GET | `/api/product-variants?product_id=` | — | Get variants |
| POST | `/api/wishlist` | user | Add to wishlist |
| GET | `/api/wishlist` | user | List wishlist |
| POST | `/api/addresses` | user | Add address |
| GET | `/api/addresses` | user | List addresses |
| POST | `/api/coupons/validate` | user | Validate coupon |
| GET | `/api/flash-sales/active` | — | Active flash sales |
| POST | `/api/orders` | user | Place order |
| POST | `/api/returns` | user | Submit return |
| POST | `/api/compare` | — | Compare products |
| GET | `/api/search/autocomplete?q=` | — | Autocomplete |
| POST | `/api/ai/search` | — | AI natural language search |
| POST | `/api/ai/chat` | — | Chatbot |
| POST | `/api/ai/sentiment` | admin | Analyze sentiment |
| GET | `/api/reports/summary` | admin | Sales summary |
| GET | `/api/reports/export/csv` | admin | Export CSV |
| POST | `/api/bulk-import/import` | admin | Bulk import CSV |
| GET | `/api/low-stock` | admin | Low stock alerts |
| GET | `/api/activity-logs` | admin | Activity log |

Full list: all routes are registered in `backend/src/app.js`.

---

## Admin Panel

Access at `http://localhost:3001/admin` (must be logged in as admin).

| Page | Path | Purpose |
|---|---|---|
| Dashboard | `/admin` | Stats overview with charts |
| Products | `/admin/products` | Full product CRUD |
| Categories | `/admin/categories` | Category management |
| Tags | `/admin/tags` | Tag management |
| Orders | `/admin/orders` | Order list + status update |
| Users | `/admin/users` | User management + role assignment |
| Reviews | `/admin/reviews` | Review moderation |
| Coupons | `/admin/coupons` | Coupon CRUD |
| Flash Sales | `/admin/flash-sales` | Flash sale scheduling |
| Returns | `/admin/returns` | Return request review |
| Activity Logs | `/admin/activity-logs` | Audit log viewer |
| Low Stock | `/admin/low-stock` | Stock alert dashboard |
| Bulk Import | `/admin/bulk-import` | CSV product import |
| Reports | `/admin/reports` | Sales analytics + export |
| AI Tools | `/admin/ai` | Sentiment analysis + recommendations |
