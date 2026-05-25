// Standalone static-verification harness — does NOT need MySQL or Redis.
// Loads every module under test, exercises pure utilities, validates cron
// strings, and parses every job-test file as JS. Prints a single summary.

const fs = require("fs");
const path = require("path");
const Module = require("module");

const PASS = [];
const FAIL = [];

async function step(label, fn) {
  try {
    let out = fn();
    if (out && typeof out.then === "function") out = await out;
    PASS.push(label + (out ? " — " + out : ""));
  } catch (e) {
    FAIL.push(label + " :: " + e.message);
  }
}

// ---------------- Module loads ---------------------------------------------

step("lib/ai/anthropic loads", () => {
  const m = require("../src/lib/ai/anthropic");
  if (typeof m.complete !== "function") throw new Error("complete not exported");
  return "complete(), client(), DEFAULT_MODEL=" + m.DEFAULT_MODEL;
});

step("lib/ai/embeddings loads + has fallback", async () => {
  const m = require("../src/lib/ai/embeddings");
  if (typeof m.embed !== "function") throw new Error("embed not exported");
});

step("lib/ai/cosine loads", () => {
  const m = require("../src/lib/ai/cosine");
  if (typeof m.cosine !== "function") throw new Error("cosine missing");
  if (typeof m.topK !== "function") throw new Error("topK missing");
});

step("lib/queue loads (BullMQ connection ready)", () => {
  const m = require("../src/lib/queue");
  if (!m.jobsQueue) throw new Error("jobsQueue missing");
  if (typeof m.enqueue !== "function") throw new Error("enqueue missing");
  if (m.jobsConnection.maxRetriesPerRequest !== null) throw new Error("connection missing maxRetriesPerRequest:null");
  return "queue=" + m.QUEUE_NAME + ", connection=" + m.jobsConnection.host + ":" + m.jobsConnection.port;
});

step("lib/scheduler loads with 11 schedules", () => {
  const m = require("../src/lib/scheduler");
  if (!Array.isArray(m.SCHEDULES)) throw new Error("SCHEDULES not array");
  if (m.SCHEDULES.length !== 11) throw new Error("expected 11 schedules, got " + m.SCHEDULES.length);
  return m.SCHEDULES.length + " schedules";
});

step("lib/worker loads", () => {
  const m = require("../src/lib/worker");
  if (typeof m.startWorker !== "function") throw new Error("startWorker missing");
});

step("lib/jobs registers 14 handlers", () => {
  const m = require("../src/lib/jobs");
  const keys = Object.keys(m.handlers);
  const expected = [
    "flash-sale-tick","stale-order-sweep","coupon-expiry","daily-sales-report",
    "low-stock-digest","review-request","activity-log-retention","wishlist-back-in-stock",
    "orphan-media-cleanup","abandoned-cart-reminder","failed-payment-retry",
    "embed-products","ai-product-enrichment","ai-review-summary",
  ];
  for (const n of expected) if (!keys.includes(n)) throw new Error("missing handler: " + n);
  if (keys.length !== 14) throw new Error("expected 14 handlers, got " + keys.length);
  return keys.length + " handlers";
});

step("model/ProductEmbedding loads", () => {
  const M = require("../src/model/ProductEmbedding");
  if (!M.rawAttributes.vector) throw new Error("vector column missing");
});
step("model/ProductEnrichment loads", () => {
  const M = require("../src/model/ProductEnrichment");
  if (!M.rawAttributes.source_hash) throw new Error("source_hash column missing");
});
step("model/ReviewSummary loads", () => {
  const M = require("../src/model/ReviewSummary");
  if (!M.rawAttributes.loves) throw new Error("loves column missing");
});
step("model/index exports new models", () => {
  const m = require("../src/model");
  for (const n of ["ProductEmbedding", "ProductEnrichment", "ReviewSummary"]) {
    if (!m[n]) throw new Error("missing export: " + n);
  }
});

