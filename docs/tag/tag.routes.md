# Tag — Routes

## File: `src/routes/tagRoutes.js`

Defines all REST endpoints for the Tag domain using `express.Router()`.

---

## Base Path

Mounted at `/api/tags` in `index.js`.

---

## Endpoints

| Method | Path   | Middleware  | Controller Method        | Description      |
| ------ | ------ | ----------- | ------------------------ | ---------------- |
| POST   | `/`    | validateTag | tagController.create     | Create a tag     |
| GET    | `/`    | —           | tagController.findAll    | List all tags    |
| GET    | `/:id` | —           | tagController.findById   | Get tag by ID    |
| PUT    | `/:id` | validateTag | tagController.update     | Update a tag     |
| DELETE | `/:id` | —           | tagController.delete     | Delete a tag     |

---

## Example Requests

### Create
```
POST /api/tags
Content-Type: application/json

{ "name": "wireless" }
```

### List (with search)
```
GET /api/tags?search=wire
```

### Update
```
PUT /api/tags/1
Content-Type: application/json

{ "name": "bluetooth" }
```
