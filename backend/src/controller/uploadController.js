const storage = require("../storage");

const uploadController = {
  async upload(req, res, next) {
    try {
      if (!req.file?.buffer) {
        return res.status(400).json({ success: false, message: "No file uploaded" });
      }
      const folder = (req.body?.folder || "ai-dlc/misc").replace(/[^a-zA-Z0-9/_-]/g, "");
      const result = await storage.upload({
        buffer: req.file.buffer,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        folder,
      });
      res.status(201).json({
        success: true,
        data: {
          url: result.url,
          key: result.key,
          mime_type: req.file.mimetype,
          size: req.file.size,
        },
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = uploadController;
