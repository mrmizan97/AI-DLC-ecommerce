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

// Admin can create/update/delete
router.post(
  "/product/:productId",
  authorizeRoles("admin"),
  productVariantController.createVariant
);
router.post(
  "/product/:productId/bulk",
  authorizeRoles("admin"),
  productVariantController.bulkCreateVariants
);
router.put(
  "/:variantId",
  authorizeRoles("admin"),
  productVariantController.updateVariant
);
router.delete(
  "/:variantId",
  authorizeRoles("admin"),
  productVariantController.deleteVariant
);

module.exports = router;
