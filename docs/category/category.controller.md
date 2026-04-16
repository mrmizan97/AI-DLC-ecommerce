# Category — Controller

## File: `src/controller/categoryController.js`

Handles HTTP requests for Category endpoints. Delegates all business logic to `categoryService`.

---

## Pattern

Same try/catch + `next(error)` pattern as Product controller.

---

## Exports

An object `categoryController` with the following methods:

---

### `create(req, res, next)`

- Calls `categoryService.create(req.body)`.
- Response: `201`
```json
{ "success": true, "message": "Category created successfully", "data": { ... } }
```

---

### `findAll(req, res, next)`

- Calls `categoryService.findAll(req.query)`.
- Response: `200`
```json
{ "success": true, "data": [ ... ] }
```

---

### `findById(req, res, next)`

- Calls `categoryService.findById(req.params.id)`.
- Not found → `404`:
```json
{ "success": false, "message": "Category not found" }
```
- Found → `200`:
```json
{ "success": true, "data": { ... } }
```

---

### `update(req, res, next)`

- Calls `categoryService.update(req.params.id, req.body)`.
- Not found → `404`:
```json
{ "success": false, "message": "Category not found" }
```
- Found → `200`:
```json
{ "success": true, "message": "Category updated successfully", "data": { ... } }
```

---

### `delete(req, res, next)`

- Calls `categoryService.delete(req.params.id)`.
- Not found → `404`:
```json
{ "success": false, "message": "Category not found" }
```
- Found → `200`:
```json
{ "success": true, "message": "Category deleted successfully" }
```
