const productVariantService = require("../service/productVariantService");

const productVariantController = {
  // Get all variants for a product
  getProductVariants: async (req, res, next) => {
    try {
      const { productId } = req.params;
      const variants = await productVariantService.getProductVariants(productId);

      res.status(200).json({
        success: true,
        message: "Product variants retrieved successfully",
        data: variants,
      });
    } catch (error) {
      next(error);
    }
  },

  // Get grouped variants (by name)
  getGroupedVariants: async (req, res, next) => {
    try {
      const { productId } = req.params;
      const grouped = await productVariantService.getGroupedVariants(productId);

      res.status(200).json({
        success: true,
        message: "Grouped variants retrieved successfully",
        data: grouped,
      });
    } catch (error) {
      next(error);
    }
  },

  // Get single variant
  getVariant: async (req, res, next) => {
    try {
      const { variantId } = req.params;
      const variant = await productVariantService.getVariant(variantId);

      res.status(200).json({
        success: true,
        message: "Variant retrieved successfully",
        data: variant,
      });
    } catch (error) {
      next(error);
    }
  },

  // Create variant
  createVariant: async (req, res, next) => {
    try {
      const { productId } = req.params;
      const { name, value, price_adjustment, stock, sku, image_url } = req.body;

      const variant = await productVariantService.createVariant(productId, {
        name,
        value,
        price_adjustment,
        stock,
        sku,
        image_url,
      });

      res.status(201).json({
        success: true,
        message: "Variant created successfully",
        data: variant,
      });
    } catch (error) {
      next(error);
    }
  },

  // Bulk create variants
  bulkCreateVariants: async (req, res, next) => {
    try {
      const { productId } = req.params;
      const { variants } = req.body;

      if (!Array.isArray(variants)) {
        return res.status(400).json({
          success: false,
          message: "Variants must be an array",
        });
      }

      const createdVariants = await productVariantService.bulkCreateVariants(
        productId,
        variants
      );

      res.status(201).json({
        success: true,
        message: `Created ${createdVariants.length} variants successfully`,
        data: createdVariants,
      });
    } catch (error) {
      next(error);
    }
  },

  // Update variant
  updateVariant: async (req, res, next) => {
    try {
      const { variantId } = req.params;
      const variant = await productVariantService.updateVariant(
        variantId,
        req.body
      );

      res.status(200).json({
        success: true,
        message: "Variant updated successfully",
        data: variant,
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete variant
  deleteVariant: async (req, res, next) => {
    try {
      const { variantId } = req.params;
      const result = await productVariantService.deleteVariant(variantId);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  // Get variant by SKU
  getBySku: async (req, res, next) => {
    try {
      const { sku } = req.params;
      const variant = await productVariantService.getVariantBySku(sku);

      if (!variant) {
        return res.status(404).json({
          success: false,
          message: "Variant not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Variant retrieved successfully",
        data: variant,
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = productVariantController;
