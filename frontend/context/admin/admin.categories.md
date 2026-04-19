# Admin — Categories

## File: `src/app/admin/categories/page.js`

Route: `/admin/categories`

Simple CRUD for categories.

---

## Table Columns
- ID
- Name
- Description
- Actions (Edit, Delete)

---

## Modal Form
- Name (required)
- Description (optional)

---

## API Calls

| Action | Endpoint |
|--------|----------|
| List   | `GET /categories` |
| Create | `POST /categories` |
| Update | `PUT /categories/:id` |
| Delete | `DELETE /categories/:id` |

---

## Notes
- Categories are the only way to group products, so deleting a category with products attached will fail (backend `onDelete: RESTRICT` on `products.category_id`).
- Duplicate names return 409 (backend `unique: true` on `name`).
