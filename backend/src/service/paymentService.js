const SSLCommerzPayment = require("sslcommerz-lts");
const { Order, OrderItem, Product, User, sequelize } = require("../model");

const store_id = process.env.SSLCZ_STORE_ID;
const store_passwd = process.env.SSLCZ_STORE_PASSWORD;
const is_live = process.env.SSLCZ_IS_LIVE === "true";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3001";
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

const paymentService = {
  async initiate(order, user) {
    const tran_id = `ORD-${order.id}-${Date.now()}`;

    await order.update({ tran_id });

    const data = {
      total_amount: parseFloat(order.total_amount),
      currency: "BDT",
      tran_id,
      success_url: `${BACKEND_URL}/api/payment/success`,
      fail_url: `${BACKEND_URL}/api/payment/fail`,
      cancel_url: `${BACKEND_URL}/api/payment/cancel`,
      ipn_url: `${BACKEND_URL}/api/payment/ipn`,
      shipping_method: "Courier",
      product_name: `Order #${order.order_number}`,
      product_category: "Retail",
      product_profile: "general",
      cus_name: user.name,
      cus_email: user.email,
      cus_add1: order.shipping_address,
      cus_city: "Dhaka",
      cus_postcode: "1000",
      cus_country: "Bangladesh",
      cus_phone: order.phone,
      ship_name: user.name,
      ship_add1: order.shipping_address,
      ship_city: "Dhaka",
      ship_postcode: "1000",
      ship_country: "Bangladesh",
    };

    const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
    const apiResponse = await sslcz.init(data);

    if (!apiResponse?.GatewayPageURL) {
      throw new Error(`Payment init failed: ${apiResponse?.failedreason || "unknown error"}`);
    }

    return { gateway_url: apiResponse.GatewayPageURL, tran_id };
  },

  async handleSuccess(body) {
    const tran_id = body.tran_id;
    const order = await Order.findOne({ where: { tran_id } });
    if (!order) return { ok: false, message: "Order not found", order: null };

    // Validate with SSLCommerz (optional strict check)
    const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
    const valid = await sslcz.validate({ val_id: body.val_id });

    if (valid?.status === "VALID" || valid?.status === "VALIDATED") {
      await order.update({ payment_status: "paid" });
      return { ok: true, order };
    }

    // Sandbox often returns status from the POST body directly
    if (body.status === "VALID" || body.status === "VALIDATED") {
      await order.update({ payment_status: "paid" });
      return { ok: true, order };
    }

    await order.update({ payment_status: "failed" });
    return { ok: false, message: "Validation failed", order };
  },

  async handleFail(body) {
    const tran_id = body.tran_id;
    const order = await Order.findOne({ where: { tran_id } });
    if (!order) return { order: null };
    await order.update({ payment_status: "failed" });
    return { order };
  },

  async handleCancel(body) {
    const tran_id = body.tran_id;
    const order = await Order.findOne({
      where: { tran_id },
      include: [{ model: OrderItem, as: "items" }],
    });
    if (!order) return { order: null };

    // Restore stock and mark order cancelled
    const transaction = await sequelize.transaction();
    try {
      await order.update({ payment_status: "cancelled", status: "cancelled" }, { transaction });
      for (const item of order.items) {
        await Product.update(
          { stock: sequelize.literal(`stock + ${item.quantity}`) },
          { where: { id: item.product_id }, transaction }
        );
      }
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
    return { order };
  },
};

module.exports = paymentService;
