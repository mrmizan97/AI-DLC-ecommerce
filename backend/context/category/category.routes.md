# Category — Routes

## File: `src/routes/categoryRoutes.js`

Defines all REST endpoints for the Category domain using `express.Router()`.

---

## Base Path

Mounted at `/api/categories` in `index.js`.

---

## Endpoints

| Method | Path   | Middleware       | Controller Method              | Description          |
| ------ | ------ | ---------------- | ------------------------------ | -------------------- |
| POST   | `/`    | validateCategory | categoryController.create      | Create a category    |
| GET    | `/`    | —                | categoryController.findAll     | List all categories  |
| GET    | `/:id` | —                | categoryController.findById    | Get category by ID   |
| PUT    | `/:id` | validateCategory | categoryController.update      | Update a category    |
| DELETE | `/:id` | —                | categoryController.delete      | Delete a category    |

---

## Example Requests

### Create
```
POST /api/categories
Content-Type: application/json

{ "name": "Electronics", "description": "Electronic devices and accessories" }
```

### List (with search)
```
GET /api/categories?search=elect
```

### Update
```
PUT /api/categories/1
Content-Type: application/json

{ "name": "Electronics & Gadgets" }
```
