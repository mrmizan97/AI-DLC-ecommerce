# Auth — Service

## File: `src/service/authService.js`

Contains business logic for authentication: registration, login, and profile retrieval.

---

## Dependencies

- `bcryptjs` — for comparing password hashes.
- `jsonwebtoken` — for generating JWT tokens.
- `User` model from domain (uses `withPassword` scope for login).

---

## Helper: `generateToken(user)`

- Creates a JWT with payload: `{ id: user.id, email: user.email, role: user.role }`.
- Signs with `process.env.JWT_SECRET`.
- Expires in `process.env.JWT_EXPIRES_IN` (default: `"7d"`).
- Returns the token string.

---

## Exports

An object `authService` with the following async methods:

---

### `register(data)`

- Accepts: `{ name, email, password, phone, role }`.
- `role` defaults to `"customer"` if not provided.
- Calls `User.create(data)` — password is auto-hashed by model hook.
- Generates a token for the new user.
- Returns `{ user: (without password), token }`.
- **Note**: The returned `user` object should exclude the password. Use `user.toJSON()` and delete `password` from it.

---

### `login(email, password)`

- Finds user by email using `User.scope("withPassword").findOne({ where: { email } })`.
- If user not found → returns `{ error: "Invalid email or password" }`.
- If `user.is_active` is `false` → returns `{ error: "Account is deactivated" }`.
- Compares password using `bcrypt.compare(password, user.password)`.
- If mismatch → returns `{ error: "Invalid email or password" }`.
- If match → generates token and returns `{ user: (without password), token }`.

---

### `getProfile(userId)`

- Calls `User.findByPk(userId)`.
- Returns user record (without password due to defaultScope) or `null`.
