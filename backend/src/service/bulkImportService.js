const { parse } = require("csv-parse/sync");
const { Product } = require("../model");

const CSV_COLUMNS = ["name", "description", "price", "stock", "category_id", "brand", "sku", "image_url", "status"];
const VALID_STATUSES = ["active", "inactive", "discontinued"];

const bulkImportService = {
  /**
   * Parse CSV buffer into array of row objects.
   * @param {Buffer} buffer
   * @returns {Array<Object>}
   */
  parseCSV(buffer) {
    const records = parse(buffer, {
      columns: true,         // use first row as headers
      skip_empty_lines: true,
      trim: true,
    });
    return records;
  },

  /**
   * Validate a single row. Returns array of error strings (empty = valid).
   * @param {Object} row
   * @param {number} index   0-based row index (after header)
   * @returns {string[]}
   */
  validateRow(row, index) {
    const errors = [];

    if (!row.name || String(row.name).trim() === "") {
      errors.push(`Row ${index + 1}: name is required`);
    }

    const price = parseFloat(row.price);
    if (row.price === undefined || row.price === "" || isNaN(price) || price < 0) {
      errors.push(`Row ${index + 1}: price must be a non-negative number`);
    }

    const stock = parseInt(row.stock, 10);
    if (row.stock !== undefined && row.stock !== "" && (isNaN(stock) || stock < 0)) {
      errors.push(`Row ${index + 1}: stock must be a non-negative integer`);
    }

    if (!row.category_id || isNaN(parseInt(row.category_id, 10))) {
      errors.push(`Row ${index + 1}: category_id must be a valid integer`);
    }

    if (!row.sku || String(row.sku).trim() === "") {
      errors.push(`Row ${index + 1}: sku is required`);
    }

    if (row.status && !VALID_STATUSES.includes(row.status)) {
      errors.push(`Row ${index + 1}: status must be one of: ${VALID_STATUSES.join(", ")}`);
    }

    return errors;
  },

  /**
   * Bulk-import valid rows. Returns { success: [], errors: [] }.
   * @param {Array<Object>} rows
   * @returns {Promise<{ success: Array, errors: Array }>}
   */
  async importProducts(rows) {
    const results = { success: [], errors: [] };

    const settlements = await Promise.allSettled(
      rows.map(async (row, index) => {
        const validationErrors = this.validateRow(row, index);
        if (validationErrors.length > 0) {
          throw new Error(validationErrors.join("; "));
        }

        const productData = {
          name: String(row.name).trim(),
          description: row.description ? String(row.description).trim() : null,
          price: parseFloat(row.price),
          stock: row.stock !== undefined && row.stock !== "" ? parseInt(row.stock, 10) : 0,
          category_id: parseInt(row.category_id, 10),
          brand: row.brand ? String(row.brand).trim() : null,
          sku: String(row.sku).trim(),
          image_url: row.image_url ? String(row.image_url).trim() : null,
          status: VALID_STATUSES.includes(row.status) ? row.status : "active",
        };

        return await Product.create(productData);
      })
    );

    settlements.forEach((result, index) => {
      if (result.status === "fulfilled") {
        results.success.push({ row: index + 1, data: result.value });
      } else {
        results.errors.push({ row: index + 1, error: result.reason.message });
      }
    });

    return results;
  },

  /**
   * Return CSV header string for download.
   * @returns {string}
   */
  generateTemplate() {
    return CSV_COLUMNS.join(",") + "\n";
  },
};

module.exports = bulkImportService;
