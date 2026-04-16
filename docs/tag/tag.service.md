# Tag — Service

## File: `src/service/tagService.js`

Contains all business logic and database operations for the Tag domain.

---

## Exports

An object `tagService` with the following async methods:

---

### `create(data)`

- Calls `Tag.create(data)`.
- Returns the created record.

---

### `findAll(query)`

| Param  | Type   | Default | Description           |
| ------ | ------ | ------- | --------------------- |
| search | string | —       | `LIKE` search on name |

- If `search` provided → filter with `Op.like` on `name`.
- Uses `Tag.findAll` with `where`, `order: [["name", "ASC"]]`.
- Returns array of tags (no pagination — tags are typically a small list).

---

### `findById(id)`

- Calls `Tag.findByPk(id)`.
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
