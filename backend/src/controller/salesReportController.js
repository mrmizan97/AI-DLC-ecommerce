const salesReportService = require("../service/salesReportService");

const salesReportController = {
  /**
   * GET /api/reports/summary
   * Query: start_date, end_date, group_by (day|week|month)
   */
  async getSummary(req, res, next) {
    try {
      const data = await salesReportService.getSalesSummary(req.query);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/reports/top-products
   * Query: start_date, end_date, limit
   */
  async getTopProducts(req, res, next) {
    try {
      const data = await salesReportService.getTopProducts(req.query);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/reports/top-customers
   * Query: start_date, end_date, limit
   */
  async getTopCustomers(req, res, next) {
    try {
      const data = await salesReportService.getTopCustomers(req.query);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/reports/export/csv
   * Export full report as CSV download.
   */
  async exportCSV(req, res, next) {
    try {
      const reportData = await salesReportService.generateFullReport(req.query);
      const csv = salesReportService.generateCSVReport(reportData);

      const filename = `sales_report_${new Date().toISOString().slice(0, 10)}.csv`;
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.status(200).send(csv);
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/reports/export/json
   * Export full report as JSON.
   */
  async exportJSON(req, res, next) {
    try {
      const data = await salesReportService.generateFullReport(req.query);
      const filename = `sales_report_${new Date().toISOString().slice(0, 10)}.json`;
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = salesReportController;
