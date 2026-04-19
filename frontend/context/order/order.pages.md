# Order — Pages

## Files
- `src/app/orders/page.js` — Order list (user's own)
- `src/app/orders/[id]/page.js` — Order detail + cancel

---

## Access Control

Both routes redirect to `/login` if not authenticated.

---

## Orders List Page (`/orders`)

### Display
- Loops through user's orders (returned by backend — backend filters by `user_id` when role is `customer`).
- Each card shows: Order #ID, date, item count, total, status badge (color-coded).
- Card click → `/orders/{id}`.

### Empty State
- Package icon, "You don't have any orders yet", "Start Shopping" button → `/products`.

### API Call
- `GET /orders` (JWT-authenticated)

### Status Badge Colors
- `pending` — yellow
- `confirmed` — blue
- `shipped` — purple
- `delivered` — green
- `cancelled` — red

---

## Order Detail Page (`/orders/[id]`)

### Sections
1. **Header** — Order #ID, timestamp, status badge.
2. **Items** — list with thumbnail, name, qty × price, line total.
3. **Shipping Address** — `shipping_address`, `phone`.
4. **Note** — if provided.
5. **Total** — big primary color display.
6. **Cancel Order** button — **only shown if `order.status === "pending"`**.

### API Calls
- `GET /orders/:id` — loads order with items, products, user.
- `PATCH /orders/:id/cancel` — customer can cancel pending orders; stock is restored by the backend.

### Cancel Flow
1. `confirm()` prompt.
2. On confirm → `PATCH /orders/:id/cancel`.
3. On success → refetch order + toast.
4. On failure → toast message from API (e.g., "Only pending orders can be cancelled").

---

## Notes

- Customer can only see/cancel their own orders (backend enforced).
- Admin sees/manages all orders via `/admin/orders`.
