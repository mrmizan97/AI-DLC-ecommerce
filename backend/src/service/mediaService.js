const path = require("path");
const fs = require("fs");
const { Media } = require("../model");

const UPLOAD_DIR = path.join(__dirname, "..", "..", "uploads");
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

const VALID_TYPES = ["Product", "Category", "User"];

const useCloudinary = !!process.env.CLOUDINARY_URL;
let cloudinary = null;
if (useCloudinary) {
  // Lazy-require so local dev without the dep installed (older worktrees) still works.
  cloudinary = require("cloudinary").v2;
  // The SDK auto-parses CLOUDINARY_URL=cloudinary://<key>:<secret>@<cloud_name>
}

function uploadBufferToCloudinary(buffer, folder) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(buffer);
  });
}

function buildLocalUrl(filename) {
  return `${BACKEND_URL}/uploads/${filename}`;
}

async function persistFile(file, folder) {
  if (useCloudinary) {
    const result = await uploadBufferToCloudinary(file.buffer, folder);
    // We reuse the existing `filename` column to store Cloudinary's public_id
    // so deletes can find the asset later — no migration needed.
    return { url: result.secure_url, filename: result.public_id };
  }
  return { url: buildLocalUrl(file.filename), filename: file.filename };
}

async function removeFile(media) {
  if (useCloudinary) {
    if (media.filename) {
      try { await cloudinary.uploader.destroy(media.filename); } catch {}
    }
    return;
  }
  const fp = path.join(UPLOAD_DIR, path.basename(media.url));
  if (fs.existsSync(fp)) {
    try { fs.unlinkSync(fp); } catch {}
  }
}

const mediaService = {
  async attach({ mediable_type, mediable_id, file, collection = "default", is_thumbnail = false }) {
    if (!VALID_TYPES.includes(mediable_type)) throw new Error("Invalid mediable_type");

    // For collections that should only have ONE item (profile photo, cover), delete previous
    if (collection === "profile" || collection === "cover") {
      const previous = await Media.findAll({ where: { mediable_type, mediable_id, collection } });
      for (const p of previous) {
        await removeFile(p);
        await p.destroy();
      }
    }

    const folder = `ai-dlc/${mediable_type.toLowerCase()}`;
    const { url, filename } = await persistFile(file, folder);

    const media = await Media.create({
      mediable_type,
      mediable_id,
      url,
      filename,
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
    await removeFile(m);
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
