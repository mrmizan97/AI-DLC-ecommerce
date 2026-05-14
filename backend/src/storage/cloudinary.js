// Cloudinary driver — activated when STORAGE_DRIVER=cloudinary AND CLOUDINARY_URL is set.
// The SDK auto-parses CLOUDINARY_URL=cloudinary://<key>:<secret>@<cloud_name>.

let cloudinary;
function getSdk() {
  if (!cloudinary) cloudinary = require("cloudinary").v2;
  return cloudinary;
}

function uploadBuffer(buffer, folder) {
  return new Promise((resolve, reject) => {
    const stream = getSdk().uploader.upload_stream(
      { folder, resource_type: "image" },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(buffer);
  });
}

module.exports = {
  name: "cloudinary",

  async upload({ buffer, folder }) {
    const result = await uploadBuffer(buffer, folder || "ai-dlc");
    return {
      url: result.secure_url,
      key: result.public_id,
    };
  },

  async remove({ key }) {
    if (!key) return;
    try {
      await getSdk().uploader.destroy(key);
    } catch {}
  },
};
