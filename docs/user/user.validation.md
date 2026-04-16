# User — Validation

## File: `src/middleware/validate.js`

Exports `validateUserUpdate(req, res, next)` — validates user profile update fields.

---

## Validation Rules (Update)

| Field     | Required | Rule                                              |
| --------- | -------- | ------------------------------------------------- |
| name      | No       | If provided, non-empty string, max 100 characters |
| phone     | No       | If provided, non-empty string, max 20 characters  |
| role      | No       | If provided, must be: `admin` or `customer`       |
| is_active | No       | If provided, must be a boolean                    |

---

## Failure Response

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": ["Role must be one of: admin, customer"]
}
```

---

## Applied To

- `PUT /api/users/:id` — validate before updating.
