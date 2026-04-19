# User — Controller

## File: `src/controller/userController.js`

Handles HTTP requests for user management (admin-only operations). Delegates to `userService`.

---

## Pattern

Same try/catch + `next(error)` pattern as other controllers.

---

## Exports

An object `userController` with the following methods:

---

### `findAll(req, res, next)`

- Calls `userService.findAll(req.query)`.
- Response: `200`
```json
{ "success": true, "data": [ ... ], "pagination": { ... } }
```

---

### `findById(req, res, next)`

- Calls `userService.findById(req.params.id)`.
- Not found → `404`:
```json
{ "success": false, "message": "User not found" }
```
- Found → `200`:
```json
{ "success": true, "data": { ... } }
```

---

### `update(req, res, next)`

- Calls `userService.update(req.params.id, req.body)`.
- Not found → `404`:
```json
{ "success": false, "message": "User not found" }
```
- Found → `200`:
```json
{ "success": true, "message": "User updated successfully", "data": { ... } }
```

---

### `delete(req, res, next)`

- Calls `userService.delete(req.params.id)`.
- Not found → `404`:
```json
{ "success": false, "message": "User not found" }
```
- Found → `200`:
```json
{ "success": true, "message": "User deleted successfully" }
```
