const returnRequestService = require("../service/returnRequestService");

const returnRequestController = {
  async create(req, res, next) {
    try {
      const data = await returnRequestService.create(req.user.id, req.body);
      res.status(201).json({ success: true, message: "Return request submitted successfully", data });
    } catch (error) {
      if (error.statusCode === 400) {
        return res.status(400).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  async findAll(req, res, next) {
    try {
      const result = await returnRequestService.findAll(req.query);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  async findByUser(req, res, next) {
    try {
      const result = await returnRequestService.findByUser(req.user.id, req.query);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  async findById(req, res, next) {
    try {
      const returnRequest = await returnRequestService.findById(req.params.id);
      if (!returnRequest) {
        return res.status(404).json({ success: false, message: "Return request not found" });
      }
      if (req.user.role !== "admin" && returnRequest.user_id !== req.user.id) {
        return res.status(403).json({ success: false, message: "Access denied" });
      }
      res.json({ success: true, data: returnRequest });
    } catch (error) {
      next(error);
    }
  },

  async updateStatus(req, res, next) {
    try {
      const result = await returnRequestService.updateStatus(req.params.id, req.body);
      if (!result) {
        return res.status(404).json({ success: false, message: "Return request not found" });
      }
      res.json({ success: true, message: "Return request updated successfully", data: result });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = returnRequestController;
