// #7 Activity log retention. Runs at 03:00 daily.
//
// What it does: deletes ActivityLog rows older than `retentionDays`
// (default 90).
//
// Why a job: ActivityLog grows forever. After ~6 months the table dominates
// the DB and slows down everything that joins or scans it. A simple TTL
// keeps the table boring.

const { Op } = require("sequelize");
const { ActivityLog } = require("../../model");

async function runActivityLogRetention({ retentionDays = 90, now = new Date() } = {}) {
  const cutoff = new Date(now.getTime() - retentionDays * 24 * 60 * 60 * 1000);
  const deleted = await ActivityLog.destroy({
    where: { created_at: { [Op.lt]: cutoff } },
  });
  return { deleted, cutoff: cutoff.toISOString(), retentionDays };
}

module.exports = { runActivityLogRetention };
