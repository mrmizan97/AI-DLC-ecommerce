# Order — Service

## File: `src/service/orderService.js`

Contains all business logic for Order operations. Handles order creation with stock management, and order listing with eager loading.

---

## Exports

An object `orderService` with the following async methods:

---

### `create(userId, data)`

- Accepts `userId` (from `req.user.id`) and `data`: `{ shipping_address, phone, note, items }`.
- `items` is an array of `{ product_id, quantity }`.
- **Steps:**
  1. Start a Sequelize transaction.
  2. For each item, find the Product by PK.
     - If product not found → throw error `"Product with id X not found"`.
     - If product stock < quantity → throw error `"Insufficient stock for product X"`.
  3. Calculate `total_amount` by summing `product.price * quantity` for all items.
  4. Create the Order with `user_id`, `status: "pending"`, `total_amount`, `shipping_address`, `phone`, `note`.
  5. Create OrderItems with `order_id`, `product_id`, `quantity`, `price` (copied from product).
  6. Decrement each product's stock by the ordered quantity.
  7. Commit transaction.
  8. Return the order with items eager loaded.
- If any step fails → rollback transaction and throw error.

---

### `findAll(query, userId, role)`

| Param   | Type   | Default      | Description                         |
| ------- | ------ | ------------ | ----------------------------------- |
| page    | number | 1            | Current page number                 |
| limit   | number | 10           | Records per page                    |
| status  | string | —            | Filter by order status              |

- If `role` is `"customer"` → filter by `user_id` (customers see only their own orders).
- If `role` is `"admin"` → no user filter (admins see all orders).
- Always include:
  - `User` as `"user"` (attributes: `["id", "name", "email"]`).
  - `OrderItem` as `"items"` which includes `Product` as `"product"` (attributes: `["id", "name", "image_url"]`).
- Order by `created_at DESC`.
- Uses `Order.findAndCountAll` with `distinct: true`.
- Returns `{ data: rows, pagination: { total, page, limit, totalPages } }`.

---

### `findById(id, userId, role)`

- Finds order by PK with same includes as `findAll`.
- If `role` is `"customer"` and order's `user_id` !== `userId` → return `null` (customer can't view others' orders).
- Returns the record or `null`.

---

### `updateStatus(id, status)`

- Admin-only operation.
- Finds order by PK. If not found → returns `null`.
- If current status is `"cancelled"` or `"delivered"` → returns `{ error: "Cannot update a completed order" }`.
- Calls `record.update({ status })`.
- Returns the updated record.

---

### `cancel(id, userId, role)`

- Finds order by PK. If not found → returns `null`.
- If `role` is `"customer"` and order's `user_id` !== `userId` → return `null`.
- If status is not `"pending"` → returns `{ error: "Only pending orders can be cancelled" }`.
- **Steps (in transaction):**
  1. Update order status to `"cancelled"`.
  2. For each order item, restore product stock by adding back the quantity.
  3. Commit transaction.
- Returns the updated order.
