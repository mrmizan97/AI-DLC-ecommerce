// /api/jobs — admin endpoints to inspect & trigger background jobs.
//
//   GET  /api/jobs/schedules           list cron schedules
//   POST /api/jobs/run/:name           enqueue one job immediately (ad-hoc)
//   GET  /api/jobs/:id                 job status
//   GET  /api/jobs                     recent jobs across states
//
// Admin-only.

const express = require("express");
const { jobsQueue, enqueue } = require("../lib/queue");
const { listSchedules, registerScheduledJobs } = require("../lib/scheduler");
const { handlers } = require("../lib/jobs");
const { authenticate, authorizeAdmin } = require("../middleware/auth");

const router = express.Router();

router.use(authenticate, authorizeAdmin);

router.get("/schedules", async (_req, res) => {
  res.json(await listSchedules());
});

router.post("/schedules/register", async (_req, res) => {
  // Idempotent — repeatable jobs use a stable jobId so re-registering is safe.
  res.json(await registerScheduledJobs());
});

router.post("/run/:name", async (req, res) => {
  const { name } = req.params;
  if (!handlers[name]) return res.status(400).json({ error: `unknown job: ${name}` });
  const job = await enqueue(name, req.body || {});
  res.status(202).json({ jobId: String(job.id), name });
});

router.get("/:id", async (req, res) => {
  const job = await jobsQueue.getJob(req.params.id);
  if (!job) return res.status(404).json({ error: "job not found" });
  const state = await job.getState();
  res.json({
    jobId: String(job.id),
    name: job.name,
    state,
    progress: job.progress,
    attemptsMade: job.attemptsMade,
    returnvalue: state === "completed" ? job.returnvalue : undefined,
    failedReason: state === "failed" ? job.failedReason : undefined,
    createdAt: new Date(job.timestamp).toISOString(),
    finishedAt: job.finishedOn ? new Date(job.finishedOn).toISOString() : null,
  });
});

router.get("/", async (_req, res) => {
  const [waiting, active, completed, failed] = await Promise.all([
    jobsQueue.getJobs(["waiting"], 0, 20),
    jobsQueue.getJobs(["active"], 0, 20),
    jobsQueue.getJobs(["completed"], 0, 20),
    jobsQueue.getJobs(["failed"], 0, 20),
  ]);
  const sum = (j) => ({ jobId: String(j.id), name: j.name, attemptsMade: j.attemptsMade, createdAt: new Date(j.timestamp).toISOString() });
  res.json({
    waiting: waiting.map(sum),
    active: active.map(sum),
    completed: completed.map(sum),
    failed: failed.map((j) => ({ ...sum(j), failedReason: j.failedReason })),
  });
});

module.exports = router;
