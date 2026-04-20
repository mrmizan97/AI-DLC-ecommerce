require("dotenv").config();

const http = require("http");
const app = require("./src/app");
const { sequelize } = require("./src/model");
const { initSocket } = require("./src/socket");

const PORT = process.env.PORT || 3000;

const httpServer = http.createServer(app);
initSocket(httpServer);

sequelize
  .authenticate()
  .then(() => {
    console.log("Database connected successfully");
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT} (HTTP + WebSocket)`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect database:", err.message);
  });
