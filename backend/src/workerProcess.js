// Standalone worker entry. Run via `npm run worker` in prod when you want
// workers in their own process (kill / scale independently of the API).

require("dotenv").config();
const { sequelize } = require("./model");
const { startWorker } = require("./lib/worker");

async function main() {
  await sequelize.authenticate();
  const w = startWorker();
  if (!w) process.exit(0);
  for (const sig of ["SIGINT", "SIGTERM"]) {
    process.on(sig, async () => {
      console.log(`[worker] ${sig} draining...`);
      await w.close();
      process.exit(0);
    });
  }
}

main().catch((err) => {
  console.error("[worker] failed to start:", err);
  process.exit(1);
});
