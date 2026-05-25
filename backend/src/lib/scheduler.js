// Register all cron-style repeatable jobs with BullMQ.
//
// BullMQ has built-in repeatable jobs so we don't need a second cron library.
// Each entry says: "this job name runs on this cron pattern". The worker
// handles them like any other job.
//
// Cron uses the standard 5-field syntax (no seconds):
//   minute hour day-of-month month day-of-week
//
// Call registerScheduledJobs() once at boot (or on demand via an admin route).

const { jobsQueue } = require("./queue");

const SCHEDULES = [
  // #1 Flash sale activate/deactivate — every minute
  { name: "flash-sale-tick", cron: "* * * * *" },

  // #2 Stale order sweep — every 15 minutes
  { name: "stale-order-sweep", cron: "*/15 * * * *" },

  // #3 Coupon expiry — top of every hour
  { name: "coupon-expiry", cron: "0 * * * *" },

  // #4 Daily sales report — 02:00 every day
  { name: "daily-sales-report", cron: "0 2 * * *" },

  // #5 Low-stock digest — 09:00 every day
  { name: "low-stock-digest", cron: "0 9 * * *" },

  // #6 Review request — 11:00 every day
  { name: "review-request", cron: "0 11 * * *" },

  // #7 Activity log retention — 03:00 every day
  { name: "activity-log-retention", cron: "0 3 * * *" },

  // #9 Orphan media cleanup — every 6 hours
  { name: "orphan-media-cleanup", cron: "0 */6 * * *" },

  // #10 Abandoned wishlist reminder — Monday 08:00
  { name: "abandoned-cart-reminder", cron: "0 8 * * 1" },

  // #11 Failed payment retry — every 5 minutes
  { name: "failed-payment-retry", cron: "*/5 * * * *" },

  // Note: #8 wishlist-back-in-stock is event-driven (enqueued when stock
  // changes), not scheduled. See service/productService or productController.
];

async function registerScheduledJobs() {
  const results = [];
  for (const { name, cron } of SCHEDULES) {
    // jobId guarantees we don't create duplicate schedulers on restart.
    await jobsQueue.add(
      name,
      { scheduled: true },
      {
        repeat: { pattern: cron },
        jobId: `schedule:${name}`,
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 100 },
      }
    );
    results.push({ name, cron });
  }
  return results;
}

async function listSchedules() {
  const repeatable = await jobsQueue.getRepeatableJobs();
  return repeatable.map((r) => ({ name: r.name, cron: r.pattern, next: r.next }));
}

async function removeSchedule(name) {
  const repeatable = await jobsQueue.getRepeatableJobs();
  const match = repeatable.find((r) => r.name === name);
  if (!match) return false;
  await jobsQueue.removeRepeatableByKey(match.key);
  return true;
}

module.exports = { SCHEDULES, registerScheduledJobs, listSchedules, removeSchedule };
