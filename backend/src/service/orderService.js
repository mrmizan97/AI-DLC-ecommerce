const { Op } = require("sequelize");
const { sequelize, Order, OrderItem, Product, User } = require("../model");

const orderIncludes = [
  { model: User, as: "user", attributes: ["id", "name", "email"] },
  {
    model: OrderItem,
    as: "items",
    include: [{ model: Product, as: "product", attributes: ["id", "name", "image_url"] }],
  },
];

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

      const order = await Order.create(
        { user_id: userId, status: "pending", total_amount: totalAmount, shipping_address, phone, note },
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
      return await Order.findByPk(order.id, { include: orderIncludes });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async findAll(query = {}, userId, role) {
    const { page = 1, limit = 10, status } = query;
    const offset = (page - 1) * limit;
    const where = {};

    if (role === "customer") where.user_id = userId;
    if (status) where.status = status;

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
    return await order.update({ status });
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
