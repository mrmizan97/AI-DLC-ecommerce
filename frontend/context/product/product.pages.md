# Product — Pages

## Files
- `src/app/page.js` — Home page (featured products + categories)
- `src/app/products/page.js` — Product listing with filters
- `src/app/products/[id]/page.js` — Product detail

---

## Home Page (`/`)

### Sections
1. **Hero Banner** — "Mega Sale" promo with CTA button to `/products`.
2. **Shop by Category** — 6-column grid of categories (auto-loaded via `GET /categories`).
3. **Flash Deals** — 12 featured products in responsive grid (`GET /products?limit=12`).

### API Calls
- `GET /categories` — populates category grid.
- `GET /products?limit=12` — populates featured products.

---

## Products List Page (`/products`)

### Filters (sidebar)
- **Category** — dropdown from loaded categories.
- **Price Range** — min and max numeric inputs.
- **Sort By** — Newest / Price Low–High / Price High–Low / Name A–Z.
- **Search** — comes from URL query param `?search=`, typically set by header search.
- **Clear All** button.

### URL Sync
- Reads initial filters from `useSearchParams()` (e.g., `?category_id=3&search=mouse`).
- Updates API call as filters change (does not push back to URL — state-local).
- Page defaults: `page=1, limit=12, sort_by=created_at, sort_order=DESC`.

### Pagination
- Prev / Next buttons + "Page X of Y" display.
- Uses `pagination` object returned by backend.

### API Call
```
GET /products?page=&limit=12&category_id=&min_price=&max_price=&sort_by=&sort_order=&search=
```

### Notes
- Wrapped in `<Suspense>` because `useSearchParams()` requires it.

---

## Product Detail Page (`/products/[id]`)

### Layout
- 2-column: image on left, info on right.
- Shows: name, brand, category, price, SKU, description, tags, stock status.

### Actions
- **Quantity selector** (+/-) respecting `product.stock` max.
- **Add to Cart** → `cartStore.addItem(product, qty)` + toast.
- **Buy Now** → adds to cart and redirects to `/cart`.

### API Call
- `GET /products/:id` — includes category + tags via backend `include`.

### Empty / Error States
- 404 → shows "Product not found".
- Out of stock → "Out of Stock" badge, both buttons disabled.
