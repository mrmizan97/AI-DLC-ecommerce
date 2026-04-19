# Admin — Tags

## File: `src/app/admin/tags/page.js`

Route: `/admin/tags`

Simple CRUD for tags.

---

## Table Columns
- ID
- Name
- Actions (Edit, Delete)

---

## Modal Form
- Name (required, max 50 chars)

---

## API Calls

| Action | Endpoint |
|--------|----------|
| List   | `GET /tags` |
| Create | `POST /tags` |
| Update | `PUT /tags/:id` |
| Delete | `DELETE /tags/:id` |

---

## Notes
- Tags are attached/detached to products via:
  - `POST /products/:id/tags` with `{ tag_ids: [...] }`
  - `DELETE /products/:id/tags` with `{ tag_ids: [...] }`
- Deleting a tag cascades through `product_tags` join table (backend `onDelete: CASCADE`).
- Duplicate names return 409.
