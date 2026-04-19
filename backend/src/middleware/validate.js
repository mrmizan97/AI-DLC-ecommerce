function validateProduct(req, res, next) {
  const { name, price, category_id, sku, stock, status } = req.body;
  const errors = [];

  if (!name || !String(name).trim()) {
    errors.push("Name is required");
  } else if (String(name).length > 255) {
    errors.push("Name must be 255 characters or less");
  }

  if (price === undefined || price === null) {
    errors.push("Price is required");
  } else if (isNaN(price) || Number(price) < 0) {
    errors.push("Price must be a number >= 0");
  }

  if (!category_id) {
    errors.push("Category ID is required");
  } else if (!Number.isInteger(Number(category_id)) || Number(category_id) <= 0) {
    errors.push("Category ID must be a positive integer");
  }

  if (!sku || !String(sku).trim()) {
    errors.push("SKU is required");
  }

  if (stock !== undefined && stock !== null) {
    if (!Number.isInteger(Number(stock)) || Number(stock) < 0) {
      errors.push("Stock must be an integer >= 0");
    }
  }

  const validStatuses = ["active", "inactive", "discontinued"];
  if (status && !validStatuses.includes(status)) {
    errors.push(`Status must be one of: ${validStatuses.join(", ")}`);
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: "Validation failed", errors });
  }

  next();
}

function validateCategory(req, res, next) {
  const { name } = req.body;
  const errors = [];

  if (!name || !String(name).trim()) {
    errors.push("Name is required");
  } else if (String(name).length > 100) {
    errors.push("Name must be 100 characters or less");
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: "Validation failed", errors });
  }

  next();
}

function validateTag(req, res, next) {
  const { name } = req.body;
  const errors = [];

  if (!name || !String(name).trim()) {
    errors.push("Name is required");
  } else if (String(name).length > 50) {
    errors.push("Name must be 50 characters or less");
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: "Validation failed", errors });
  }

  next();
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateRegister(req, res, next) {
  const { name, email, password, phone, role } = req.body;
  const errors = [];

  if (!name || !String(name).trim()) {
    errors.push("Name is required");
  } else if (String(name).length > 100) {
    errors.push("Name must be 100 characters or less");
  }

  if (!email || !String(email).trim()) {
    errors.push("Email is required");
  } else if (!EMAIL_REGEX.test(email)) {
    errors.push("Email must be a valid email address");
  }

  if (!password || !String(password).trim()) {
    errors.push("Password is required");
  } else if (String(password).length < 6) {
    errors.push("Password must be at least 6 characters");
  }

  if (phone && String(phone).length > 20) {
    errors.push("Phone must be 20 characters or less");
  }

  const validRoles = ["admin", "customer"];
  if (role && !validRoles.includes(role)) {
    errors.push(`Role must be one of: ${validRoles.join(", ")}`);
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: "Validation failed", errors });
  }

  next();
}

function validateLogin(req, res, next) {
  const { email, password } = req.body;
  const errors = [];

  if (!email || !String(email).trim()) {
    errors.push("Email is required");
  }

  if (!password || !String(password).trim()) {
    errors.push("Password is required");
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: "Validation failed", errors });
  }

  next();
}

function validateUserUpdate(req, res, next) {
  const { name, phone, role, is_active } = req.body;
  const errors = [];

  if (name !== undefined && (!String(name).trim() || String(name).length > 100)) {
    errors.push("Name must be a non-empty string, max 100 characters");
  }

  if (phone !== undefined && String(phone).length > 20) {
    errors.push("Phone must be 20 characters or less");
  }

  const validRoles = ["admin", "customer"];
  if (role && !validRoles.includes(role)) {
    errors.push(`Role must be one of: ${validRoles.join(", ")}`);
  }

  if (is_active !== undefined && typeof is_active !== "boolean") {
    errors.push("is_active must be a boolean");
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: "Validation failed", errors });
  }

  next();
}

function validateOrder(req, res, next) {
  const { shipping_address, phone, items } = req.body;
  const errors = [];

  if (!shipping_address || !String(shipping_address).trim()) {
    errors.push("Shipping address is required");
  }

  if (!phone || !String(phone).trim()) {
    errors.push("Phone is required");
  } else if (String(phone).length > 20) {
    errors.push("Phone must be 20 characters or less");
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    errors.push("Items must be a non-empty array");
  } else {
    items.forEach((item, index) => {
      if (!item.product_id || !Number.isInteger(Number(item.product_id)) || Number(item.product_id) <= 0) {
        errors.push(`items[${index}].product_id must be a positive integer`);
      }
      if (!item.quantity || !Number.isInteger(Number(item.quantity)) || Number(item.quantity) < 1) {
        errors.push(`items[${index}].quantity must be an integer >= 1`);
      }
    });
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: "Validation failed", errors });
  }

  next();
}

function validateOrderStatus(req, res, next) {
  const { status } = req.body;
  const errors = [];

  const validStatuses = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
  if (!status || !validStatuses.includes(status)) {
    errors.push(`Status must be one of: ${validStatuses.join(", ")}`);
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: "Validation failed", errors });
  }

  next();
}

module.exports = {
  validateProduct,
  validateCategory,
  validateTag,
  validateRegister,
  validateLogin,
  validateUserUpdate,
  validateOrder,
  validateOrderStatus,
};
