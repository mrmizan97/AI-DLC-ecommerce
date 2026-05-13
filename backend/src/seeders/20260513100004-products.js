"use strict";

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    const [categories] = await queryInterface.sequelize.query(
      "SELECT id, name FROM categories WHERE name IN ('Electronics','Fashion','Home & Kitchen','Books','Sports & Outdoors')"
    );
    const idOf = (name) => categories.find((c) => c.name === name)?.id;

    const img = (q) =>
      `https://source.unsplash.com/600x600/?${encodeURIComponent(q)}`;

    await queryInterface.bulkInsert("products", [
      // Electronics
      { name: "Wireless Bluetooth Headphones", description: "Over-ear, 30-hour battery, active noise cancellation.", price: 2499.00, stock: 25, category_id: idOf("Electronics"), brand: "SoundMax", sku: "ELEC-WBH-001", image_url: img("headphones"), status: "active", created_at: now, updated_at: now },
      { name: "Smartphone Pro 12",             description: "6.5-inch display, 128GB storage, dual SIM, 5000mAh battery.", price: 28999.00, stock: 12, category_id: idOf("Electronics"), brand: "NovaTech",  sku: "ELEC-SPP-012", image_url: img("smartphone"), status: "active", created_at: now, updated_at: now },
      { name: "Wireless Gaming Mouse",         description: "Ergonomic, 16000 DPI, RGB lighting, 70-hour battery.", price: 1499.00, stock: 40, category_id: idOf("Electronics"), brand: "ClickPro",  sku: "ELEC-WGM-003", image_url: img("mouse"), status: "active", created_at: now, updated_at: now },

      // Fashion
      { name: "Classic Denim Jacket",          description: "100% cotton, mid-blue wash, regular fit.", price: 1899.00, stock: 30, category_id: idOf("Fashion"), brand: "UrbanWear", sku: "FASH-CDJ-001", image_url: img("denim,jacket"), status: "active", created_at: now, updated_at: now },
      { name: "Running Shoes Aero",            description: "Lightweight mesh, cushioned sole, available in 5 sizes.", price: 3499.00, stock: 22, category_id: idOf("Fashion"), brand: "StrideOn",  sku: "FASH-RSA-002", image_url: img("running,shoes"), status: "active", created_at: now, updated_at: now },
      { name: "Leather Wallet Slim",           description: "Genuine leather, 8 card slots, RFID-blocking.", price: 999.00, stock: 50, category_id: idOf("Fashion"), brand: "Hidalgo",   sku: "FASH-LWS-003", image_url: img("leather,wallet"), status: "active", created_at: now, updated_at: now },

      // Home & Kitchen
      { name: "Stainless Steel Cookware Set",  description: "10-piece set, induction-safe, with glass lids.", price: 5499.00, stock: 15, category_id: idOf("Home & Kitchen"), brand: "ChefMate", sku: "HOME-SCS-001", image_url: img("cookware,set"), status: "active", created_at: now, updated_at: now },
      { name: "Espresso Coffee Maker",         description: "15-bar pump, milk frother, 1.5L removable tank.", price: 7299.00, stock: 8,  category_id: idOf("Home & Kitchen"), brand: "BrewLab", sku: "HOME-ECM-002", image_url: img("espresso,machine"), status: "active", created_at: now, updated_at: now },

      // Books
      { name: "The Pragmatic Programmer",      description: "Your Journey to Mastery — 20th Anniversary Edition.", price: 1299.00, stock: 35, category_id: idOf("Books"), brand: "Addison-Wesley", sku: "BOOK-TPP-001", image_url: img("book,programming"), status: "active", created_at: now, updated_at: now },
      { name: "Designing Data-Intensive Apps", description: "The big ideas behind reliable, scalable software systems.", price: 1599.00, stock: 28, category_id: idOf("Books"), brand: "O'Reilly",        sku: "BOOK-DDIA-002", image_url: img("book,system,design"), status: "active", created_at: now, updated_at: now },

      // Sports
      { name: "Yoga Mat Pro Grip",             description: "6mm thick, non-slip, eco-friendly TPE.", price: 1199.00, stock: 60, category_id: idOf("Sports & Outdoors"), brand: "FlexFit",   sku: "SPRT-YMP-001", image_url: img("yoga,mat"), status: "active", created_at: now, updated_at: now },
      { name: "Adjustable Dumbbell 20kg",      description: "Quick-lock plates, knurled grip, sold as a pair.", price: 4999.00, stock: 18, category_id: idOf("Sports & Outdoors"), brand: "IronCore",  sku: "SPRT-ADB-002", image_url: img("dumbbell"), status: "active", created_at: now, updated_at: now },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("products", {
      sku: [
        "ELEC-WBH-001","ELEC-SPP-012","ELEC-WGM-003",
        "FASH-CDJ-001","FASH-RSA-002","FASH-LWS-003",
        "HOME-SCS-001","HOME-ECM-002",
        "BOOK-TPP-001","BOOK-DDIA-002",
        "SPRT-YMP-001","SPRT-ADB-002",
      ],
    });
  },
};
