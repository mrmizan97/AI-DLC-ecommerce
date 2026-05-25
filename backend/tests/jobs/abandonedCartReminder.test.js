// Tests for #10 abandonedCartReminder — one email per user listing their
// stale wishlist items (older than staleDays).

const shared = require("../shared");
const { Wishlist } = require("../../src/model");
const emailService = require("../../src/service/emailService");
const { runAbandonedCartReminder } = require("../../src/lib/jobs/abandonedCartReminder");

describe("#10 abandoned-cart-reminder", () => {
  beforeEach(async () => {
    await Wishlist.destroy({ where: {} });
  });

  test("emails once per user, grouping their stale wishlist items", async () => {
    const old = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
    await Wishlist.create({ user_id: shared.customerId, product_id: shared.productId,  created_at: old }, { silent: true });
    await Wishlist.create({ user_id: shared.customerId, product_id: shared.productId2, created_at: old }, { silent: true });
    // Fresh — should NOT trigger
    await Wishlist.create({ user_id: shared.customerId, product_id: shared.productId, created_at: new Date() }, { silent: true });

    const spy = jest.spyOn(emailService, "sendCustom").mockResolvedValue({ success: true });
    const r = await runAbandonedCartReminder({ staleDays: 7 });

    expect(r.usersTargeted).toBe(1);
    expect(r.emailsSent).toBe(1);
    expect(spy).toHaveBeenCalledTimes(1);
    // The single email should list both stale products.
    const html = spy.mock.calls[0][2];
    expect(html).toContain("Wireless Mouse");
    expect(html).toContain("USB Keyboard");
    spy.mockRestore();
  });

  test("no email when no stale items exist", async () => {
    await Wishlist.create({ user_id: shared.customerId, product_id: shared.productId, created_at: new Date() }, { silent: true });
    const spy = jest.spyOn(emailService, "sendCustom").mockResolvedValue({ success: true });
    const r = await runAbandonedCartReminder({ staleDays: 7 });
    expect(r.emailsSent).toBe(0);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