step("routes/jobsRoutes loads", () => { require("../src/routes/jobsRoutes"); });
step("routes/aiTierTwoRoutes loads", () => { require("../src/routes/aiTierTwoRoutes"); });
step("app.js mounts /api/jobs + /api/ai-tier2", () => {
  // Express 5 doesn't expose _router.stack the way 4 did. Inspect the
  // source instead — cheap, no runtime traversal.
  const src = fs.readFileSync(path.join(__dirname, "..", "src", "app.js"), "utf8");
  if (!/app\.use\(\s*["']\/api\/jobs["']/.test(src)) throw new Error("/api/jobs use() not found");
  if (!/app\.use\(\s*["']\/api\/ai-tier2["']/.test(src)) throw new Error("/api/ai-tier2 use() not found");
  return "/api/jobs + /api/ai-tier2 mounted";
});

// ---------------- Pure utility behaviour -----------------------------------

step("cosine(self) === 1 for normalised vectors", () => {
  const { cosine } = require("../src/lib/ai/cosine");
  const v = [0.6, 0.8]; // L2 norm = 1
  if (Math.abs(cosine(v, v) - 1) > 1e-9) throw new Error("got " + cosine(v, v));
});

step("cosine(orthogonal) === 0", () => {
  const { cosine } = require("../src/lib/ai/cosine");
  if (Math.abs(cosine([1, 0], [0, 1])) > 1e-9) throw new Error("not orthogonal");
});

step("topK returns sorted top-k", () => {
  const { topK } = require("../src/lib/ai/cosine");
  const items = [
    { id: "a", vector: [1, 0] },
    { id: "b", vector: [0.7, 0.7] },
    { id: "c", vector: [0, 1] },
  ];
  const out = topK([1, 0], items, 2);
  if (out[0].id !== "a") throw new Error("expected a first, got " + out[0].id);
  if (out.length !== 2) throw new Error("expected length 2");
});

step("embed(): deterministic fallback produces stable normalised vector", async () => {
  delete process.env.VOYAGE_API_KEY;
  const { embed } = require("../src/lib/ai/embeddings");
  const r1 = await embed("hello wireless mouse");
  const r2 = await embed("hello wireless mouse");
  if (r1.vector.length !== r2.vector.length) throw new Error("dim mismatch");
  for (let i = 0; i < r1.vector.length; i++) {
    if (Math.abs(r1.vector[i] - r2.vector[i]) > 1e-12) throw new Error("non-deterministic at " + i);
  }
  // L2 norm should be ≈ 1
  let sq = 0; for (const x of r1.vector) sq += x * x;
  if (Math.abs(Math.sqrt(sq) - 1) > 1e-6) throw new Error("not normalised, norm=" + Math.sqrt(sq));
  return "dims=" + r1.dims + ", model=" + r1.model;
});

step("embed(): different inputs give different vectors", async () => {
  const { embed } = require("../src/lib/ai/embeddings");
  const a = (await embed("wireless mouse logitech")).vector;
  const b = (await embed("kitchen blender stainless")).vector;
  let same = true;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) { same = false; break; }
  if (same) throw new Error("different inputs produced identical vectors");
});

step("embedProducts: sourceText + hash are deterministic", () => {
  const { sourceText, hash } = require("../src/lib/jobs/embedProducts");
  const p = { name: "x", brand: "y", description: "z", category: { name: "c" } };
  const h1 = hash(sourceText(p));
  const h2 = hash(sourceText({ ...p }));
  if (h1 !== h2) throw new Error("hash not stable: " + h1 + " vs " + h2);
  if (h1.length !== 32) throw new Error("hash length wrong: " + h1.length);
});

// ---------------- Cron string validation -----------------------------------

step("all schedule cron strings are valid 5-field expressions", () => {
  const { SCHEDULES } = require("../src/lib/scheduler");
  const re = /^(\S+\s+){4}\S+$/;
  const bad = [];
  for (const s of SCHEDULES) {
    if (!re.test(s.cron)) bad.push(s.name + " :: '" + s.cron + "'");
  }
  if (bad.length) throw new Error("invalid: " + bad.join(", "));
  return SCHEDULES.length + " cron strings";
});

// ---------------- Test-file syntax check -----------------------------------

step("every tests/jobs/*.test.js parses as JavaScript", () => {
  const dir = path.join(__dirname, "jobs");
  if (!fs.existsSync(dir)) throw new Error("tests/jobs not found");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".test.js"));
  if (files.length === 0) throw new Error("no test files in tests/jobs");
  const bad = [];
  for (const f of files) {
    try {
      // Use Module._compile to parse without executing top-level side effects
      // that require Sequelize / DB. Just compile, don't run.
      const src = fs.readFileSync(path.join(dir, f), "utf8");
      new Function("module", "exports", "require", src); // throws on parse error
    } catch (e) {
      bad.push(f + " :: " + e.message);
    }
  }
  if (bad.length) throw new Error("\n  - " + bad.join("\n  - "));
  return files.length + " test files parsed cleanly";
});

// ---------------- Done -----------------------------------------------------

setTimeout(() => {
  console.log("\n=== PASS (" + PASS.length + ") ===");
  for (const l of PASS) console.log("  + " + l);
  if (FAIL.length) {
    console.log("\n=== FAIL (" + FAIL.length + ") ===");
    for (const l of FAIL) console.log("  X " + l);
    process.exit(1);
  } else {
    console.log("\nAll static checks passed.");
    process.exit(0);
  }
}, 250);
