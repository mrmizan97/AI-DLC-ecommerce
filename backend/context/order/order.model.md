# Order — Model

## Files: `src/model/Order.js` & `src/model/OrderItem.js`

Defines the Sequelize models for the `orders` and `order_items` tables.

---

## Table: `orders`

| Column           | Type                                                        | Constraints             |
| ---------------- | ----------------------------------------------------------- | ----------------------- |
| id               | INTEGER                                                     | PK, Auto Increment      |
| user_id          | INTEGER                                                     | NOT NULL, FK → users.id |
| status           | ENUM('pending', 'confirmed', 'shipped', 'delivered', 'cancelled') | NOT NULL, default 'pending' |
| total_amount     | DECIMAL(10, 2)                                              | NOT NULL, default 0.00  |
| shipping_address | TEXT                                                        | NOT NULL                |
| phone            | STRING(20)                                                  | NOT NULL                |
| note             | TEXT                                                        | nullable                |
| created_at       | DATE (auto)                                                 | Sequelize timestamps    |
| updated_at       | DATE (auto)                                                 | Sequelize timestamps    |

### Model Options

```js
{
  tableName: "orders",
  timestamps: true,
  underscored: true
}
```

---

## Table: `order_items`

| Column     | Type           | Constraints                   |
| ---------- | -------------- | ----------------------------- |
| id         | INTEGER        | PK, Auto Increment            |
| order_id   | INTEGER        | NOT NULL, FK → orders.id      |
| product_id | INTEGER        | NOT NULL, FK → products.id    |
| quantity   | INTEGER        | NOT NULL, default 1           |
| price      | DECIMAL(10, 2) | NOT NULL                      |
| created_at | DATE (auto)    | Sequelize timestamps          |
| updated_at | DATE (auto)    | Sequelize timestamps          |

### Model Options

```js
{
  tableName: "order_items",
  timestamps: true,
  underscored: true
}
```

---

## Relationships

### User → Order (One-to-Many)
- `User.hasMany(Order, { foreignKey: "user_id", as: "orders" })`.
- `Order.belongsTo(User, { foreignKey: "user_id", as: "user" })`.

### Order → OrderItem (One-to-Many)
- `Order.hasMany(OrderItem, { foreignKey: "order_id", as: "items" })`.
- `OrderItem.belongsTo(Order, { foreignKey: "order_id", as: "order" })`.

### Product → OrderItem (One-to-Many)
- `Product.hasMany(OrderItem, { foreignKey: "product_id", as: "order_items" })`.
- `OrderItem.belongsTo(Product, { foreignKey: "product_id", as: "product" })`.

---

## Barrel Export: `src/model/index.js`

- Add `Order` and `OrderItem` to the barrel export.
- Define all new associations here.
- Export `{ sequelize, Product, Category, Tag, User, Order, OrderItem }`.

---

## Notes

- `total_amount` is calculated in the service layer by summing `quantity * price` for all items.
- `price` in `order_items` is the product price **at the time of order** — it is copied from the product, not referenced. This preserves pricing history even if the product price changes later.
- When an order is created, the product `stock` should be decremented by the ordered `quantity`.
