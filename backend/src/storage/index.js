// Switchable storage driver. Pick via STORAGE_DRIVER env (default: local).
// Drivers expose: upload({buffer, originalName, mimetype, folder}) -> {url, key}
//                 remove({key, url}) -> void

function pickDriver() {
  const explicit = (process.env.STORAGE_DRIVER || "").toLowerCase().trim();
  if (explicit) {
    if (explicit === "cloudinary") return require("./cloudinary");
    if (explicit === "s3") return require("./s3");
    if (explicit === "local") return require("./local");
    throw new Error(`Unknown STORAGE_DRIVER: ${explicit}`);
  }
  // Back-compat: if CLOUDINARY_URL is set and no explicit driver, use cloudinary.
  if (process.env.CLOUDINARY_URL) return require("./cloudinary");
  return require("./local");
}

const driver = pickDriver();

module.exports = {
  driver,
  upload: (opts) => driver.upload(opts),
  remove: (opts) => driver.remove(opts),
};
