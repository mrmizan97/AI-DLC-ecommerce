# User — Routes

## File: `src/routes/userRoutes.js`

Defines admin-only endpoints for managing users using `express.Router()`.

---

## Base Path

Mounted at `/api/users` in `index.js`.

---

## Endpoints

All endpoints require `authenticate` + `authorizeAdmin` middleware.

| Method | Path   | Middleware                               | Controller Method          | Description      |
| ------ | ------ | ---------------------------------------- | -------------------------- | ---------------- |
| GET    | `/`    | authenticate, authorizeAdmin             | userController.findAll     | List all users   |
| GET    | `/:id` | authenticate, authorizeAdmin             | userController.findById    | Get user by ID   |
| PUT    | `/:id` | authenticate, authorizeAdmin, validateUserUpdate | userController.update | Update a user    |
| DELETE | `/:id` | authenticate, authorizeAdmin             | userController.delete      | Delete a user    |

---

## Query Parameters (GET list)

```
GET /api/users?page=1&limit=10&role=customer&search=john
```

---

## Notes

- No `POST` endpoint here — user creation happens via `POST /api/auth/register`.
- All routes are admin-protected. Customers cannot access user management.
