# AI DLC CRUD — Project Context

## Overview

A RESTful CRUD API built with Express.js, Sequelize ORM, and MySQL. Follows a clean layered architecture. Each domain (e.g., Product) has its own context docs under `context/<domain>/`.

---

## Tech Stack

| Layer      | Technology         |
| ---------- | ------------------ |
| Runtime    | Node.js            |
| Framework  | Express 5          |
| ORM        | Sequelize 6        |
| Database   | MySQL (via mysql2)  |
| Env Config | dotenv             |
| CORS       | cors               |
| Auth       | jsonwebtoken (JWT) |
| Hashing    | bcryptjs           |
| Migrations | sequelize-cli      |

---

## Project Structure

```
ai-dlc-crud/
├── .gitignore
└── backend/                              # All backend code lives here
    ├── .env                              # Environment variables
    ├── .env.example                      # Env template (committed)
    ├── .sequelizerc                      # Sequelize CLI path config
    ├── CONTEXT.md                        # This file — global project context
    ├── index.js                          # Application entry point
    ├── package.json
    ├── tests/                            # Integration tests (Jest + supertest)
    ├── context/                          # Domain-specific context docs
    │   ├── product/                      # Product context (model, service, controller, validation, routes)
    │   ├── category/                     # Category context
    │   ├── tag/                          # Tag context
    │   ├── user/                         # User context
    │   ├── auth/                         # Auth context (middleware + login/register)
    │   └── order/                        # Order context
    └── src/
        ├── app.js                        # Express app (exported for tests)
        ├── config/
        │   ├── database.js               # Sequelize instance & DB connection
        │   └── config.js                 # Sequelize CLI migration config
        ├── migrations/                   # Database migration files
        ├── seeders/                      # Database seed files
        ├── model/
        │   ├── Product.js
        │   ├── Category.js
        │   ├── Tag.js
        │   ├── User.js                   # User (admin + customer)
        │   ├── Order.js
        │   ├── OrderItem.js
        │   └── index.js                  # Barrel export + all associations
        ├── service/
        │   ├── productService.js
        │   ├── categoryService.js
        │   ├── tagService.js
        │   ├── userService.js
        │   ├── authService.js
        │   └── orderService.js
        ├── controller/
        │   ├── productController.js
        │   ├── categoryController.js
        │   ├── tagController.js
        │   ├── userController.js
        │   ├── authController.js
        │   └── orderController.js
        ├── middleware/
        │   ├── errorHandler.js           # Global error-handling middleware
        │   ├── auth.js                   # authenticate + authorizeAdmin
        │   └── validate.js               # All validation middlewares
        └── routes/
            ├── productRoutes.js
            ├── categoryRoutes.js
            ├── tagRoutes.js
            ├── userRoutes.js
            ├── authRoutes.js
            └── orderRoutes.js
```

---

## Architecture — Layered Pattern

```
Request
  │
  ▼
Routes          — Define endpoints, attach middleware & controller
  │
  ▼
Middleware      — Validate request body before reaching controller
  │
  ▼
Controller      — Parse request, call service, send response
  │
  ▼
Service         — Business rules, query building, DB operations via model
  │
  ▼
Model           — Sequelize model definition, table schema
  │
  ▼
Database        — MySQL via Sequelize connection
```

### Layer Rules

- **Routes** only wire paths to middleware + controller methods. No logic here.
- **Controller** only handles `req` / `res` / `next`. Never imports Sequelize or model directly.
- **Service** is the only layer that talks to the model/model. Contains all business logic.
- **Model** defines Sequelize models. No business logic here.
- **Middleware** handles cross-cutting concerns (validation, error handling).

---

## Environment Variables (.env)

```env
PORT=3000

DB_HOST=localhost
DB_PORT=3306
DB_NAME=ai_dlc_crud
DB_USER=root
DB_PASSWORD=

JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d
```

---

## Database Migrations

The project uses **sequelize-cli** for migration management instead of `sequelize.sync()`.

### Migration Files: `src/migrations/`

| File | Table |
|------|-------|
| `20260416000001-create-categories.js` | `categories` |
| `20260416000002-create-tags.js` | `tags` |
| `20260416000003-create-users.js` | `users` |
| `20260416000004-create-products.js` | `products` (FK → categories) |
| `20260416000005-create-product-tags.js` | `product_tags` (FK → products, tags) |
| `20260416000006-create-orders.js` | `orders` (FK → users) |
| `20260416000007-create-order-items.js` | `order_items` (FK → orders, products) |

