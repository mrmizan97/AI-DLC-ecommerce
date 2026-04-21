const path = require("path");
const fs = require("fs");
const { Media } = require("../model");

const UPLOAD_DIR = path.join(__dirname, "..", "..", "uploads");
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

const VALID_TYPES = ["Product", "Category", "User"];

function buildUrl(filename) {
  return `${BACKEND_URL}/uploads/${filename}`;
}

const mediaService = {
  async attach({ mediable_type, mediable_id, file, collection = "default", is_thumbnail = false }) {
    if (!VALID_TYPES.includes(mediable_type)) throw new Error("Invalid mediable_type");

    // For collections that should only have ONE item (profile photo, cover), delete previous
    if (collection === "profile" || collection === "cover") {
      const previous = await Media.findAll({ where: { mediable_type, mediable_id, collection } });
      for (const p of previous) {
        const fp = path.join(UPLOAD_DIR, path.basename(p.url));
        if (fs.existsSync(fp)) fs.unlinkSync(fp);
        await p.destroy();
      }
    }

    const media = await Media.create({
      mediable_type,
      mediable_id,
      url: buildUrl(file.filename),
      filename: file.filename,
      mime_type: file.mimetype,
      size: file.size,
      collection,
      is_thumbnail,
    });
    return media;
  },

  async findFor(mediable_type, mediable_id) {
    if (!VALID_TYPES.includes(mediable_type)) return [];
    return await Media.findAll({
      where: { mediable_type, mediable_id },
      order: [["is_thumbnail", "DESC"], ["sort_order", "ASC"], ["id", "ASC"]],
    });
  },

  async remove(id) {
    const m = await Media.findByPk(id);
    if (!m) return null;
    const fp = path.join(UPLOAD_DIR, path.basename(m.url));
    if (fs.existsSync(fp)) {
      try { fs.unlinkSync(fp); } catch {}
    }
    await m.destroy();
    return m;
  },

  async setThumbnail(id) {
    const m = await Media.findByPk(id);
    if (!m) return null;
    // Unset siblings, set this one
    await Media.update(
      { is_thumbnail: false },
      { where: { mediable_type: m.mediable_type, mediable_id: m.mediable_id } }
    );
    await m.update({ is_thumbnail: true });
    return m;
  },
};

module.exports = mediaService;
