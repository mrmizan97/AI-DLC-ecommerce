const nodemailer = require("nodemailer");

const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_FROM } = process.env;

let transporter = null;

if (EMAIL_HOST && EMAIL_PORT && EMAIL_USER && EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    host: EMAIL_HOST,
    port: parseInt(EMAIL_PORT),
    secure: parseInt(EMAIL_PORT) === 465,
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });
} else {
  console.warn("[emailService] Email env vars missing — email sending disabled.");
}

async function send(to, subject, html) {
  if (!transporter) {
    return { success: false, message: "Email transporter not configured" };
  }
  try {
    const info = await transporter.sendMail({
      from: EMAIL_FROM || EMAIL_USER,
      to,
      subject,
      html,
    });
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error("[emailService] Failed to send email:", err.message);
    return { success: false, message: err.message };
  }
}

const emailService = {
  async sendOrderConfirmation(user, order) {
    try {
      const subject = `Order Confirmation — #${order.order_number || order.id}`;
      const html = `
        <h2>Thank you for your order, ${user.name}!</h2>
        <p>Your order <strong>#${order.order_number || order.id}</strong> has been placed successfully.</p>
        <p><strong>Total:</strong> $${order.total_amount}</p>
        <p><strong>Status:</strong> ${order.status}</p>
        <p><strong>Shipping Address:</strong> ${order.shipping_address}</p>
        <p>We will notify you once your order is confirmed.</p>
      `;
      return await send(user.email, subject, html);
    } catch (err) {
      console.error("[emailService] sendOrderConfirmation error:", err.message);
      return { success: false, message: err.message };
    }
  },

  async sendOrderStatusUpdate(user, order, newStatus) {
    try {
      const subject = `Order #${order.order_number || order.id} Status Updated`;
      const html = `
        <h2>Order Status Update</h2>
        <p>Hi ${user.name},</p>
        <p>Your order <strong>#${order.order_number || order.id}</strong> has been updated.</p>
        <p><strong>New Status:</strong> ${newStatus}</p>
        <p>Thank you for shopping with us!</p>
      `;
      return await send(user.email, subject, html);
    } catch (err) {
      console.error("[emailService] sendOrderStatusUpdate error:", err.message);
      return { success: false, message: err.message };
    }
  },

  async sendReturnRequestUpdate(user, returnRequest) {
    try {
      const subject = `Return Request #${returnRequest.id} Update`;
      const html = `
        <h2>Return Request Update</h2>
        <p>Hi ${user.name},</p>
        <p>Your return request <strong>#${returnRequest.id}</strong> has been updated.</p>
        <p><strong>Status:</strong> ${returnRequest.status}</p>
        ${returnRequest.admin_note ? `<p><strong>Note:</strong> ${returnRequest.admin_note}</p>` : ""}
        ${returnRequest.refund_amount ? `<p><strong>Refund Amount:</strong> $${returnRequest.refund_amount}</p>` : ""}
      `;
      return await send(user.email, subject, html);
    } catch (err) {
      console.error("[emailService] sendReturnRequestUpdate error:", err.message);
      return { success: false, message: err.message };
    }
  },

  async sendWelcomeEmail(user) {
    try {
      const subject = "Welcome to Our Store!";
      const html = `
        <h2>Welcome, ${user.name}!</h2>
        <p>Thank you for registering with us. Your account has been created successfully.</p>
        <p>Start exploring our wide range of products and enjoy a great shopping experience!</p>
      `;
      return await send(user.email, subject, html);
    } catch (err) {
      console.error("[emailService] sendWelcomeEmail error:", err.message);
      return { success: false, message: err.message };
    }
  },

  async sendLowStockAlert(adminEmail, product) {
    try {
      const subject = `Low Stock Alert — ${product.name}`;
      const html = `
        <h2>Low Stock Alert</h2>
        <p>The following product is running low on stock:</p>
        <ul>
          <li><strong>Product:</strong> ${product.name}</li>
          <li><strong>SKU:</strong> ${product.sku || "N/A"}</li>
          <li><strong>Current Stock:</strong> ${product.stock}</li>
        </ul>
        <p>Please restock soon to avoid stockouts.</p>
      `;
      return await send(adminEmail, subject, html);
    } catch (err) {
      console.error("[emailService] sendLowStockAlert error:", err.message);
      return { success: false, message: err.message };
    }
  },

  // Generic send used by scheduled jobs (daily report, abandoned cart, etc.).
  // Returns { success, messageId? } so callers can count successes.
  async sendCustom(to, subject, html) {
    try {
      return await send(to, subject, html);
    } catch (err) {
      console.error("[emailService] sendCustom error:", err.message);
      return { success: false, message: err.message };
    }
  },

  async sendPasswordReset(user, resetToken) {
    try {
      const subject = "Password Reset Request";
      const resetLink = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password?token=${resetToken}`;
      const html = `
        <h2>Password Reset</h2>
        <p>Hi ${user.name},</p>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <p><a href="${resetLink}">Reset Password</a></p>
        <p>This link will expire in 1 hour. If you did not request this, please ignore this email.</p>
      `;
      return await send(user.email, subject, html);
    } catch (err) {
      console.error("[emailService] sendPasswordReset error:", err.message);
      return { success: false, message: err.message };
    }
  },
};

module.exports = emailService;