### Migration Commands

```bash
npm run db:migrate            # Run all pending migrations
npm run db:migrate:undo       # Undo last migration
npm run db:migrate:undo:all   # Undo all migrations
npm run db:seed               # Run all seeders
npm run db:seed:undo          # Undo all seeders
```

### Migration Naming Convention

- Format: `YYYYMMDDHHMMSS-<action>-<table>.js` (e.g., `20260416000001-create-categories.js`).
- Each file exports `up` (apply) and `down` (rollback) functions.
- Tables with foreign keys must be created **after** the referenced table.
- All tables include `created_at` and `updated_at` timestamp columns.
- Foreign keys define `onUpdate: "CASCADE"` and `onDelete: "RESTRICT"` or `"CASCADE"` as appropriate.

### Config Files

- `.sequelizerc` — tells sequelize-cli where to find config, migrations, and seeders.
- `src/config/config.js` — DB credentials per environment (reads from `.env`).

---

## Database Config (`src/config/database.js`)

- Create a single Sequelize instance using env vars.
- Dialect: `mysql`.
- Disable SQL logging (`logging: false`).
- Export the sequelize instance.

---

## Global Middleware

### Error Handler (`src/middleware/errorHandler.js`)

A 4-argument Express middleware `(err, req, res, next)`:

- Logs `err.stack` to console.
- `SequelizeValidationError` → `400` with `{ success: false, message: "Validation error", errors: [array of messages] }`.
- `SequelizeUniqueConstraintError` → `409` with `{ success: false, message: "Duplicate entry", errors: [array of field names] }`.
- Everything else → `500` with `{ success: false, message: "Internal server error" }`.

---

## Entry Point (`index.js`)

1. Load `dotenv` config.
2. Import `express`, `cors`, `{ sequelize }` from model, routes, and error handler.
3. Create Express app.
4. Apply `cors()` and `express.json()` middleware.
5. Mount domain routes:
   - `app.use("/api/auth", authRoutes)` — public + protected
   - `app.use("/api/users", userRoutes)` — admin-only
   - `app.use("/api/products", productRoutes)`
   - `app.use("/api/categories", categoryRoutes)`
   - `app.use("/api/tags", tagRoutes)`
   - `app.use("/api/orders", orderRoutes)`
6. Add health-check route: `GET /` → `{ message: "AI DLC CRUD API is running" }`.
7. Apply `errorHandler` as last middleware.
8. Authenticate database connection with `sequelize.authenticate()`.
9. On success, start server on `PORT` and log message.
10. On failure, log error message.
11. **Note**: Tables are managed by migrations (`npm run db:migrate`), not `sequelize.sync()`.

---

## Coding Conventions

- **File naming**: camelCase for files (e.g., `productLogic.js`), PascalCase for model files (e.g., `Product.js`).
- **Variable naming**: camelCase in JS, snake_case for DB columns (handled by `underscored: true`).
- **Quotes**: Double quotes for strings.
- **Semicolons**: Always use semicolons.
- **Error handling**: Controllers use try/catch and delegate to `next(error)`. Never crash the server.
- **Response format**: Always return `{ success: boolean, message?: string, data?: any, errors?: string[] }`.
- **No hardcoded values**: All config comes from `.env`.

---

## Domain Contexts

| Domain   | Docs Location     | Description                          |
| -------- | ----------------- | ------------------------------------ |
| Product  | `context/product/`   | Products with category FK & tags M2M |
| Category | `context/category/`  | Product categories (1:M with Product)|
| Tag      | `context/tag/`       | Product tags (M:M with Product)      |
| User     | `context/user/`      | User accounts (admin + customer)     |
| Auth     | `context/auth/`      | Registration, login, JWT, middleware |
| Order    | `context/order/`     | Orders with items, stock management  |

---

## Relationships Overview

```
Category (1) ──── (M) Product (M) ──── (M) Tag
                         │
                    product_tags
                   (junction table)

User (1) ──── (M) Order (1) ──── (M) OrderItem (M) ──── (1) Product
```

- **Category → Product**: One-to-Many. FK: `products.category_id`.
- **Product ↔ Tag**: Many-to-Many. Through `product_tags` junction table.
- **User → Order**: One-to-Many. FK: `orders.user_id`.
- **Order → OrderItem**: One-to-Many. FK: `order_items.order_id`.
- **Product → OrderItem**: One-to-Many. FK: `order_items.product_id`.
