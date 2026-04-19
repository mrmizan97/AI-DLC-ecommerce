# Product — Service

## File: `src/service/productService.js`

Contains all business logic and database operations for the Product domain. This is the **only layer** that imports models.

---

## Exports

An object `productService` with the following async methods:

---

### `create(data)`

- Calls `Product.create(data)`.
- Returns the created record.

---

### `findAll(query)`

Accepts query params object with the following optional keys:

| Param       | Type   | Default      | Description                         |
| ----------- | ------ | ------------ | ----------------------------------- |
| page        | number | 1            | Current page number                 |
| limit       | number | 10           | Records per page                    |
| category_id | number | —            | Filter by category FK               |
| status      | string | —            | Exact match filter                  |
| brand       | string | —            | Exact match filter                  |
| tag         | string | —            | Filter by tag name (exact match)    |
| search      | string | —            | `LIKE` search on name & description |
| min_price   | number | —            | Price >= value                      |
| max_price   | number | —            | Price <= value                      |
| sort_by     | string | "created_at" | Column to sort by                   |
| sort_order  | string | "DESC"       | ASC or DESC                         |

**Filter building:**
- `category_id` → exact match on `category_id` if provided.
- `status`, `brand` → exact match if provided.
- `search` → `Op.like` on `name` and `description` with `Op.or`.
- `min_price` / `max_price` → `Op.gte` / `Op.lte` on `price`.

**Includes (eager loading):**
- Always include `Category` (as `"category"`, attributes: `["id", "name"]`).
- Always include `Tag` (as `"tags"`, attributes: `["id", "name"]`, through: `{ attributes: [] }`).
- If `tag` query param is provided, filter by tag name using `where: { name: tag }` on the Tag include.

**Sort whitelist:**
- `sort_by` allowed values: `created_at`, `price`, `name`, `stock`. Fallback: `created_at`.
- `sort_order` allowed values: `ASC`, `DESC`. Fallback: `DESC`.

**Query method:**
- Uses `Product.findAndCountAll` with `where`, `include`, `limit`, `offset`, `order`, `distinct: true`.
- `distinct: true` is required to get correct count with includes.

**Return format:**
```json
{
  "data": [],
  "pagination": {
    "total": 0,
    "page": 1,
    "limit": 10,
    "totalPages": 0
  }
}
```

---

### `findById(id)`

- Calls `Product.findByPk(id, { include })` with Category and Tags eager loaded.
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

---

### `addTags(id, tagIds)`

- Finds product by PK. If not found → returns `null`.
- Calls `product.addTags(tagIds)`.
- Re-fetches product with includes and returns it.

---

### `removeTags(id, tagIds)`

- Finds product by PK. If not found → returns `null`.
- Calls `product.removeTags(tagIds)`.
- Re-fetches product with includes and returns it.
