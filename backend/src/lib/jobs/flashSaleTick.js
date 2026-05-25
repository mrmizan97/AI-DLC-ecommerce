// #1 Flash-sale tick. Runs every minute.
//
// What it does:
//   - Finds sales whose start_time has arrived but is_active=false → activate
//   - Finds sales whose end_time has passed but is_active=true   → deactivate
//
// Why a job: the FlashSale model has start/end timestamps, but without
// something running on a tick, sales never actually go live or end.

const { Op } = require("sequelize");
const { FlashSale } = require("../../model");

async function runFlashSaleTick(now = new Date()) {
  const [activated, deactivated] = await Promise.all([
    FlashSale.update(
      { is_active: true },
      { where: { is_active: false, start_time: { [Op.lte]: now }, end_time: { [Op.gt]: now } } }
    ),
    FlashSale.update(
      { is_active: false },
      { where: { is_active: true, end_time: { [Op.lte]: now } } }
    ),
  ]);

  return { activated: activated[0], deactivated: deactivated[0], at: now.toISOString() };
}

module.exports = { runFlashSaleTick };
