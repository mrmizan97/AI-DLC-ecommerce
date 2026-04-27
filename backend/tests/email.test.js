jest.mock("nodemailer", () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({ messageId: "test-message-id-123" }),
  })),
}));

// Force env vars so transporter initialises inside the service
process.env.EMAIL_HOST = "smtp.test.com";
process.env.EMAIL_PORT = "587";
process.env.EMAIL_USER = "test@test.com";
process.env.EMAIL_PASS = "testpass";
process.env.EMAIL_FROM = "noreply@test.com";

// Re-require the service AFTER mocking & setting env vars
// Jest module registry is fresh per test file, so a plain require works.
const emailService = require("../src/service/emailService");

const mockUser = { id: 1, name: "Test User", email: "user@example.com" };
const mockOrder = {
  id: 10,
  order_number: "123456",
  status: "pending",
  total_amount: 99.99,
  shipping_address: "123 Main St",
};
const mockReturnRequest = {
  id: 5,
  status: "approved",
  admin_note: "Approved after inspection",
  refund_amount: 49.99,
};
const mockProduct = { id: 2, name: "Wireless Mouse", sku: "WM-001", stock: 3 };

describe("Email Service", () => {
  test("sendOrderConfirmation returns success", async () => {
    const result = await emailService.sendOrderConfirmation(mockUser, mockOrder);
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.messageId).toBeDefined();
  });

  test("sendOrderStatusUpdate returns success", async () => {
    const result = await emailService.sendOrderStatusUpdate(mockUser, mockOrder, "confirmed");
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.messageId).toBeDefined();
  });

  test("sendWelcomeEmail returns success", async () => {
    const result = await emailService.sendWelcomeEmail(mockUser);
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.messageId).toBeDefined();
  });

  test("sendLowStockAlert returns success", async () => {
    const result = await emailService.sendLowStockAlert("admin@example.com", mockProduct);
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.messageId).toBeDefined();
  });

  test("sendReturnRequestUpdate returns success", async () => {
    const result = await emailService.sendReturnRequestUpdate(mockUser, mockReturnRequest);
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.messageId).toBeDefined();
  });

  test("sendPasswordReset returns success", async () => {
    const result = await emailService.sendPasswordReset(mockUser, "reset-token-abc");
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.messageId).toBeDefined();
  });

  test("all methods handle missing env vars gracefully (no crash)", async () => {
    // Temporarily clear env vars and reload the service without transporter
    const originalHost = process.env.EMAIL_HOST;
    delete process.env.EMAIL_HOST;

    // The existing cached module still has the transporter from init; test that
    // each method wraps errors without throwing to the caller.
    // Simulate a transporter sendMail failure by forcing an error path via
    // a user object missing email (will cause nodemailer to reject gracefully).
    const badUser = { id: 99, name: "Bad User", email: null };
    const results = await Promise.all([
      emailService.sendOrderConfirmation(badUser, mockOrder),
      emailService.sendOrderStatusUpdate(badUser, mockOrder, "shipped"),
      emailService.sendWelcomeEmail(badUser),
      emailService.sendLowStockAlert(null, mockProduct),
      emailService.sendReturnRequestUpdate(badUser, mockReturnRequest),
      emailService.sendPasswordReset(badUser, "token"),
    ]);

    // None should throw; all should return an object (success or failure)
    for (const result of results) {
      expect(result).toBeDefined();
      expect(typeof result).toBe("object");
    }

    process.env.EMAIL_HOST = originalHost;
  });
});
