# User — Service

## File: `src/service/userService.js`

Contains business logic for user management (admin-side operations). Authentication logic is in `authService.js` — see `docs/auth/`.

---

## Exports

An object `userService` with the following async methods:

---

### `findAll(query)`

| Param  | Type   | Default | Description                     |
| ------ | ------ | ------- | ------------------------------- |
| page   | number | 1       | Current page number             |
| limit  | number | 10      | Records per page                |
| role   | string | —       | Filter by role (admin/customer) |
| search | string | —       | `LIKE` search on name & email   |

- Builds `where` dynamically.
- Uses `User.findAndCountAll` with `where`, `limit`, `offset`, `order: [["created_at", "DESC"]]`.
- Returns `{ data: rows, pagination: { total, page, limit, totalPages } }`.

---

### `findById(id)`

- Calls `User.findByPk(id)`.
- Returns the record (without password due to defaultScope) or `null`.

---

### `update(id, data)`

- Finds record by PK. If not found → returns `null`.
- Only allows updating: `name`, `phone`, `role`, `is_active`.
- Does **not** allow updating `email` or `password` through this method.
- Calls `record.update(filteredData)`.
- Returns the updated record.

---

### `delete(id)`

- Finds record by PK. If not found → returns `null`.
- Calls `record.destroy()`.
- Returns the record (before destruction).
