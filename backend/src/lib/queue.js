// BullMQ queue setup.
//
// One queue holds all background jobs (emails, imports, scheduled ticks).
// One worker process drains them. This file exposes:
//   - jobsQueue: enqueue jobs (used by other services)
//   - jobsScheduler-like API for repeatable jobs (cron)
//   - jobsConnection: shared ioredis options for the Worker
//
// The shape mirrors what we built in llm-api-nodejs so the team has one
// mental model for "background work".

const { Queue } = require("bullmq");

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

function parseUrl(url) {
  try {
    const u = new URL(url);
    return {
      host: u.hostname || "localhost",
      port: Number(u.port) || 6379,
      password: u.password || undefined,
    };
  } catch {
    return { host: "localhost", port: 6379 };
  }
}

// BullMQ requires maxRetriesPerRequest: null so blocking commands (BRPOPLPUSH)
// can wait forever instead of being cancelled by the client's retry policy.
const jobsConnection = {
  ...parseUrl(REDIS_URL),
  maxRetriesPerRequest: null,
};

const QUEUE_NAME = "ai-dlc-jobs";

const jobsQueue = new Queue(QUEUE_NAME, { connection: jobsConnection });

const DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: { type: "exponential", delay: 2000 },
  removeOnComplete: { age: 60 * 60 * 24, count: 1000 },     // 24h or 1k
  removeOnFail: { age: 60 * 60 * 24 * 7 },                  // 7d
};

async function enqueue(name, data = {}, opts = {}) {
  return jobsQueue.add(name, data, { ...DEFAULT_JOB_OPTIONS, ...opts });
}

module.exports = {
  QUEUE_NAME,
  jobsQueue,
  jobsConnection,
  enqueue,
  DEFAULT_JOB_OPTIONS,
};
