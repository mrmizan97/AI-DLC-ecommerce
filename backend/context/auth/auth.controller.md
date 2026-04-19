# Auth — Controller

## File: `src/controller/authController.js`

Handles HTTP requests for authentication. Delegates to `authService`.

---

## Pattern

Same try/catch + `next(error)` pattern as other controllers.

---

## Exports

An object `authController` with the following methods:

---

### `register(req, res, next)`

- Calls `authService.register(req.body)`.
- Response: `201`
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": { "id": 1, "name": "John", "email": "john@example.com", "role": "customer", ... },
    "token": "eyJhbGciOi..."
  }
}
```

---

### `login(req, res, next)`

- Calls `authService.login(req.body.email, req.body.password)`.
- If result has `error` → respond `401`:
```json
{ "success": false, "message": "Invalid email or password" }
```
- If success → respond `200`:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "token": "eyJhbGciOi..."
  }
}
```

---

### `profile(req, res, next)`

- Reads `req.user.id` (set by `authenticate` middleware).
- Calls `authService.getProfile(req.user.id)`.
- Not found → `404`:
```json
{ "success": false, "message": "User not found" }
```
- Found → `200`:
```json
{ "success": true, "data": { ... } }
```
