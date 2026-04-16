# Product — Model

## File: `src/model/Product.js`

Defines the Sequelize model for the `products` table.

---

## Table: `products`

| Column      | Type                                       | Constraints             |
| ----------- | ------------------------------------------ | ----------------------- |
| id          | INTEGER                                    | PK, Auto Increment      |
| name        | STRING(255)                                | NOT NULL                |
| description | TEXT                                       | nullable                |
| price       | DECIMAL(10, 2)                             | NOT NULL, default 0.00  |
| stock       | INTEGER                                    | NOT NULL, default 0     |
| category_id | INTEGER                                    | NOT NULL, FK → categories.id |
| brand       | STRING(100)                                | nullable                |
| sku         | STRING(50)                                 | NOT NULL, UNIQUE        |
| image_url   | STRING(500)                                | nullable                |
| status      | ENUM('active', 'inactive', 'discontinued') | default 'active'        |
| created_at  | DATE (auto)                                | Sequelize timestamps    |
| updated_at  | DATE (auto)                                | Sequelize timestamps    |

---

## Relationships

### Category (Many-to-One)

- A Product **belongs to** one Category.
- FK: `category_id` → `categories.id`.
- Defined as: `Product.belongsTo(Category, { foreignKey: "category_id", as: "category" })`.
- Reverse: `Category.hasMany(Product, { foreignKey: "category_id", as: "products" })`.

### Tags (Many-to-Many)

- A Product has many Tags through the junction table `product_tags`.
- Defined as: `Product.belongsToMany(Tag, { through: "product_tags", foreignKey: "product_id", otherKey: "tag_id", as: "tags" })`.
- Reverse: `Tag.belongsToMany(Product, { through: "product_tags", foreignKey: "tag_id", otherKey: "product_id", as: "products" })`.

### Junction Table: `product_tags`

| Column     | Type    | Constraints                |
| ---------- | ------- | -------------------------- |
| product_id | INTEGER | FK → products.id, NOT NULL |
| tag_id     | INTEGER | FK → tags.id, NOT NULL     |
| created_at | DATE    | Sequelize timestamps       |
| updated_at | DATE    | Sequelize timestamps       |

- Composite PK: `(product_id, tag_id)`.

---

## Model Options

```js
{
  tableName: "products",
  timestamps: true,
  underscored: true
}
```

---

## Barrel Export: `src/model/index.js`

- Import `sequelize` instance from `../config/database`.
- Import all models: `Product`, `Category`, `Tag`.
- **Define all associations here** (not in individual model files).
- Export `{ sequelize, Product, Category, Tag }`.

---

## Notes

- `sku` is unique — used as a business identifier for each product.
- `underscored: true` means Sequelize auto-maps `createdAt` → `created_at` in the DB.
- `status` controls product visibility: `active` (default), `inactive`, or `discontinued`.
- `category_id` replaces the old `category` string column — now references the `categories` table.
