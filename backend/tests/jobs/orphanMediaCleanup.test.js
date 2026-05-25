// Tests for #9 orphanMediaCleanup — deletes Media rows whose owner is gone,
// leaves valid ones alone.

const shared = require("../shared");
const { Media } = require("../../src/model");
const { runOrphanMediaCleanup } = require("../../src/lib/jobs/orphanMediaCleanup");

describe("#9 orphan-media-cleanup", () => {
  beforeEach(async () => {
    await Media.destroy({ where: {} });
  });

  test("deletes media pointing at non-existent owner, keeps valid ones", async () => {
    // Valid — owner exists
    await Media.create({
      mediable_type: "Product",
      mediable_id: shared.productId,
      url: "https://x/y.jpg",
    });
    // Orphan — product 999999 doesn't exist
    await Media.create({
      mediable_type: "Product",
      mediable_id: 999_999,
      url: "https://x/z.jpg",
    });
    // Unknown owner type — should be skipped, not deleted (safe default)
    await Media.create({
      mediable_type: "MysteryThing",
      mediable_id: 1,
      url: "https://x/mystery.jpg",
    });

    const r = await runOrphanMediaCleanup();
    expect(r.deleted).toBe(1);

    const remaining = await Media.findAll();
    expect(remaining.length).toBe(2);
    expect(remaining.some((m) => m.mediable_type === "Product" && m.mediable_id === shared.productId)).toBe(true);
    expect(remaining.some((m) => m.mediable_type === "MysteryThing")).toBe(true);
  });
});
