const { Product, ProductVariant } = require("../model");

class ProductVariantService {
  // Get all variants for a product
  async getProductVariants(productId) {
    const product = await Product.findByPk(productId);

    if (!product) {
      throw new Error("Product not found");
    }

    return await ProductVariant.findAll({
      where: { product_id: productId },
      order: [["name", "ASC"], ["value", "ASC"]],
    });
  }

  // Get single variant
  async getVariant(variantId) {
    const variant = await ProductVariant.findByPk(variantId, {
      include: {
        model: Product,
        as: "product",
        attributes: ["id", "name", "price", "sku"],
      },
    });

    if (!variant) {
      throw new Error("Variant not found");
    }

    return variant;
  }

  // Create variant
  async createVariant(productId, data) {
    const product = await Product.findByPk(productId);

    if (!product) {
      throw new Error("Product not found");
    }

    // Check if variant with same name/value exists
    const existing = await ProductVariant.findOne({
      where: {
        product_id: productId,
        name: data.name,
        value: data.value,
      },
    });

    if (existing) {
      throw new Error("Variant with this name and value already exists");
    }

    const variant = await ProductVariant.create({
      product_id: productId,
      name: data.name,
      value: data.value,
      price_adjustment: data.price_adjustment || 0,
      stock: data.stock || 0,
      sku: data.sku,
      image_url: data.image_url,
    });

    return variant;
  }

  // Update variant
  async updateVariant(variantId, data) {
    const variant = await ProductVariant.findByPk(variantId);

    if (!variant) {
      throw new Error("Variant not found");
    }

    const allowedFields = [
      "name",
      "value",
      "price_adjustment",
      "stock",
      "sku",
      "image_url",
    ];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        variant[field] = data[field];
      }
    }

    await variant.save();
    return variant;
  }

  // Delete variant
  async deleteVariant(variantId) {
    const variant = await ProductVariant.findByPk(variantId);

    if (!variant) {
      throw new Error("Variant not found");
    }

    await variant.destroy();
    return { success: true, message: "Variant deleted successfully" };
  }

  // Bulk create variants
  async bulkCreateVariants(productId, variants) {
    const product = await Product.findByPk(productId);

    if (!product) {
      throw new Error("Product not found");
    }

    const createdVariants = [];

    for (const variantData of variants) {
      try {
        const variant = await this.createVariant(productId, variantData);
        createdVariants.push(variant);
      } catch (error) {
        // Skip duplicates, continue with others
        console.error(`Failed to create variant: ${error.message}`);
      }
    }

    return createdVariants;
  }

  // Get variant by SKU
  async getVariantBySku(sku) {
    const variant = await ProductVariant.findOne({
      where: { sku },
      include: {
        model: Product,
        as: "product",
      },
    });

    return variant;
  }

  // Update variant stock
  async updateVariantStock(variantId, quantityChange) {
    const variant = await ProductVariant.findByPk(variantId);

    if (!variant) {
      throw new Error("Variant not found");
    }

    const newStock = variant.stock + quantityChange;

    if (newStock < 0) {
      throw new Error("Insufficient stock");
    }

    await variant.update({ stock: newStock });
    return variant;
  }

  // Get variants grouped by name
  async getGroupedVariants(productId) {
    const variants = await ProductVariant.findAll({
      where: { product_id: productId },
      order: [["name", "ASC"], ["value", "ASC"]],
    });

    const grouped = {};

    for (const variant of variants) {
      if (!grouped[variant.name]) {
        grouped[variant.name] = [];
      }
      grouped[variant.name].push({
        id: variant.id,
        value: variant.value,
        price_adjustment: variant.price_adjustment,
        stock: variant.stock,
        sku: variant.sku,
        image_url: variant.image_url,
      });
    }

    return grouped;
  }
}

module.exports = new ProductVariantService();
