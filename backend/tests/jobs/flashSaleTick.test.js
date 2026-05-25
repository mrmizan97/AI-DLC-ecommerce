// Tests for #1 flashSaleTick — calls the pure handler directly so no Redis
// is needed. Seeds two FlashSale rows: one that should activate, one that
// should deactivate.

const shared = require("../shared");
const { FlashSale } = require("../../src/model");
const { runFlashSaleTick } = require("../../src/lib/jobs/flashSaleTick");

describe("#1 flash-sale-tick", () => {
  beforeEach(async () => {
    await FlashSale.destroy({ where: {} });
  });

  test("activates a sale whose start_time has arrived", async () => {
    const start = new Date(Date.now() - 60_000); // 1 min ago
    const end = new Date(Date.now() + 60 * 60_000); // 1h ahead

    await FlashSale.create({
      product_id: shared.productId,
      sale_price: 19.99,
      original_price: 29.99,
      discount_percentage: 33,
      start_time: start,
      end_time: end,
      is_active: false,
    });

    const r = await runFlashSaleTick();
    expect(r.activated).toBe(1);
    expect(r.deactivated).toBe(0);

    const fs = await FlashSale.findOne({ where: { product_id: shared.productId } });
    expect(fs.is_active).toBe(true);
  });

  test("deactivates a sale whose end_time has passed", async () => {
    await FlashSale.create({
      product_id: shared.productId,
      sale_price: 19.99,
      original_price: 29.99,
      discount_percentage: 33,
      start_time: new Date(Date.now() - 3 * 60 * 60_000),
      end_time: new Date(Date.now() - 60_000),
      is_active: true,
    });

    const r = await runFlashSaleTick();
    expect(r.deactivated).toBe(1);

    const fs = await FlashSale.findOne({ where: { product_id: shared.productId } });
    expect(fs.is_active).toBe(false);
  });

  test("no-op when there is nothing to flip", async () => {
    const r = await runFlashSaleTick();
    expect(r.activated).toBe(0);
    expect(r.deactivated).toBe(0);
  });
});
