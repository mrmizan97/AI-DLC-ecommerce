# Product — Validation

## File: `src/middleware/validate.js`

Exports `validateProduct(req, res, next)` — an Express middleware that validates the request body before it reaches the controller.

---

## Validation Rules

| Field       | Required | Rule                                                          |
| ----------- | -------- | ------------------------------------------------------------- |
| name        | Yes      | Non-empty string, max 255 characters                          |
| price       | Yes      | Must be a number >= 0                                         |
| category_id | Yes      | Must be a positive integer                                    |
| sku         | Yes      | Non-empty string                                              |
| stock       | No       | If provided, must be an integer >= 0                          |
| status      | No       | If provided, must be: `active`, `inactive`, or `discontinued` |

---

## Failure Response

If any rule fails → respond `400`:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "Name is required",
    "Category ID must be a positive integer"
  ]
}
```

---

## Success

If all rules pass → call `next()` to proceed to the controller.

---

## Applied To

- `POST /api/products` — validate before creating.
- `PUT /api/products/:id` — validate before updating.
