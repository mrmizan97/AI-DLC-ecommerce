# API — Client

## File: `src/lib/api.js`

Centralized Axios instance used by every page/component to communicate with the backend.

---

## Configuration

```js
baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"
headers: { "Content-Type": "application/json" }
```

---

## Request Interceptor

Before every request:
- Reads `token` from `localStorage`.
- If present, attaches `Authorization: Bearer <token>` header.
- Guards with `typeof window !== "undefined"` so it won't break during SSR build.

---

## Response Interceptor

On 401 Unauthorized:
- Clears `token` and `user` from `localStorage`.
- Does **not** force redirect — lets the calling page handle redirect logic (so pages can show a toast, preserve cart, etc.).

---

## Usage Pattern

```js
import api from "@/lib/api";

// GET
const res = await api.get("/products?page=1");
const products = res.data.data;

// POST
const res = await api.post("/auth/login", { email, password });

// PUT
await api.put(`/products/${id}`, payload);

// DELETE
await api.delete(`/products/${id}`);

// PATCH
await api.patch(`/orders/${id}/status`, { status: "confirmed" });
```

---

## Response Shape (from backend)

All backend endpoints return:
```json
{ "success": true, "message": "...", "data": { ... }, "pagination": { ... }, "errors": [] }
```

Destructure `res.data.data` to get the actual payload.

---

## Error Handling

```js
try {
  await api.post("/...", payload);
} catch (err) {
  toast.error(err.response?.data?.message || "Failed");
}
```
