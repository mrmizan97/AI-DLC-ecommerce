const express = require("express");
const router = express.Router();
const productVariantController = require("../controller/productVariantController");
const { authenticate, authorizeRoles } = require("../middleware/auth");

// Public can view variants — anonymous shoppers need this to render product pages.
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
  authenticate,
  authorizeRoles("admin"),
  productVariantController.createVariant
);
router.post(
  "/product/:productId/bulk",
  authenticate,
  authorizeRoles("admin"),
  productVariantController.bulkCreateVariants
);
router.put(
  "/:variantId",
  authenticate,
  authorizeRoles("admin"),
  productVariantController.updateVariant
);
router.delete(
  "/:variantId",
  authenticate,
  authorizeRoles("admin"),
  productVariantController.deleteVariant
);

module.exports = router;
