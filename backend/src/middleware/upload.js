const multer = require("multer");

// All storage drivers (local/s3/cloudinary) consume a Buffer, so multer always
// streams to memory; the driver layer decides where bytes land.

const fileFilter = (req, file, cb) => {
  if (/^image\/(jpeg|jpg|png|gif|webp)$/i.test(file.mimetype)) return cb(null, true);
  cb(new Error("Only image files (jpg, png, gif, webp) are allowed"));
};

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

module.exports = upload;
