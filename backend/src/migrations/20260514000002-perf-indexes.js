"use strict";

module.exports = {
  async up(queryInterface) {
    await queryInterface.addIndex("flash_sales", ["is_active", "start_time", "end_time"], {
      name: "idx_flash_sales_active_window",
    });
    await queryInterface.addIndex("products", ["status", "created_at"], {
      name: "idx_products_status_created_at",
    });
    await queryInterface.addIndex("products", ["name", "status"], {
      name: "idx_products_name_status",
    });
    await queryInterface.addIndex("products", ["brand", "status"], {
      name: "idx_products_brand_status",
    });
    await queryInterface.addIndex("products", ["sku", "status"], {
      name: "idx_products_sku_status",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("flash_sales", "idx_flash_sales_active_window");
    await queryInterface.removeIndex("products", "idx_products_status_created_at");
    await queryInterface.removeIndex("products", "idx_products_name_status");
    await queryInterface.removeIndex("products", "idx_products_brand_status");
    await queryInterface.removeIndex("products", "idx_products_sku_status");
  },
};
