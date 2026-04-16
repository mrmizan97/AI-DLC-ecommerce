# Tag — Model

## File: `src/model/Tag.js`

Defines the Sequelize model for the `tags` table.

---

## Table: `tags`

| Column     | Type         | Constraints        |
| ---------- | ------------ | ------------------ |
| id         | INTEGER      | PK, Auto Increment |
| name       | STRING(50)   | NOT NULL, UNIQUE   |
| created_at | DATE (auto)  | Sequelize timestamps |
| updated_at | DATE (auto)  | Sequelize timestamps |

---

## Relationships

- `Tag.belongsToMany(Product, { through: "product_tags", foreignKey: "tag_id", otherKey: "product_id", as: "products" })`.
- Many tags can belong to many products.

---

## Model Options

```js
{
  tableName: "tags",
  timestamps: true,
  underscored: true
}
```

---

## Notes

- `name` is unique — no duplicate tag names allowed.
- Tags are lightweight labels (e.g., "wireless", "budget", "premium").
- Associations are defined in `src/model/index.js`, not in this file.
