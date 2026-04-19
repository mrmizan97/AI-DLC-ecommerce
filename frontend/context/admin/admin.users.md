# Admin — Users

## File: `src/app/admin/users/page.js`

Route: `/admin/users`

Manage all user accounts.

---

## Filters

- **Search** — searches name/email (`Enter` to apply).
- **Role** — all / admin / customer.

---

## Table Columns

| Column | Source |
|--------|--------|
| ID | `user.id` |
| Name | `user.name` |
| Email | `user.email` |
| Phone | `user.phone` or `—` |
| Role | colored badge (primary for admin, gray for customer) |
| Status | Active (green) / Inactive (red) |
| Joined | `created_at` date |
| Actions | Edit + Delete icons |

---

## Edit Modal

Fields (all updatable except email / password per backend `userLogic.update` allowlist):
- Name
- Phone
- Role (admin / customer)
- Active (checkbox)

---

## Delete Protection

- Cannot delete own account — frontend check (`if (id === currentUser.id)`).
- Backend does not enforce this; frontend guards it.

---

## API Calls

| Action | Endpoint |
|--------|----------|
| List | `GET /users?search=&role=&limit=100` |
| Update | `PUT /users/:id` |
| Delete | `DELETE /users/:id` |

---

## Notes

- Password cannot be changed from here (backend `userLogic` filters allowed fields to `name`, `phone`, `role`, `is_active` only).
- New users are created via `POST /auth/register`, not here.
- All actions require admin JWT (backend `authenticate + authorizeAdmin`).
