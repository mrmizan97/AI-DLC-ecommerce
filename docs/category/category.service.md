# Category — Service

## File: `src/service/categoryService.js`

Contains all business logic and database operations for the Category domain.

---

## Exports

An object `categoryService` with the following async methods:

---

### `create(data)`

- Calls `Category.create(data)`.
- Returns the created record.

---

### `findAll(query)`

| Param  | Type   | Default | Description                  |
| ------ | ------ | ------- | ---------------------------- |
| search | string | —       | `LIKE` search on name        |

- If `search` provided → filter with `Op.like` on `name`.
- Uses `Category.findAll` with `where`, `order: [["name", "ASC"]]`.
- Returns array of categories (no pagination — categories are typically a small list).

---

### `findById(id)`

- Calls `Category.findByPk(id, { include })` with Product count.
- Include: `Product` as `"products"` with `attributes: []` and using `sequelize.fn("COUNT")` or simply include products.
- Simpler approach: just `Category.findByPk(id)`.
- Returns the record or `null`.

---

### `update(id, data)`

- Finds record by PK. If not found → returns `null`.
- Calls `record.update(data)`.
- Returns the updated record.

---

### `delete(id)`

- Finds record by PK. If not found → returns `null`.
- Calls `record.destroy()`.
- Returns the record (before destruction).
