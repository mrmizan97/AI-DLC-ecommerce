// Per-product rolling summary of recent reviews, produced by the
// map-reduce review-summary job. We keep one row per product per window
// (default window = last 30 days). The job overwrites this row each run.

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ReviewSummary = sequelize.define(
  "ReviewSummary",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    product_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    window_days: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 30 },
    review_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    avg_rating: { type: DataTypes.DECIMAL(3, 2), allowNull: true },
    loves: { type: DataTypes.JSON, allowNull: true },      // string[]: "what people love"
    complaints: { type: DataTypes.JSON, allowNull: true }, // string[]: "what people complain about"
    summary: { type: DataTypes.TEXT, allowNull: true },    // one-paragraph synthesis
    tokens_used: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    model: { type: DataTypes.STRING(64), allowNull: false },
  },
  {
    tableName: "review_summaries",
    timestamps: true,
    underscored: true,
  }
);

module.exports = ReviewSummary;
