# Product — Routes

## File: `src/routes/productRoutes.js`

Defines all REST endpoints for the Product domain using `express.Router()`.

---

## Base Path

Mounted at `/api/products` in `index.js`.

---

## Endpoints

| Method | Path              | Middleware      | Controller Method            | Description              |
| ------ | ----------------- | --------------- | ---------------------------- | ------------------------ |
| POST   | `/`               | validateProduct | productController.create     | Create a product         |
| GET    | `/`               | —               | productController.findAll    | List all products        |
| GET    | `/:id`            | —               | productController.findById   | Get product by ID        |
| PUT    | `/:id`            | validateProduct | productController.update     | Update a product         |
| DELETE | `/:id`            | —               | productController.delete     | Delete a product         |
| POST   | `/:id/tags`       | —               | productController.addTags    | Add tags to a product    |
| DELETE | `/:id/tags`       | —               | productController.removeTags | Remove tags from product |

---

## Query Parameters (GET list)

```
GET /api/products?page=1&limit=10&category_id=1&status=active&brand=Logitech&tag=electronics&search=mouse&min_price=10&max_price=50&sort_by=price&sort_order=ASC
```

See [product.service.md](product.service.md) for full filter/sort details.

---

## Example Requests

### Create
```
POST /api/products
Content-Type: application/json

{
  "name": "Wireless Mouse",
  "description": "Ergonomic wireless mouse with USB receiver",
  "price": 29.99,
  "stock": 150,
  "category_id": 1,
  "brand": "Logitech",
  "sku": "WM-001",
  "image_url": "https://example.com/mouse.jpg",
  "status": "active"
}
```

### Update
```
PUT /api/products/1
Content-Type: application/json

{ "price": 24.99, "stock": 200 }
```

### Add Tags
```
POST /api/products/1/tags
Content-Type: application/json

{ "tag_ids": [1, 2, 3] }
```

### Remove Tags
```
DELETE /api/products/1/tags
Content-Type: application/json

{ "tag_ids": [2] }
```

### Delete
```
DELETE /api/products/1
```
