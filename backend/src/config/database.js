const { Sequelize } = require("sequelize");

const useSsl = String(process.env.DB_SSL || "").toLowerCase() === "true";

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "mysql",
    logging: false,
    dialectOptions: useSsl
      ? { ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true } }
      : {},
  }
);

module.exports = sequelize;
