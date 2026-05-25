// BullMQ worker. Drains the `ai-dlc-jobs` queue and dispatches each job
// to the handler registered in lib/jobs/index.js.
//
// startWorker() returns the Worker instance so the caller can close it
// on shutdown. JOBS_DISABLED=1 disables in-process workers (use when
// running workers as a separate `npm run worker` process).

const { Worker, UnrecoverableError } = require("bullmq");
const { QUEUE_NAME, jobsConnection } = require("./queue");
const { handlers } = require("./jobs");

const TRANSIENT = ["ETIMEDOUT", "ECONNRESET", "fetch failed", "rate limit", "429", "503"];

function isTransient(err) {
  const m = (err && err.message) || "";
  return TRANSIENT.some((h) => m.toLowerCase().includes(h.toLowerCase()));
}

function startWorker() {
  if (process.env.JOBS_DISABLED === "1") {
    console.log("[jobs] worker disabled (JOBS_DISABLED=1)");
    return null;
  }

  const worker = new Worker(
    QUEUE_NAME,
    async (job) => {
      const handler = handlers[job.name];
      if (!handler) throw new UnrecoverableError(`unknown job: ${job.name}`);
      try {
        return await handler(job.data);
      } catch (err) {
        if (!isTransient(err)) throw new UnrecoverableError(err.message);
        throw err;
      }
    },
    { connection: jobsConnection, concurrency: 4 }
  );

  worker.on("completed", (job, result) => {
    console.log(`[jobs] done ${job.name} ${job.id}:`, summarize(result));
  });
  worker.on("failed", (job, err) => {
    console.error(`[jobs] failed ${job?.name} ${job?.id}: ${err.message}`);
  });
  worker.on("error", (err) => console.error("[jobs] worker error:", err.message));

  console.log("[jobs] worker started, concurrency=4");
  return worker;
}

function summarize(result) {
  if (!result || typeof result !== "object") return result;
  // Keep log line short; full result is in job.returnvalue for inspection.
  return JSON.stringify(result).slice(0, 160);
}

module.exports = { startWorker };
