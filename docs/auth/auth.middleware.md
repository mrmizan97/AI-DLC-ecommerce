# Auth — Middleware

## File: `src/middleware/auth.js`

Exports two middleware functions for protecting routes.

---

## `authenticate(req, res, next)`

Verifies the JWT token from the `Authorization` header.

### Flow:

1. Read `Authorization` header from request.
2. If missing or doesn't start with `"Bearer "` → respond `401`:
   ```json
   { "success": false, "message": "Access token is required" }
   ```
3. Extract the token (remove `"Bearer "` prefix).
4. Verify the token using `jsonwebtoken.verify(token, process.env.JWT_SECRET)`.
5. If invalid or expired → respond `401`:
   ```json
   { "success": false, "message": "Invalid or expired token" }
   ```
6. If valid → attach decoded payload to `req.user` (contains `id`, `email`, `role`).
7. Call `next()`.

---

## `authorizeAdmin(req, res, next)`

Checks if the authenticated user has the `admin` role. Must be used **after** `authenticate`.

### Flow:

1. Check `req.user.role`.
2. If not `"admin"` → respond `403`:
   ```json
   { "success": false, "message": "Admin access required" }
   ```
3. If admin → call `next()`.

---

## Usage in Routes

```js
// Admin-only route
router.get("/users", authenticate, authorizeAdmin, userController.findAll);

// Any authenticated user
router.get("/profile", authenticate, authController.profile);
```
