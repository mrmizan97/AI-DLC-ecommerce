// S3 driver — activated when STORAGE_DRIVER=s3.
// Requires env: S3_BUCKET, S3_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY.
// Optional: S3_ENDPOINT (for MinIO / R2), S3_PUBLIC_URL (CDN prefix), S3_FORCE_PATH_STYLE=true.

const path = require("path");
const crypto = require("crypto");

let s3Client;
function getClient() {
  if (s3Client) return s3Client;
  const { S3Client } = require("@aws-sdk/client-s3");
  s3Client = new S3Client({
    region: process.env.S3_REGION || "us-east-1",
    endpoint: process.env.S3_ENDPOINT || undefined,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
    credentials: process.env.AWS_ACCESS_KEY_ID
      ? {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }
      : undefined,
  });
  return s3Client;
}

function makeKey(originalName, folder) {
  const ext = path.extname(originalName || "").toLowerCase();
  const safe = (originalName || "file").replace(/[^a-z0-9]/gi, "_").slice(0, 40);
  const id = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}-${safe}${ext}`;
  return folder ? `${folder}/${id}` : id;
}

function buildPublicUrl(key) {
  const explicit = process.env.S3_PUBLIC_URL;
  if (explicit) return `${explicit.replace(/\/$/, "")}/${key}`;
  const bucket = process.env.S3_BUCKET;
  const region = process.env.S3_REGION || "us-east-1";
  if (process.env.S3_ENDPOINT) {
    const ep = process.env.S3_ENDPOINT.replace(/\/$/, "");
    return process.env.S3_FORCE_PATH_STYLE === "true"
      ? `${ep}/${bucket}/${key}`
      : `${ep}/${key}`;
  }
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

module.exports = {
  name: "s3",

  async upload({ buffer, originalName, mimetype, folder }) {
    const { PutObjectCommand } = require("@aws-sdk/client-s3");
    const bucket = process.env.S3_BUCKET;
    if (!bucket) throw new Error("S3_BUCKET env var not set");
    const key = makeKey(originalName, folder);
    await getClient().send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: mimetype,
      })
    );
    return { url: buildPublicUrl(key), key };
  },

  async remove({ key }) {
    if (!key) return;
    const { DeleteObjectCommand } = require("@aws-sdk/client-s3");
    const bucket = process.env.S3_BUCKET;
    if (!bucket) return;
    try {
      await getClient().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    } catch {}
  },
};
