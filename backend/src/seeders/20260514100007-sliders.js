"use strict";

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert("sliders", [
      {
        title: "Mega Sale is Live!",
        subtitle: "Up to 70% off on top brands",
        image_url: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1600&h=600&fit=crop",
        cta_text: "Shop Now",
        cta_link: "/products",
        sort_order: 1,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        title: "Flash Deals Every Hour",
        subtitle: "Catch them before they're gone",
        image_url: "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=1600&h=600&fit=crop",
        cta_text: "See Flash Sales",
        cta_link: "/flash-sales",
        sort_order: 2,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        title: "New Arrivals in Electronics",
        subtitle: "Headphones, phones, accessories — handpicked",
        image_url: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=1600&h=600&fit=crop",
        cta_text: "Shop Electronics",
        cta_link: "/products?category_id=1",
        sort_order: 3,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("sliders", null, {});
  },
};
