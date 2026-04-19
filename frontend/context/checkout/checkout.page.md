# Checkout — Page

## File: `src/app/checkout/page.js`

Route: `/checkout`

Collects shipping details and places the order via backend API.

---

## Access Control

- If `!user` → redirect to `/login` + toast.
- If cart is empty → redirect to `/cart`.

---

## Form Fields

| Field             | Required | Notes                          |
| ----------------- | -------- | ------------------------------ |
| Full Address      | Yes      | Multi-line textarea            |
| Phone             | Yes      | Prefilled from `user.phone`   |
| Order Note        | No       | Optional instructions         |

---

## Submit Flow

1. Build payload:
   ```js
   {
     shipping_address,
     phone,
     note,
     items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity }))
   }
   ```
2. `POST /api/orders` with JWT (auto-attached by axios interceptor).
3. On success:
   - Toast "Order placed successfully!"
   - `cartStore.clear()`
   - Redirect to `/orders/{new order id}`
4. On failure (e.g., insufficient stock) → toast error from API.

---

## Order Summary (sidebar)

- Lists each item: `name × qty` and line total.
- Shows grand total at the bottom (primary color).

---

## State Dependencies

- `useCartStore` — `items`, `totalAmount`, `clear`.
- `useAuthStore` — `user`.
