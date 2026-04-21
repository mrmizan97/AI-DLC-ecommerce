const mediaService = require("../service/mediaService");

const mediaController = {
  async upload(req, res, next) {
    try {
      const { mediable_type, mediable_id, collection, is_thumbnail } = req.body;
      if (!req.file) {
        return res.status(400).json({ success: false, message: "No file uploaded" });
      }
      if (!mediable_type || !mediable_id) {
        return res.status(400).json({ success: false, message: "mediable_type and mediable_id are required" });
      }
      const media = await mediaService.attach({
        mediable_type,
        mediable_id: parseInt(mediable_id),
        file: req.file,
        collection: collection || "default",
        is_thumbnail: is_thumbnail === "true" || is_thumbnail === true,
      });
      res.status(201).json({ success: true, data: media });
    } catch (error) {
      next(error);
    }
  },

  async list(req, res, next) {
    try {
      const { type, id } = req.params;
      const data = await mediaService.findFor(type, parseInt(id));
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const data = await mediaService.remove(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Media not found" });
      res.json({ success: true, message: "Deleted" });
    } catch (error) {
      next(error);
    }
  },

  async setThumbnail(req, res, next) {
    try {
      const data = await mediaService.setThumbnail(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: "Media not found" });
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = mediaController;
