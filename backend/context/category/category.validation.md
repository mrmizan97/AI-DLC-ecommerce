# Category — Validation

## File: `src/middleware/validate.js`

Exports `validateCategory(req, res, next)`.

---

## Validation Rules

| Field | Required | Rule                               |
| ----- | -------- | ---------------------------------- |
| name  | Yes      | Non-empty string, max 100 characters |

---

## Failure Response

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": ["Name is required"]
}
```

---

## Applied To

- `POST /api/categories` — validate before creating.
- `PUT /api/categories/:id` — validate before updating.
