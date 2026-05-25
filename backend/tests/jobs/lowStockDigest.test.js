// Tests for #5 lowStockDigest — only sends a digest when at least one
// alert is still below threshold, and auto-resolves recovered products.

const shared = require("../shared");
const { LowStockAlert, Product } = require("../../src/model");
const emailService = require("../../src/service/emailService");
const { runLowStockDigest } = require("../../src/lib/jobs/lowStockDigest");

describe("#5 low-stock-digest", () => {
  let originalStock1;
  let originalStock2;

  beforeAll(async () => {
    const p1 = await Product.findByPk(shared.productId);
    const p2 = await Product.findByPk(shared.productId2);
    originalStock1 = p1.stock;
    originalStock2 = p2.stock;
  });

  beforeEach(async () => {
    await LowStockAlert.destroy({ where: {} });
  });

  afterAll(async () => {
    await Product.update({ stock: originalStock1 }, { where: { id: shared.productId } });
    await Product.update({ stock: originalStock2 }, { where: { id: shared.productId2 } });
  });

  test("sends digest covering products still below threshold", async () => {
    await Product.update({ stock: 3 }, { where: { id: shared.productId } });
    await LowStockAlert.create({ product_id: shared.productId, current_stock: 3, threshold: 10, resolved: false });
    await Product.update({ stock: 50 }, { where: { id: shared.productId2 } });
    await LowStockAlert.create({ product_id: shared.productId2, current_stock: 1, threshold: 10, resolved: false });

    const spy = jest.spyOn(emailService, "sendCustom").mockResolvedValue({ success: true });
    const r = await runLowStockDigest({ threshold: 10 });

    expect(r.productsLow).toBe(1); // only productId — productId2 has recovered
    expect(r.digestSent).toBeGreaterThanOrEqual(1);

    const recovered = await LowStockAlert.findOne({ where: { product_id: shared.productId2 } });
    expect(recovered.resolved).toBe(true);
    spy.mockRestore();
  });

  test("sends no email when nothing is below threshold", async () => {
    await Product.update({ stock: 100 }, { where: { id: shared.productId } });
    await LowStockAlert.create({ product_id: shared.productId, current_stock: 5, threshold: 10, resolved: false });

    const spy = jest.spyOn(emailService, "sendCustom").mockResolvedValue({ success: true });
    const r = await runLowStockDigest({ threshold: 10 });
    expect(r.digestSent).toBe(0);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
