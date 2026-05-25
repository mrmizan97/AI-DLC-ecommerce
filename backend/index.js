require("dotenv").config();

const http = require("http");
const app = require("./src/app");
const { sequelize } = require("./src/model");
const { initSocket } = require("./src/socket");
const { startWorker } = require("./src/lib/worker");
const { registerScheduledJobs } = require("./src/lib/scheduler");

const PORT = process.env.PORT || 3000;

const httpServer = http.createServer(app);
initSocket(httpServer);

sequelize
  .authenticate()
  .then(async () => {
    console.log("Database connected successfully");

    // Boot background jobs unless explicitly disabled (set JOBS_DISABLED=1
    // when running workers as a separate process).
    if (process.env.JOBS_DISABLED !== "1") {
      try {
        startWorker();
        const schedules = await registerScheduledJobs();
        console.log(`[jobs] registered ${schedules.length} scheduled jobs`);
      } catch (err) {
        // Don't crash the API if Redis is briefly unreachable — surface and
        // let the worker reconnect / be retried.
        console.error("[jobs] startup failed:", err.message);
      }
    }

    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT} (HTTP + WebSocket)`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect database:", err.message);
  });
