// Tests for #3 couponExpiry — expired+active coupons get deactivated;
// unexpired and already-inactive ones are untouched.

const { Coupon } = require("../../src/model");
const { runCouponExpiry } = require("../../src/lib/jobs/couponExpiry");

describe("#3 coupon-expiry", () => {
  beforeEach(async () => {
    await Coupon.destroy({ where: {} });
  });

  test("deactivates active coupons past expires_at", async () => {
    await Coupon.create({
      code: "EXP1", type: "percentage", value: 10,
      is_active: true, expires_at: new Date(Date.now() - 60_000),
    });
    await Coupon.create({
      code: "EXP2", type: "fixed", value: 5,
      is_active: true, expires_at: new Date(Date.now() - 60_000),
    });
    await Coupon.create({
      code: "VALID", type: "percentage", value: 10,
      is_active: true, expires_at: new Date(Date.now() + 60_000),
    });
    await Coupon.create({
      code: "NOEXP", type: "fixed", value: 5,
      is_active: true, expires_at: null,
    });

    const r = await runCouponExpiry();
    expect(r.deactivated).toBe(2);

    const valid = await Coupon.findOne({ where: { code: "VALID" } });
    expect(valid.is_active).toBe(true);
    const noExp = await Coupon.findOne({ where: { code: "NOEXP" } });
    expect(noExp.is_active).toBe(true);
    const exp = await Coupon.findOne({ where: { code: "EXP1" } });
    expect(exp.is_active).toBe(false);
  });

  test("no-op when nothing is expired", async () => {
    const r = await runCouponExpiry();
    expect(r.deactivated).toBe(0);
  });
});
