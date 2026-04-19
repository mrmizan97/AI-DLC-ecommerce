# Admin — Products

## File: `src/app/admin/products/page.js`

Route: `/admin/products`

Full CRUD for products in a table + modal form.

---

## Table Columns

| Column | Source |
|--------|--------|
| Image | `image_url` or first-letter fallback |
| Name | `product.name` |
| SKU | `product.sku` |
| Category | `product.category.name` (eager-loaded) |
| Price | `$X.XX` |
| Stock | integer |
| Status | colored badge (active/inactive/discontinued) |
| Actions | Edit + Delete icons |

---

## Modal Form Fields

| Field | Type | Required |
|-------|------|----------|
| Name | text | Yes |
| SKU | text | Yes |
| Price | number (step 0.01) | Yes |
| Stock | number | Yes |
| Category | select from loaded categories | Yes |
| Brand | text | No |
| Image URL | text | No |
| Description | textarea | No |
| Status | select (active/inactive/discontinued) | Yes |

---

## API Calls

| Action | Endpoint |
|--------|----------|
| List | `GET /products?limit=100` |
| List categories for dropdown | `GET /categories` |
| Create | `POST /products` |
| Update | `PUT /products/:id` |
| Delete | `DELETE /products/:id` |

---

## Flow

- **Add Product** button opens modal with empty form → submit → `POST` → refetch.
- **Edit** icon opens modal pre-filled with product → submit → `PUT /products/:id` → refetch.
- **Delete** icon shows `confirm()` → `DELETE` → refetch.
- All errors show toast from `err.response?.data?.message`.
