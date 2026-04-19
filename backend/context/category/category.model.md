# Category — Model

## File: `src/model/Category.js`

Defines the Sequelize model for the `categories` table.

---

## Table: `categories`

| Column      | Type         | Constraints        |
| ----------- | ------------ | ------------------ |
| id          | INTEGER      | PK, Auto Increment |
| name        | STRING(100)  | NOT NULL, UNIQUE   |
| description | TEXT         | nullable           |
| created_at  | DATE (auto)  | Sequelize timestamps |
| updated_at  | DATE (auto)  | Sequelize timestamps |

---

## Relationships

- `Category.hasMany(Product, { foreignKey: "category_id", as: "products" })`.
- One category can have many products.

---

## Model Options

```js
{
  tableName: "categories",
  timestamps: true,
  underscored: true
}
```

---

## Notes

- `name` is unique — no duplicate category names allowed.
- Associations are defined in `src/model/index.js`, not in this file.
