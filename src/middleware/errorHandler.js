function errorHandler(err, req, res, next) {
  if (process.env.NODE_ENV !== "test") {
    console.error(err.stack);
  }

  if (err.name === "SequelizeValidationError") {
    const errors = err.errors.map((e) => e.message);
    return res.status(400).json({ success: false, message: "Validation error", errors });
  }

  if (err.name === "SequelizeUniqueConstraintError") {
    const errors = err.errors.map((e) => e.path);
    return res.status(409).json({ success: false, message: "Duplicate entry", errors });
  }

  res.status(500).json({ success: false, message: "Internal server error" });
}

module.exports = errorHandler;
