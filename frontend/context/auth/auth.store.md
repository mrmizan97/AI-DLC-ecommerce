# Auth — Store

## File: `src/store/authStore.js`

Zustand store managing the authenticated user + JWT token. Persisted to `localStorage`.

---

## State

```js
{
  user: null | { id, name, email, role, phone, ... },
  token: null | string,
}
```

---

## Actions

### `login(user, token)`
- Writes `user` and `token` to both Zustand state and plain `localStorage` keys (for the axios interceptor).
- Called by login/register pages after successful API call.

### `logout()`
- Removes `token` and `user` from `localStorage`.
- Resets state to `{ user: null, token: null }`.
- Called from the Header user menu.

### `isAuthenticated()`
- Returns `true` if `token` is truthy.

### `isAdmin()`
- Returns `true` if `user.role === "admin"`.

---

## Persistence

- Persisted under key `"auth-storage"` via Zustand's `persist` middleware.
- Auto-rehydrates on page refresh.

---

## Consumers

| Component/Page | Uses |
|----------------|------|
| Header | `user`, `logout()` |
| Login / Register | `login()` |
| Checkout | `user` (redirects if null) |
| Orders, Profile, Admin layout | `user` (redirect checks) |

---

## Notes

- Two storage locations (`auth-storage` and `token`/`user`) exist intentionally — the axios interceptor reads plain `localStorage.token`, not Zustand's namespaced storage.
