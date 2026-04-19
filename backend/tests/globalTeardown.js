require("dotenv").config();

const fs = require("fs");
const path = require("path");

module.exports = async () => {
  // Clean up shared data file
  const filePath = path.join(__dirname, "shared-data.json");
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};
