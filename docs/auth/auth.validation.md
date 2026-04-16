# Auth — Validation

## File: `src/middleware/validate.js`

Exports `validateRegister` and `validateLogin`.

---

## `validateRegister(req, res, next)`

| Field    | Required | Rule                                         |
| -------- | -------- | -------------------------------------------- |
| name     | Yes      | Non-empty string, max 100 characters         |
| email    | Yes      | Non-empty string, valid email format         |
| password | Yes      | Non-empty string, min 6 characters           |
| phone    | No       | If provided, non-empty string, max 20 chars  |
| role     | No       | If provided, must be: `admin` or `customer`  |

### Email format check:
- Use a simple regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`

---

## `validateLogin(req, res, next)`

| Field    | Required | Rule                 |
| -------- | -------- | -------------------- |
| email    | Yes      | Non-empty string     |
| password | Yes      | Non-empty string     |

---

## Failure Response

Same format as all other validators:
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": ["Email is required", "Password must be at least 6 characters"]
}
```

---

## Applied To

- `POST /api/auth/register` — `validateRegister`
- `POST /api/auth/login` — `validateLogin`
