const paymentService = require("../service/paymentService");

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3001";

const paymentController = {
  async success(req, res) {
    try {
      const body = { ...req.body, ...req.query };
      const { ok, order } = await paymentService.handleSuccess(body);
      const oid = order?.id || "";
      if (ok) {
        return res.redirect(`${FRONTEND_URL}/payment/success?order_id=${oid}`);
      }
      return res.redirect(`${FRONTEND_URL}/payment/fail?order_id=${oid}`);
    } catch (err) {
      return res.redirect(`${FRONTEND_URL}/payment/fail?error=${encodeURIComponent(err.message)}`);
    }
  },

  async fail(req, res) {
    const body = { ...req.body, ...req.query };
    const { order } = await paymentService.handleFail(body);
    const oid = order?.id || "";
    return res.redirect(`${FRONTEND_URL}/payment/fail?order_id=${oid}`);
  },

  async cancel(req, res) {
    const body = { ...req.body, ...req.query };
    const { order } = await paymentService.handleCancel(body);
    const oid = order?.id || "";
    return res.redirect(`${FRONTEND_URL}/payment/cancel?order_id=${oid}`);
  },

  async ipn(req, res) {
    // Server-to-server notification from SSLCommerz
    try {
      const body = { ...req.body, ...req.query };
      await paymentService.handleSuccess(body);
      return res.status(200).json({ success: true });
    } catch {
      return res.status(200).json({ success: false });
    }
  },
};

module.exports = paymentController;
