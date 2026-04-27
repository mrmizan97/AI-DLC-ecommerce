const bulkImportService = require("../service/bulkImportService");

const bulkImportController = {
  /**
   * POST /api/bulk-import/import
   * Accepts multipart CSV upload, parses, validates, and imports products.
   */
  async importProducts(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "No CSV file uploaded" });
      }

      let rows;
      try {
        rows = bulkImportService.parseCSV(req.file.buffer);
      } catch (parseError) {
        return res.status(400).json({ success: false, message: `CSV parse error: ${parseError.message}` });
      }

      if (!rows || rows.length === 0) {
        return res.status(400).json({ success: false, message: "CSV file is empty or has no data rows" });
      }

      const { success, errors } = await bulkImportService.importProducts(rows);

      const total = rows.length;
      const imported = success.length;
      const failed = errors.length;

      return res.status(201).json({
        success: true,
        data: {
          total,
          imported,
          failed,
          errors,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/bulk-import/template
   * Returns a downloadable CSV template file.
   */
  async downloadTemplate(req, res, next) {
    try {
      const csvTemplate = bulkImportService.generateTemplate();

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", 'attachment; filename="product_template.csv"');
      res.status(200).send(csvTemplate);
    } catch (error) {
      next(error);
    }
  },
};

module.exports = bulkImportController;
