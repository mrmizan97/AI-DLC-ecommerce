# Tag — Controller

## File: `src/controller/tagController.js`

Handles HTTP requests for Tag endpoints. Delegates all business logic to `tagService`.

---

## Pattern

Same try/catch + `next(error)` pattern as other controllers.

---

## Exports

An object `tagController` with the following methods:

---

### `create(req, res, next)`

- Calls `tagService.create(req.body)`.
- Response: `201`
```json
{ "success": true, "message": "Tag created successfully", "data": { ... } }
```

---

### `findAll(req, res, next)`

- Calls `tagService.findAll(req.query)`.
- Response: `200`
```json
{ "success": true, "data": [ ... ] }
```

---

### `findById(req, res, next)`

- Calls `tagService.findById(req.params.id)`.
- Not found → `404`:
```json
{ "success": false, "message": "Tag not found" }
```
- Found → `200`:
```json
{ "success": true, "data": { ... } }
```

---

### `update(req, res, next)`

- Calls `tagService.update(req.params.id, req.body)`.
- Not found → `404`:
```json
{ "success": false, "message": "Tag not found" }
```
- Found → `200`:
```json
{ "success": true, "message": "Tag updated successfully", "data": { ... } }
```

---

### `delete(req, res, next)`

- Calls `tagService.delete(req.params.id)`.
- Not found → `404`:
```json
{ "success": false, "message": "Tag not found" }
```
- Found → `200`:
```json
{ "success": true, "message": "Tag deleted successfully" }
```
