# Order — Validation

## File: `src/middleware/validate.js`

Exports `validateOrder(req, res, next)` and `validateOrderStatus(req, res, next)`.

---

## `validateOrder(req, res, next)`

| Field            | Required | Rule                                                  |
| ---------------- | -------- | ----------------------------------------------------- |
| shipping_address | Yes      | Non-empty string                                      |
| phone            | Yes      | Non-empty string, max 20 characters                   |
| items            | Yes      | Must be a non-empty array                             |
| items[].product_id | Yes    | Must be a positive integer                            |
| items[].quantity | Yes      | Must be an integer >= 1                               |

---

## `validateOrderStatus(req, res, next)`

| Field  | Required | Rule                                                                    |
| ------ | -------- | ----------------------------------------------------------------------- |
| status | Yes      | Must be one of: `pending`, `confirmed`, `shipped`, `delivered`, `cancelled` |

---

## Failure Response

Same format as all other validators:
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": ["Shipping address is required", "Items must be a non-empty array"]
}
```

---

## Applied To

- `POST /api/orders` — `validateOrder`
- `PATCH /api/orders/:id/status` — `validateOrderStatus`
