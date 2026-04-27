const activityLogService = require("../service/activityLogService");

/**
 * Log an activity entry. Call directly from controllers or services.
 *
 * @param {object} req - Express request object (used to extract ip and user)
 * @param {string} action - Action identifier e.g. 'product.create'
 * @param {string|null} entityType - Entity type e.g. 'Product'
 * @param {number|null} entityId - Entity primary key
 * @param {string|null} description - Human-readable description
 * @param {object|null} metadata - Extra JSON data
 */
async function logActivity(req, action, entityType = null, entityId = null, description = null, metadata = null) {
  try {
    await activityLogService.log({
      user_id: req.user ? req.user.id : null,
      action,
      entity_type: entityType,
      entity_id: entityId,
      description,
      ip_address: req.ip || null,
      metadata,
    });
  } catch (err) {
    // Never throw — logging errors must not break the main request flow
    console.error("activityLogger error:", err.message);
  }
}

module.exports = { logActivity };
