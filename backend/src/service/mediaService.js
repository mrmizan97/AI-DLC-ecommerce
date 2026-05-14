const { Media, Product, Category, Slider } = require("../model");
const storage = require("../storage");

const VALID_TYPES = ["Product", "Category", "User", "Slider"];

// When a banner/cover/thumbnail is attached to an entity that has its own
// image_url column, mirror the new URL there so the rest of the app (listings,
// public site) can keep reading the column without joining the media table.
async function syncImageUrl(mediable_type, mediable_id, collection, is_thumbnail, url) {
  if (mediable_type === "Slider" && collection === "banner") {
    await Slider.update({ image_url: url }, { where: { id: mediable_id } });
  } else if (mediable_type === "Product" && (collection === "thumbnail" || is_thumbnail)) {
    await Product.update({ image_url: url }, { where: { id: mediable_id } });
  } else if (mediable_type === "Category" && (collection === "thumbnail" || collection === "cover")) {
    // Category has no image_url column today — the polymorphic media row is
    // the source of truth, and frontend helpers already read it. No-op.
  }
}

const mediaService = {
  async attach({ mediable_type, mediable_id, file, collection = "default", is_thumbnail = false }) {
    if (!VALID_TYPES.includes(mediable_type)) throw new Error("Invalid mediable_type");
    if (!file?.buffer) throw new Error("File buffer missing");

    const singletonCollections = new Set([
      "profile", "cover", "thumbnail", "banner",
    ]);
    if (singletonCollections.has(collection)) {
      const previous = await Media.findAll({ where: { mediable_type, mediable_id, collection } });
      for (const p of previous) {
        await storage.remove({ key: p.filename, url: p.url });
        await p.destroy();
      }
    }

    const folder = `ai-dlc/${mediable_type.toLowerCase()}/${collection}`;
    const { url, key } = await storage.upload({
      buffer: file.buffer,
      originalName: file.originalname,
      mimetype: file.mimetype,
      folder,
    });

    const media = await Media.create({
      mediable_type,
      mediable_id,
      url,
      filename: key,
      mime_type: file.mimetype,
      size: file.size,
      collection,
      is_thumbnail,
    });

    await syncImageUrl(mediable_type, mediable_id, collection, is_thumbnail, url);
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
    await storage.remove({ key: m.filename, url: m.url });
    await m.destroy();
    return m;
  },

  async setThumbnail(id) {
    const m = await Media.findByPk(id);
    if (!m) return null;
    await Media.update(
      { is_thumbnail: false },
      { where: { mediable_type: m.mediable_type, mediable_id: m.mediable_id } }
    );
    await m.update({ is_thumbnail: true });
    if (m.mediable_type === "Product") {
      await Product.update({ image_url: m.url }, { where: { id: m.mediable_id } });
    }
    return m;
  },

  get driverName() {
    return storage.driver.name;
  },
};

module.exports = mediaService;
