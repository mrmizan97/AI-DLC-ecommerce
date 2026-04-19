# Admin — Orders

## File: `src/app/admin/orders/page.js`

Route: `/admin/orders`

View and manage all orders across all customers.

---

## Filters

- **Status dropdown** — all / pending / confirmed / shipped / delivered / cancelled.
- Re-fetches when filter changes.

---

## Table Columns

| Column | Source |
|--------|--------|
| Order ID | `order.id` |
| Customer | `user.name` + `user.email` below |
| Items | `items.length` |
| Total | `$X.XX` |
| Status | **inline select** — change on pick |
| Date | `created_at` short date |
| Actions | Eye icon → detail modal |

---

## Status Change (inline)

- Each row has a status `<select>` styled as a chip.
- Changing value fires `PATCH /orders/:id/status` with `{ status }`.
- Disabled when status is `delivered` or `cancelled` (completed orders).

---

## Detail Modal

Opens on Eye icon click. Shows:
- Customer info
- Full shipping address + phone
- Order note (if any)
- All line items with name × qty and line total
- Grand total

---

## API Calls

| Action | Endpoint |
|--------|----------|
| List | `GET /orders?status=<filter>` |
| Change status | `PATCH /orders/:id/status` |

---

## Notes

- Admin sees ALL orders (backend behaviour when `role === "admin"`).
- Cancellation flow for admin still uses `PATCH /orders/:id/cancel` (same as customer) — restores stock transactionally.
- Customer-facing cancel action is not exposed on this page.
