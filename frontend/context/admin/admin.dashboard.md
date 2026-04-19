# Admin — Dashboard

## File: `src/app/admin/page.js`

Route: `/admin`

Summary page with stat cards, charts, and recent orders table.

---

## Stat Cards (6)

| Card       | Source                                           |
| ---------- | ------------------------------------------------ |
| Revenue    | Sum of `total_amount` of non-cancelled orders    |
| Orders     | `pagination.total` from `GET /orders?limit=100`  |
| Users      | `pagination.total` from `GET /users?limit=100`   |
| Products   | `pagination.total` from `GET /products?limit=100`|
| Categories | Count of `GET /categories`                       |
| Tags       | Count of `GET /tags`                             |

---

## Charts (Recharts)

### 1. Line Chart — Orders over last 7 days
- X-axis: last 7 dates (short month + day).
- Y-axis: order count per day.
- Groups orders by `created_at` date string.

### 2. Pie Chart — Order Status Distribution
- Slices: pending, confirmed, shipped, delivered, cancelled.
- Color-coded to match the rest of the app (yellow/blue/purple/green/red).

### 3. Bar Chart — Top 5 Products by Stock
- Sorts all products by `stock` descending, takes top 5.
- Bar color: secondary cyan.

### 4. Pie Chart — Users by Role
- Two slices: admin (orange), customer (cyan).

---

## Recent Orders Table

- Shows last 5 orders.
- Columns: Order ID, Customer, Total, Status (colored chip), Date.

---

## API Calls (parallel)

```js
Promise.all([
  api.get("/products?limit=100"),
  api.get("/categories"),
  api.get("/tags"),
  api.get("/orders?limit=100"),
  api.get("/users?limit=100"),
])
```

---

## Notes

- Loading state shows stat-card skeletons + a large skeleton for charts.
- All data lives in local `useState` — no global store needed.
- Charts use `ResponsiveContainer` so they adapt to container width.
