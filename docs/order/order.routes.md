# Order — Routes

## File: `src/routes/orderRoutes.js`

Defines all REST endpoints for the Order domain using `express.Router()`.

---

## Base Path

Mounted at `/api/orders` in `index.js`.

---

## Endpoints

All endpoints require `authenticate` middleware.

| Method | Path            | Middleware                                      | Controller Method              | Description               |
| ------ | --------------- | ----------------------------------------------- | ------------------------------ | ------------------------- |
| POST   | `/`             | authenticate, validateOrder                     | orderController.create         | Place a new order         |
| GET    | `/`             | authenticate                                    | orderController.findAll        | List orders               |
| GET    | `/:id`          | authenticate                                    | orderController.findById       | Get order by ID           |
| PATCH  | `/:id/status`   | authenticate, authorizeAdmin, validateOrderStatus | orderController.updateStatus | Update order status (admin) |
| PATCH  | `/:id/cancel`   | authenticate                                    | orderController.cancel         | Cancel an order           |

---

## Access Control

- **Customers** can: create orders, list their own orders, view their own orders, cancel their own pending orders.
- **Admins** can: list all orders, view any order, update order status.

---

## Query Parameters (GET list)

```
GET /api/orders?page=1&limit=10&status=pending
```

---

## Example Requests

### Place Order
```
POST /api/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "shipping_address": "123 Main St, Dhaka, Bangladesh",
  "phone": "01712345678",
  "note": "Please deliver before 5pm",
  "items": [
    { "product_id": 1, "quantity": 2 },
    { "product_id": 3, "quantity": 1 }
  ]
}

Response: 201
{
  "success": true,
  "message": "Order placed successfully",
  "data": {
    "id": 1,
    "user_id": 5,
    "status": "pending",
    "total_amount": "89.97",
    "shipping_address": "123 Main St, Dhaka, Bangladesh",
    "phone": "01712345678",
    "items": [
      { "id": 1, "product_id": 1, "quantity": 2, "price": "29.99", "product": { ... } },
      { "id": 2, "product_id": 3, "quantity": 1, "price": "29.99", "product": { ... } }
    ]
  }
}
```

### Update Status (Admin)
```
PATCH /api/orders/1/status
Authorization: Bearer <admin-token>
Content-Type: application/json

{ "status": "confirmed" }
```

### Cancel Order
```
PATCH /api/orders/1/cancel
Authorization: Bearer <token>
```
