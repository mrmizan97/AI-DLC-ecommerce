# Tag — Validation

## File: `src/middleware/validate.js`

Exports `validateTag(req, res, next)`.

---

## Validation Rules

| Field | Required | Rule                             |
| ----- | -------- | -------------------------------- |
| name  | Yes      | Non-empty string, max 50 characters |

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

- `POST /api/tags` — validate before creating.
- `PUT /api/tags/:id` — validate before updating.
