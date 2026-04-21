const { Op } = require("sequelize");
const { sequelize, Order, OrderItem, Product, User } = require("../model");
const { emitToAdmins, emitToUser } = require("../socket");
const notificationService = require("./notificationService");

const orderIncludes = [
  { model: User, as: "user", attributes: ["id", "name", "email"] },
  {
    model: OrderItem,
    as: "items",
    include: [{ model: Product, as: "product", attributes: ["id", "name", "image_url"] }],
  },
];

async function generateUniqueOrderNumber(transaction) {
  for (let attempt = 0; attempt < 10; attempt++) {
    const num = String(Math.floor(100000 + Math.random() * 900000));
    const existing = await Order.findOne({ where: { order_number: num }, transaction });
    if (!existing) return num;
  }
  throw new Error("Could not generate unique order number after 10 attempts");
}

const orderService = {
  async create(userId, data) {
    const { shipping_address, phone, note, items } = data;
    const transaction = await sequelize.transaction();

    try {
      let totalAmount = 0;
      const orderItems = [];

      for (const item of items) {
        const product = await Product.findByPk(item.product_id, { transaction });
        if (!product) {
          throw new Error(`Product with id ${item.product_id} not found`);
        }
        if (product.stock < item.quantity) {
          throw new Error(`Insufficient stock for product ${product.name}`);
        }

        totalAmount += parseFloat(product.price) * item.quantity;
        orderItems.push({
          product_id: item.product_id,
          quantity: item.quantity,
          price: product.price,
        });
      }

      const order_number = await generateUniqueOrderNumber(transaction);

      const order = await Order.create(
        { order_number, user_id: userId, status: "pending", total_amount: totalAmount, shipping_address, phone, note },
        { transaction }
      );

      for (const item of orderItems) {
        await OrderItem.create({ order_id: order.id, ...item }, { transaction });
        await Product.update(
          { stock: sequelize.literal(`stock - ${item.quantity}`) },
          { where: { id: item.product_id }, transaction }
        );
      }

      await transaction.commit();
      const fullOrder = await Order.findByPk(order.id, { include: orderIncludes });

      const message = `New order #${fullOrder.order_number} from ${fullOrder.user?.name}`;
      emitToAdmins("order:created", { order: fullOrder, message });
      await notificationService.createForAllAdmins({
        type: "order-created",
        message,
        order_id: fullOrder.id,
      });

      return fullOrder;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async findAll(query = {}, userId, role) {
    const { page = 1, limit = 10, status, search, phone, start_date, end_date } = query;
    const offset = (page - 1) * limit;
    const where = {};

    if (role === "customer") where.user_id = userId;
    if (status) where.status = status;
    if (search) where.order_number = { [Op.like]: `%${search}%` };
    if (phone) where.phone = { [Op.like]: `%${phone}%` };

    if (start_date || end_date) {
      where.created_at = {};
      if (start_date) where.created_at[Op.gte] = new Date(start_date);
      if (end_date) {
        const end = new Date(end_date);
        end.setHours(23, 59, 59, 999);
        where.created_at[Op.lte] = end;
      }
    }

    const { count, rows } = await Order.findAndCountAll({
      where,
      include: orderIncludes,
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

  async findById(id, userId, role) {
    const order = await Order.findByPk(id, { include: orderIncludes });
    if (!order) return null;
    if (role === "customer" && order.user_id !== userId) return null;
    return order;
  },

  async updateStatus(id, status) {
    const order = await Order.findByPk(id);
    if (!order) return null;
    if (order.status === "cancelled" || order.status === "delivered") {
      return { error: "Cannot update a completed order" };
    }
    const updated = await order.update({ status });

    const message = `Your order #${order.order_number || order.id} is now ${status}`;
    emitToUser(order.user_id, "order:status-updated", { order: updated, message });
    await notificationService.createForUser(order.user_id, {
      type: "order-status",
      message,
      order_id: order.id,
    });

    return updated;
  },

  async cancel(id, userId, role) {
    const order = await Order.findByPk(id, {
      include: [{ model: OrderItem, as: "items" }],
    });
    if (!order) return null;
    if (role === "customer" && order.user_id !== userId) return null;
    if (order.status !== "pending") {
      return { error: "Only pending orders can be cancelled" };
    }

    const transaction = await sequelize.transaction();
    try {
      await order.update({ status: "cancelled" }, { transaction });

      for (const item of order.items) {
        await Product.update(
          { stock: sequelize.literal(`stock + ${item.quantity}`) },
          { where: { id: item.product_id }, transaction }
        );
      }

      await transaction.commit();
      return await Order.findByPk(id, { include: orderIncludes });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};

module.exports = orderService;
