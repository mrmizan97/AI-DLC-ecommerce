// Cached LLM-generated enrichment per product: SEO description, meta keywords,
// alt text, smart tags. Re-generate only when the source fields change.

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ProductEnrichment = sequelize.define(
  "ProductEnrichment",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    product_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    seo_description: { type: DataTypes.TEXT, allowNull: true },
    meta_keywords: { type: DataTypes.JSON, allowNull: true },   // string[]
    alt_text: { type: DataTypes.STRING(255), allowNull: true },
    smart_tags: { type: DataTypes.JSON, allowNull: true },      // string[]
    source_hash: { type: DataTypes.STRING(64), allowNull: false },
    model: { type: DataTypes.STRING(64), allowNull: false },
    tokens_used: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  {
    tableName: "product_enrichments",
    timestamps: true,
    underscored: true,
  }
);

module.exports = ProductEnrichment;
