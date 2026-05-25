// Tests for #7 activityLogRetention — deletes rows older than retentionDays.

const { ActivityLog } = require("../../src/model");
const { runActivityLogRetention } = require("../../src/lib/jobs/activityLogRetention");

describe("#7 activity-log-retention", () => {
  beforeEach(async () => {
    await ActivityLog.destroy({ where: {} });
  });

  test("deletes rows older than retentionDays, keeps newer", async () => {
    await ActivityLog.create({
      action: "old", description: "old",
      created_at: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000),
    }, { silent: true });
    await ActivityLog.create({
      action: "old2", description: "old2",
      created_at: new Date(Date.now() - 95 * 24 * 60 * 60 * 1000),
    }, { silent: true });
    await ActivityLog.create({
      action: "recent", description: "recent",
      created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    }, { silent: true });

    const r = await runActivityLogRetention({ retentionDays: 90 });
    expect(r.deleted).toBe(2);

    const remaining = await ActivityLog.findAll();
    expect(remaining.length).toBe(1);
    expect(remaining[0].action).toBe("recent");
  });

  test("no-op when no rows are old enough", async () => {
    await ActivityLog.create({ action: "fresh", description: "fresh" });
    const r = await runActivityLogRetention({ retentionDays: 90 });
    expect(r.deleted).toBe(0);
  });
});
