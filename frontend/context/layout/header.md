# Layout — Header

## File: `src/components/Header.js`

Top navigation bar rendered on every page via the root `layout.js`. Daraz-inspired orange theme.

---

## Structure

```
[Logo]  [Search Input + button] [Cart] [User menu / Login + Signup] [Mobile menu toggle]
```

---

## Features

- **Logo** — clickable link back to `/`.
- **Search bar** — submits to `/products?search=<query>`.
- **Cart icon** — shows total item count badge (from `cartStore.totalItems()`).
- **User menu (if logged in)** — hover dropdown with:
  - Profile
  - My Orders
  - Admin Dashboard (only if `user.role === "admin"`)
  - Logout
- **Login / Sign Up** (if not logged in).
- **Mobile menu** — collapsible nav on small screens.

---

## State Dependencies

- `useAuthStore` — reads `user`, calls `logout()`.
- `useCartStore` — reads `totalItems()`.

---

## Notes

- Client component (`"use client"`) because it uses hooks and interactivity.
- Uses `useRouter().push()` for search redirect and logout redirect.
- Sticky positioned (`sticky top-0 z-50`) so it stays visible on scroll.
