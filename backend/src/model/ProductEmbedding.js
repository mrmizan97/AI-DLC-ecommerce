// One row per product per embedding model.
// Stored as JSON so we don't need pgvector — works on plain MySQL 8.
// For >10k products, migrate to a real vector store.

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ProductEmbedding = sequelize.define(
  "ProductEmbedding",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    model: {
      type: DataTypes.STRING(64),
      allowNull: false,
    },
    dims: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    vector: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    source_hash: {
      // Hash of (name + description + brand). Lets the job skip work if the
      // source text hasn't changed since the last embed.
      type: DataTypes.STRING(64),
      allowNull: false,
    },
  },
  {
    tableName: "product_embeddings",
    timestamps: true,
    underscored: true,
    indexes: [
      { unique: true, fields: ["product_id", "model"], name: "product_embeddings_product_model_uniq" },
    ],
  }
);

module.exports = ProductEmbedding;
