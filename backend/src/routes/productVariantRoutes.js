const express = require("express");
const router = express.Router();
const productVariantController = require("../controller/productVariantController");
const { authenticate, authorizeRoles } = require("../middleware/auth");

// All routes require authentication
router.use(authenticate);

// Public can view variants
router.get("/product/:productId", productVariantController.getProductVariants);
router.get(
  "/product/:productId/grouped",
  productVariantController.getGroupedVariants
);
router.get("/sku/:sku", productVariantController.getBySku);
router.get("/:variantId", productVariantController.getVariant);

// Admin and Vendor can create/update/delete
router.post(
  "/product/:productId",
  authorizeRoles("admin", "vendor"),
  productVariantController.createVariant
);
router.post(
  "/product/:productId/bulk",
  authorizeRoles("admin", "vendor"),
  productVariantController.bulkCreateVariants
);
router.put(
  "/:variantId",
  authorizeRoles("admin", "vendor"),
  productVariantController.updateVariant
);
router.delete(
  "/:variantId",
  authorizeRoles("admin", "vendor"),
  productVariantController.deleteVariant
);

module.exports = router;
