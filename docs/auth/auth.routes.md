# Auth — Routes

## File: `src/routes/authRoutes.js`

Defines authentication endpoints using `express.Router()`.

---

## Base Path

Mounted at `/api/auth` in `index.js`.

---

## Endpoints

| Method | Path        | Middleware       | Controller Method        | Description            |
| ------ | ----------- | ---------------- | ------------------------ | ---------------------- |
| POST   | `/register` | validateRegister | authController.register  | Register a new user    |
| POST   | `/login`    | validateLogin    | authController.login     | Login & get JWT token  |
| GET    | `/profile`  | authenticate     | authController.profile   | Get current user profile |

---

## Example Requests

### Register
```
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secret123",
  "phone": "01712345678"
}

Response: 201
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": { "id": 1, "name": "John Doe", "email": "john@example.com", "role": "customer" },
    "token": "eyJhbGciOi..."
  }
}
```

### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "secret123"
}

Response: 200
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "token": "eyJhbGciOi..."
  }
}
```

### Get Profile (requires token)
```
GET /api/auth/profile
Authorization: Bearer eyJhbGciOi...

Response: 200
{
  "success": true,
  "data": { "id": 1, "name": "John Doe", "email": "john@example.com", "role": "customer" }
}
```

---

## Notes

- Register creates a `customer` by default. To create an admin, pass `"role": "admin"` (consider restricting this in production).
- Login returns a JWT token valid for `JWT_EXPIRES_IN` duration.
- Profile endpoint requires a valid token in the `Authorization: Bearer <token>` header.
