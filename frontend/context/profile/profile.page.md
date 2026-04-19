# Profile — Page

## File: `src/app/profile/page.js`

Route: `/profile`

Displays the currently logged-in user's account info.

---

## Access Control

- Redirects to `/login` if `!user`.

---

## Display

- **Avatar** — colored circle with first initial.
- **Name + Role** at top.
- **Info rows** with icons:
  - Name
  - Email
  - Phone (or "Not set")
  - Role (capitalized)

---

## API Call

- `GET /auth/profile` (JWT-authenticated) — returns current user without password.

---

## Notes

- Read-only page for now. Future enhancement: edit profile form.
- Password is excluded from the response (backend `defaultScope`).
