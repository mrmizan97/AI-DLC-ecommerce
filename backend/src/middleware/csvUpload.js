const multer = require("multer");

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = ["text/csv", "application/vnd.ms-excel"];
  if (allowed.includes(file.mimetype)) {
    return cb(null, true);
  }
  cb(new Error("Only CSV files are allowed (text/csv or application/vnd.ms-excel)"));
};

const csvUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

module.exports = csvUpload;
