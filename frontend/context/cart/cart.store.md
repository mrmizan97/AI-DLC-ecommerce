# Cart — Store

## File: `src/store/cartStore.js`

Zustand store for the shopping cart. Persisted to `localStorage` so cart survives page refresh / tab close.

---

## State

```js
{
  items: [
    {
      product_id: number,
      name: string,
      price: number,         // parsed float (not string like from API)
      image_url: string | null,
      stock: number,         // snapshot at add time
      quantity: number,
    },
    ...
  ]
}
```

---

## Actions

### `addItem(product, quantity = 1)`
- If item with `product_id` already exists → increments quantity.
- Else → pushes a new entry.
- Stores a snapshot of `price`, `name`, `image_url`, `stock` so cart works without refetching.

### `removeItem(productId)`
- Removes item by `product_id`.

### `updateQuantity(productId, quantity)`
- If `quantity <= 0` → calls `removeItem()`.
- Else → sets new quantity.

### `clear()`
- Empties the cart. Called after successful checkout.

### `totalItems()` (selector)
- Returns sum of `quantity` across all items — drives the header cart badge.

### `totalAmount()` (selector)
- Returns sum of `price × quantity` — shown in cart + checkout summaries.

---

## Persistence

- Key: `"cart-storage"` via Zustand `persist`.
- Full cart auto-rehydrates on page load.

---

## Consumers

| Component/Page | Uses |
|----------------|------|
| Header | `totalItems()` (badge) |
| ProductCard | `addItem()` |
| Product Detail | `addItem()` |
| Cart page | `items`, `removeItem`, `updateQuantity`, `totalAmount` |
| Checkout | `items`, `totalAmount`, `clear()` |
