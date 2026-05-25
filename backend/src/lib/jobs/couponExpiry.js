// #3 Coupon expiry. Runs hourly.
//
// What it does: any coupon with expires_at < now AND is_active=true gets
// flipped to is_active=false.
//
// Why a job: a stale active+expired coupon either silently keeps applying
// (money lost) or shows as valid in the UI (trust lost). Either way it's
// noise admins shouldn't have to chase manually.

const { Op } = require("sequelize");
const { Coupon } = require("../../model");

async function runCouponExpiry(now = new Date()) {
  const [deactivated] = await Coupon.update(
    { is_active: false },
    {
      where: {
        is_active: true,
        expires_at: { [Op.not]: null, [Op.lt]: now },
      },
    }
  );
  return { deactivated, at: now.toISOString() };
}

module.exports = { runCouponExpiry };
