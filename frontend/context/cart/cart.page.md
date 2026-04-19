# Cart — Page

## File: `src/app/cart/page.js`

Route: `/cart`

Shopping cart view with quantity controls, remove actions, and order summary.

---

## Layout

- 2-column on desktop: items list on left, order summary on right (sticky).
- Stacked on mobile.

---

## Empty State

- Shows shopping bag icon, "Your cart is empty" message, and a "Continue Shopping" button → `/products`.

---

## Item Row

Each cart item displays:
- Thumbnail image
- Name (clickable → `/products/{id}`)
- Price
- Quantity stepper (+/-) — 0 auto-removes
- Trash icon to remove

---

## Order Summary (sticky sidebar)

- Subtotal (sum of `price × quantity`)
- Shipping: Free
- Total (bold, primary color)
- **Proceed to Checkout** button:
  - If not logged in → redirect to `/login` with toast.
  - If logged in → redirect to `/checkout`.

---

## State Dependencies

- `useCartStore` — `items`, `updateQuantity()`, `removeItem()`, `totalAmount()`.
- `useAuthStore` — `user` (for checkout gate).
