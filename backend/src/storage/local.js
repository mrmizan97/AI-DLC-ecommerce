const path = require("path");
const fs = require("fs/promises");
const fsSync = require("fs");
const crypto = require("crypto");

const UPLOAD_DIR = path.resolve(__dirname, "..", "..", "uploads");
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

if (!fsSync.existsSync(UPLOAD_DIR)) {
  fsSync.mkdirSync(UPLOAD_DIR, { recursive: true });
}

function makeFilename(originalName, mimetype) {
  const extFromName = path.extname(originalName || "").toLowerCase();
  const extFromMime = mimetype?.startsWith("image/") ? "." + mimetype.split("/")[1].replace("jpeg", "jpg") : "";
  const ext = extFromName || extFromMime || "";
  const safe = (originalName || "file").replace(/[^a-z0-9]/gi, "_").slice(0, 40);
  return `${Date.now()}-${crypto.randomBytes(4).toString("hex")}-${safe}${ext}`;
}

module.exports = {
  name: "local",

  async upload({ buffer, originalName, mimetype, folder }) {
    const dir = folder ? path.join(UPLOAD_DIR, folder) : UPLOAD_DIR;
    await fs.mkdir(dir, { recursive: true });
    const filename = makeFilename(originalName, mimetype);
    const filePath = path.join(dir, filename);
    await fs.writeFile(filePath, buffer);
    const relative = path.relative(UPLOAD_DIR, filePath).split(path.sep).join("/");
    return {
      url: `${BACKEND_URL}/uploads/${relative}`,
      key: relative,
    };
  },

  async remove({ key, url }) {
    const target = key
      ? path.join(UPLOAD_DIR, key)
      : url
      ? path.join(UPLOAD_DIR, path.basename(new URL(url).pathname))
      : null;
    if (!target) return;
    try {
      await fs.unlink(target);
    } catch {}
  },
};
