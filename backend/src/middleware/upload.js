const multer = require("multer");
const path = require("path");
const fs = require("fs");

// When CLOUDINARY_URL is set, multer stores the file in memory so we can stream
// the buffer to Cloudinary in mediaService.attach. Otherwise we fall back to
// local disk — convenient for `npm run dev` against docker-compose mysql.
const useCloudinary = !!process.env.CLOUDINARY_URL;

const UPLOAD_DIR = path.join(__dirname, "..", "..", "uploads");
if (!useCloudinary && !fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = useCloudinary
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (req, file, cb) => cb(null, UPLOAD_DIR),
      filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const safe = file.originalname.replace(/[^a-z0-9]/gi, "_").slice(0, 40);
        cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safe}${ext}`);
      },
    });

const fileFilter = (req, file, cb) => {
  if (/^image\/(jpeg|jpg|png|gif|webp)$/i.test(file.mimetype)) return cb(null, true);
  cb(new Error("Only image files (jpg, png, gif, webp) are allowed"));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

module.exports = upload;
