const { Op } = require("sequelize");
const { Order, User } = require("../model");
const ReturnRequest = require("../model/ReturnRequest");

// Define associations if not already set
if (!ReturnRequest.associations.order) {
  ReturnRequest.belongsTo(Order, { foreignKey: "order_id", as: "order" });
  Order.hasMany(ReturnRequest, { foreignKey: "order_id", as: "return_requests" });
}
if (!ReturnRequest.associations.user) {
  ReturnRequest.belongsTo(User, { foreignKey: "user_id", as: "user" });
  User.hasMany(ReturnRequest, { foreignKey: "user_id", as: "return_requests" });
}

const returnRequestIncludes = [
  { model: Order, as: "order", attributes: ["id", "order_number", "status", "total_amount"] },
  { model: User, as: "user", attributes: ["id", "name", "email"] },
];

const returnRequestService = {
  async canReturn(userId, orderId) {
    const order = await Order.findOne({ where: { id: orderId, user_id: userId } });
    if (!order) return { allowed: false, reason: "Order not found or does not belong to you" };
    if (order.status !== "delivered") return { allowed: false, reason: "Only delivered orders can be returned" };

    const existing = await ReturnRequest.findOne({ where: { order_id: orderId, user_id: userId } });
    if (existing) return { allowed: false, reason: "A return request already exists for this order" };

    return { allowed: true, order };
  },

  async create(userId, data) {
    const { order_id, reason } = data;

    const check = await returnRequestService.canReturn(userId, order_id);
    if (!check.allowed) {
      const error = new Error(check.reason);
      error.statusCode = 400;
      throw error;
    }

    const returnRequest = await ReturnRequest.create({
      order_id,
      user_id: userId,
      reason,
      status: "pending",
    });

    return await ReturnRequest.findByPk(returnRequest.id, { include: returnRequestIncludes });
  },

  async findAll(query = {}) {
    const { page = 1, limit = 10, status } = query;
    const offset = (page - 1) * limit;
    const where = {};

    if (status) where.status = status;

    const { count, rows } = await ReturnRequest.findAndCountAll({
      where,
      include: returnRequestIncludes,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["created_at", "DESC"]],
      distinct: true,
    });

    return {
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    };
  },

  async findByUser(userId, query = {}) {
    const { page = 1, limit = 10 } = query;
    const offset = (page - 1) * limit;

    const { count, rows } = await ReturnRequest.findAndCountAll({
      where: { user_id: userId },
      include: returnRequestIncludes,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["created_at", "DESC"]],
      distinct: true,
    });

    return {
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    };
  },

  async findById(id) {
    return await ReturnRequest.findByPk(id, { include: returnRequestIncludes });
  },

  async updateStatus(id, data) {
    const returnRequest = await ReturnRequest.findByPk(id);
    if (!returnRequest) return null;

    const { status, admin_note, refund_amount } = data;
    const patch = {};
    if (status !== undefined) patch.status = status;
    if (admin_note !== undefined) patch.admin_note = admin_note;
    if (refund_amount !== undefined) patch.refund_amount = refund_amount;

    await returnRequest.update(patch);
    return await ReturnRequest.findByPk(id, { include: returnRequestIncludes });
  },
};

module.exports = returnRequestService;
