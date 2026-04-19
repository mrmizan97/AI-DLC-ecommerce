# Admin — Layout

## File: `src/app/admin/layout.js`

Wraps all `/admin/*` routes. Provides:
1. **Auth guard** — redirects non-admins away.
2. **Sidebar navigation** to every admin page.

---

## Auth Guard

```js
if (!user) → router.push("/login")
if (user.role !== "admin") → router.push("/")
```

Shows a "Checking access…" placeholder while the check runs.

---

## Sidebar Navigation

| Link | Route | Icon |
|------|-------|------|
| Dashboard | `/admin` | LayoutDashboard |
| Products | `/admin/products` | Package |
| Categories | `/admin/categories` | Folder |
| Tags | `/admin/tags` | Tag |
| Orders | `/admin/orders` | ShoppingBag |
| Users | `/admin/users` | Users |

- Active route is highlighted with primary orange background.
- Also includes a "Back to shop" link at the top.

---

## Layout Grid

- 5-column grid on desktop: 1 for sidebar, 4 for content.
- Sidebar sticky-scrolls (`lg:sticky lg:top-24`).
- Stacks on mobile.

---

## Why this guard lives on the frontend

- The backend enforces admin access via `authorizeAdmin` middleware on the routes.
- The frontend guard is UX only — prevents flashing admin pages to non-admins.
- Security is still enforced by the backend.
