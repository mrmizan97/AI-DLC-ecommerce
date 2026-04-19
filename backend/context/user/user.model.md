# User — Model

## File: `src/model/User.js`

Defines the Sequelize model for the `users` table. Represents both **admin** and **customer** accounts using a `role` column.

---

## Table: `users`

| Column     | Type                        | Constraints             |
| ---------- | --------------------------- | ----------------------- |
| id         | INTEGER                     | PK, Auto Increment      |
| name       | STRING(100)                 | NOT NULL                |
| email      | STRING(255)                 | NOT NULL, UNIQUE        |
| password   | STRING(255)                 | NOT NULL                |
| phone      | STRING(20)                  | nullable                |
| role       | ENUM('admin', 'customer')   | NOT NULL, default 'customer' |
| is_active  | BOOLEAN                     | NOT NULL, default true  |
| created_at | DATE (auto)                 | Sequelize timestamps    |
| updated_at | DATE (auto)                 | Sequelize timestamps    |

---

## Model Options

```js
{
  tableName: "users",
  timestamps: true,
  underscored: true
}
```

---

## Password Handling

- Passwords are **never stored in plain text**.
- Use `bcryptjs` to hash the password before saving.
- Use a Sequelize `beforeCreate` and `beforeUpdate` hook in the model to auto-hash when password changes.
- The `password` field should be **excluded from default queries** using a `defaultScope`:
  ```js
  defaultScope: {
    attributes: { exclude: ["password"] }
  },
  scopes: {
    withPassword: {
      attributes: {}
    }
  }
  ```
- To include password (for login), use `User.scope("withPassword").findOne(...)`.

---

## Barrel Export: `src/model/index.js`

- Add `User` to the barrel export.
- Export as `{ sequelize, Product, Category, Tag, User }`.
- No associations between User and other models for now.

---

## Notes

- `email` is unique — used as the login identifier.
- `role` determines access level: `admin` has full access, `customer` has limited access.
- `is_active` allows soft-disabling accounts without deletion.
- Password hashing happens at the model layer via hooks — logic/controller never hash manually.
