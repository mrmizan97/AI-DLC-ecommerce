# Product — Card Component

## File: `src/components/ProductCard.js`

Reusable product tile used on:
- Home page (Flash Deals section)
- Products list page

---

## Props

| Prop    | Type   | Description                     |
| ------- | ------ | ------------------------------- |
| product | object | Full product object from `/api/products` |

---

## Display

- Square image on top (or first letter fallback if no image).
- "Out of Stock" overlay if `product.stock === 0`.
- Name (line-clamped to 2 lines), brand below.
- Price in primary orange color.
- Small "add to cart" button (cart icon) in the corner.

---

## Interaction

- **Card click** → navigates to `/products/{product.id}`.
- **Add to cart button** → calls `cartStore.addItem(product)` (with `preventDefault` + `stopPropagation` to avoid navigation), shows toast.

---

## State

- `useCartStore` — reads `addItem` action.

---

## Styling

- Hover: shadow lift + image scale-105 via `group-hover`.
- Responsive grid — used inside a `grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6` parent on home, and `grid-cols-2 md:grid-cols-3 lg:grid-cols-4` on listing.
