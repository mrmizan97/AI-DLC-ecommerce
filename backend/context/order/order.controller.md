# Order — Controller

## File: `src/controller/orderController.js`

Handles HTTP requests for Order endpoints. Delegates to `orderService`.

---

## Pattern

Same try/catch + `next(error)` pattern as other controllers.

---

## Exports

An object `orderController` with the following methods:

---

### `create(req, res, next)`

- Reads `req.user.id` and `req.body` (shipping_address, phone, note, items).
- Calls `orderService.create(req.user.id, req.body)`.
- Response: `201`
```json
{ "success": true, "message": "Order placed successfully", "data": { ... } }
```

---

### `findAll(req, res, next)`

- Calls `orderService.findAll(req.query, req.user.id, req.user.role)`.
- Response: `200`
```json
{ "success": true, "data": [ ... ], "pagination": { ... } }
```

---

### `findById(req, res, next)`

- Calls `orderService.findById(req.params.id, req.user.id, req.user.role)`.
- Not found → `404`:
```json
{ "success": false, "message": "Order not found" }
```
- Found → `200`:
```json
{ "success": true, "data": { ... } }
```

---

### `updateStatus(req, res, next)`

- Admin-only.
- Calls `orderService.updateStatus(req.params.id, req.body.status)`.
- Not found → `404`:
```json
{ "success": false, "message": "Order not found" }
```
- If error → `400`:
```json
{ "success": false, "message": "Cannot update a completed order" }
```
- Found → `200`:
```json
{ "success": true, "message": "Order status updated successfully", "data": { ... } }
```

---

### `cancel(req, res, next)`

- Calls `orderService.cancel(req.params.id, req.user.id, req.user.role)`.
- Not found → `404`:
```json
{ "success": false, "message": "Order not found" }
```
- If error → `400`:
```json
{ "success": false, "message": "Only pending orders can be cancelled" }
```
- Found → `200`:
```json
{ "success": true, "message": "Order cancelled successfully", "data": { ... } }
```
