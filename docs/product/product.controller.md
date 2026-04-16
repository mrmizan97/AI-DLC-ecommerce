# Product — Controller

## File: `src/controller/productController.js`

Handles HTTP requests for Product endpoints. Delegates all business logic to `productService`. Never imports Sequelize or the model directly.

---

## Pattern

Every method follows:

```js
async methodName(req, res, next) {
  try {
    // call productService
    // send response
  } catch (error) {
    next(error);
  }
}
```

---

## Exports

An object `productController` with the following methods:

---

### `create(req, res, next)`

- Calls `productService.create(req.body)`.
- Response: `201`
```json
{ "success": true, "message": "Product created successfully", "data": { ... } }
```

---

### `findAll(req, res, next)`

- Calls `productService.findAll(req.query)`.
- Response: `200`
```json
{ "success": true, "data": [ ... ], "pagination": { ... } }
```

---

### `findById(req, res, next)`

- Calls `productService.findById(req.params.id)`.
- Not found → `404`:
```json
{ "success": false, "message": "Product not found" }
```
- Found → `200`:
```json
{ "success": true, "data": { ... } }
```

---

### `update(req, res, next)`

- Calls `productService.update(req.params.id, req.body)`.
- Not found → `404`:
```json
{ "success": false, "message": "Product not found" }
```
- Found → `200`:
```json
{ "success": true, "message": "Product updated successfully", "data": { ... } }
```

---

### `delete(req, res, next)`

- Calls `productService.delete(req.params.id)`.
- Not found → `404`:
```json
{ "success": false, "message": "Product not found" }
```
- Found → `200`:
```json
{ "success": true, "message": "Product deleted successfully" }
```

---

### `addTags(req, res, next)`

- Reads `req.params.id` and `req.body.tag_ids` (array of tag IDs).
- Calls `productService.addTags(id, tag_ids)`.
- Not found → `404`:
```json
{ "success": false, "message": "Product not found" }
```
- Found → `200`:
```json
{ "success": true, "message": "Tags added successfully", "data": { ... } }
```

---

### `removeTags(req, res, next)`

- Reads `req.params.id` and `req.body.tag_ids` (array of tag IDs).
- Calls `productService.removeTags(id, tag_ids)`.
- Not found → `404`:
```json
{ "success": false, "message": "Product not found" }
```
- Found → `200`:
```json
{ "success": true, "message": "Tags removed successfully", "data": { ... } }
```
