// #9 Orphan media cleanup. Runs every 6 hours.
//
// What it does: deletes Media rows whose `mediable_id` no longer points to
// an existing record of `mediable_type` (e.g. product deleted but its
// images stuck around). For S3/Cloudinary, we just delete the DB rows here
// — wiring the actual blob delete is a follow-up so this stays safe by
// default.
//
// Why a job: every Product/Slider delete should cascade media in theory,
// but in practice rows leak (bugs, partial deletes, hard-deletes that
// bypass hooks). A weekly sweep keeps the table from rotting.

const { Op } = require("sequelize");
const { Media, Product, Slider } = require("../../model");

// Map mediable_type strings to the models that own them. Extend when you
// add a new model that owns media.
const OWNERS = {
  Product,
  Slider,
};

async function runOrphanMediaCleanup({ deleteBlobs = false } = {}) {
  const all = await Media.findAll({ attributes: ["id", "mediable_type", "mediable_id"] });
  const orphanIds = [];

  // Group by mediable_type so we hit each owner table once per type.
  const byType = {};
  for (const m of all) {
    (byType[m.mediable_type] ||= []).push(m);
  }

  for (const [type, rows] of Object.entries(byType)) {
    const Model = OWNERS[type];
    if (!Model) {
      // Unknown owner type — assume orphan to be safe? No. Skip and surface.
      console.warn(`[orphanMediaCleanup] unknown mediable_type "${type}", skipping`);
      continue;
    }
    const ids = [...new Set(rows.map((r) => r.mediable_id))];
    const found = await Model.findAll({ where: { id: { [Op.in]: ids } }, attributes: ["id"] });
    const foundSet = new Set(found.map((f) => f.id));
    for (const r of rows) {
      if (!foundSet.has(r.mediable_id)) orphanIds.push(r.id);
    }
  }

  if (orphanIds.length === 0) return { deleted: 0, scanned: all.length };

  // (deleteBlobs is a flag for a future S3/Cloudinary client — keeping the
  // contract here so the caller can opt in once that's wired.)
  const deleted = await Media.destroy({ where: { id: { [Op.in]: orphanIds } } });
  return { deleted, scanned: all.length, blobsRemoved: deleteBlobs ? deleted : 0 };
}

module.exports = { runOrphanMediaCleanup, OWNERS };
