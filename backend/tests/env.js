process.env.NODE_ENV = "test";
// Tests call job handlers directly — no need to actually drain a queue.
process.env.JOBS_DISABLED = "1";
