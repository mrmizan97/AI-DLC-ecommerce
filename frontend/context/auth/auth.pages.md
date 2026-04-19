# Auth — Pages

## Files
- `src/app/login/page.js` — Login form
- `src/app/register/page.js` — Registration form

---

## Login Page (`/login`)

### Form Fields
- Email (required, email type)
- Password (required)

### Submit Flow
1. `POST /api/auth/login` with `{ email, password }`.
2. On success → `authStore.login(user, token)`, toast success, redirect to `/`.
3. On failure → toast error with message from API.

### Link
- "New here? Create an account" → `/register`

---

## Register Page (`/register`)

### Form Fields
- Full Name (required, max 100 chars)
- Email (required, valid email format)
- Phone (optional)
- Password (required, min 6 characters)

### Submit Flow
1. `POST /api/auth/register` with `{ name, email, password, phone }`.
2. Role defaults to `customer` on backend.
3. On success → `authStore.login(user, token)`, toast success, redirect to `/`.
4. On failure → toast error (e.g., "Duplicate entry" if email already exists).

### Link
- "Already have an account? Login" → `/login`

---

## Notes

- Both forms use local `useState` for form state.
- Loading state disables submit button while request is in flight.
- Client components (`"use client"`).
