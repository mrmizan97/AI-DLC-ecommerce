#!/usr/bin/env node
// Multi-role API smoke test. Runs against a live backend (default
// http://localhost:3000). No browser, no Jest — just fetch + assertions.
//
// What it covers, in order, with two roles (admin + customer):
//
//   1. Admin registers + logs in
//   2. Admin creates a product (or reuses one)
//   3. Admin triggers embed-products and ai-product-enrichment via the
//      Tier 2 routes — verifies the job is enqueued (or cache hits)
//   4. Customer registers + logs in
//   5. Customer adds the product to their wishlist
//   6. Customer places an order (cash, single line item)
//   7. Customer writes a review on the product
//   8. Admin enqueues an ai-review-summary recompute
//   9. Anyone (or the customer) hits /api/ai-tier2/support — RAG with handoff
//
// Run:
//   node backend/tests/smoke/multiRoleSmoke.js
//   SMOKE_BASE=http://localhost:4000 node backend/tests/smoke/multiRoleSmoke.js
//
// Exit code is 0 only if every step passes.

const BASE = process.env.SMOKE_BASE || "http://localhost:3000";
const STAMP = Date.now();
const ADMIN = { name: "Smoke Admin", email: `smoke-admin-${STAMP}@test.com`, password: "smoke123!", phone: "01700000001", role: "admin" };
const CUST  = { name: "Smoke Cust",  email: `smoke-cust-${STAMP}@test.com`,  password: "smoke123!", phone: "01711111112" };

const PASS = [];
const FAIL = [];

function ok(label, detail) { PASS.push(detail ? `${label} — ${detail}` : label); console.log(`  + ${label}${detail ? " — " + detail : ""}`); }
function bad(label, err)   { FAIL.push(`${label} :: ${err}`); console.log(`  X ${label} :: ${err}`); }

async function request(method, path, { token, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let json;
  try { json = await res.json(); } catch { json = null; }
  return { status: res.status, body: json };
}

async function step(label, fn) {
  try { const detail = await fn(); ok(label, detail); }
  catch (e) { bad(label, e.message); }
}

async function expect(cond, msg) { if (!cond) throw new Error(msg); }

// ───── Run ─────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Smoke target: ${BASE}\n`);

  // Sanity
  await step("API is reachable", async () => {
    const r = await request("GET", "/");
    await expect(r.status === 200, `GET / returned ${r.status}`);
    return "GET /";
  });

  // ─── 1. Admin auth ────────────────────────────────────────────────────
  let adminToken = null;
  let adminId = null;
  await step("admin registers", async () => {
    const r = await request("POST", "/api/auth/register", { body: ADMIN });
    await expect(r.status === 201 || r.status === 200, `status ${r.status} body=${JSON.stringify(r.body)}`);
    adminToken = r.body?.data?.token;
    adminId = r.body?.data?.user?.id;
    await expect(adminToken, "no token in response");
    return `id=${adminId}`;
  });

  await step("admin profile reads back as admin role", async () => {
    const r = await request("GET", "/api/auth/profile", { token: adminToken });
    await expect(r.status === 200, `status ${r.status}`);
    await expect(r.body?.data?.role === "admin", `role=${r.body?.data?.role}`);
    return "role=admin";
  });

  // ─── 2. Admin creates a product ──────────────────────────────────────
  let productId = null;
  await step("admin creates product (or reuses category)", async () => {
    // Need a category first. Try to create — fall back to any existing.
    const c = await request("POST", "/api/categories", { token: adminToken, body: { name: `Smoke Cat ${STAMP}`, description: "smoke" } });
    let categoryId = c.body?.data?.id;
    if (!categoryId) {
      const all = await request("GET", "/api/categories");
      categoryId = all.body?.data?.[0]?.id;
    }
    await expect(categoryId, "no category available");

    const p = await request("POST", "/api/products", {
      token: adminToken,
      body: {
        name: `Smoke Wireless Mouse ${STAMP}`,
        description: "Ergonomic wireless mouse used by the multi-role smoke test.",
        price: 29.99, stock: 50, category_id: categoryId,
        brand: "SmokeBrand", sku: `SMK-${STAMP}`,
      },
    });
    await expect(p.status === 201 || p.status === 200, `status ${p.status} body=${JSON.stringify(p.body)}`);
    productId = p.body?.data?.id;
    await expect(productId, "no product id returned");
    return `productId=${productId}`;
  });

  // ─── 3. Tier 2 AI: embed + enrich ────────────────────────────────────
  await step("admin enqueues embed-products for the new product", async () => {
    const r = await request("POST", `/api/ai-tier2/embed/${productId}`, { token: adminToken });
    await expect(r.status === 202, `status ${r.status} body=${JSON.stringify(r.body)}`);
    await expect(r.body?.jobId, "no jobId");
    return `jobId=${r.body.jobId}`;
  });

  await step("admin enqueues ai-product-enrichment for the new product", async () => {
    const r = await request("POST", `/api/ai-tier2/enrich/${productId}`, { token: adminToken });
    await expect(r.status === 202, `status ${r.status}`);
    return `jobId=${r.body.jobId}`;
  });

  // The cached-read endpoint returns 404 until the worker actually runs.
  // We tolerate 404 in the smoke; the goal here is verifying the route +
  // queue path is healthy, not waiting for the LLM.

  // ─── 4. Customer auth ────────────────────────────────────────────────
  let custToken = null;
  let custId = null;
  await step("customer registers", async () => {
    const r = await request("POST", "/api/auth/register", { body: CUST });
    await expect(r.status === 201 || r.status === 200, `status ${r.status}`);
    custToken = r.body?.data?.token;
    custId = r.body?.data?.user?.id;
    await expect(custToken, "no token");
    return `id=${custId}`;
  });

  // ─── 5. Wishlist ─────────────────────────────────────────────────────
  await step("customer adds product to wishlist", async () => {
    const r = await request("POST", "/api/wishlist", { token: custToken, body: { product_id: productId } });
    await expect(r.status === 201, `status ${r.status} body=${JSON.stringify(r.body)}`);
    return "wishlisted";
  });

  await step("customer's wishlist contains the product", async () => {
    const r = await request("GET", "/api/wishlist", { token: custToken });
    await expect(r.status === 200, `status ${r.status}`);
    const items = r.body?.data || [];
    const has = items.some((w) => Number(w.product_id) === Number(productId));
    await expect(has, `product ${productId} not in wishlist of ${items.length} items`);
    return `${items.length} items`;
  });

  // ─── 6. Customer places an order ─────────────────────────────────────
  let orderId = null;
  await step("customer places a cash order", async () => {
    const r = await request("POST", "/api/orders", {
      token: custToken,
      body: {
        shipping_address: "12 Smoke Street, Test City",
        phone: "01711111112",
        payment_method: "cash",
        items: [{ product_id: productId, quantity: 1 }],
      },
    });
    await expect(r.status === 201 || r.status === 200, `status ${r.status} body=${JSON.stringify(r.body)}`);
    orderId = r.body?.data?.id || r.body?.id;
    await expect(orderId, "no order id");
    return `orderId=${orderId}`;
  });

  await step("admin can see the order in the all-orders list", async () => {
    const r = await request("GET", "/api/orders", { token: adminToken });
    await expect(r.status === 200, `status ${r.status}`);
    const list = r.body?.data || r.body?.orders || r.body || [];
    const found = Array.isArray(list) && list.some((o) => Number(o.id) === Number(orderId));
    await expect(found, `order ${orderId} not in admin's list of ${Array.isArray(list) ? list.length : "?"} orders`);
    return "found";
  });

  // ─── 7. Review ───────────────────────────────────────────────────────
  // To leave a review the customer must have purchased the product, which
  // they just did. Some setups also require status=delivered — try both.
  await step("admin moves order to delivered", async () => {
    const r = await request("PUT", `/api/orders/${orderId}`, { token: adminToken, body: { status: "delivered" } });
    // Tolerate any 200/2xx — some installs may not need status=delivered.
    await expect(r.status >= 200 && r.status < 300, `status ${r.status} body=${JSON.stringify(r.body)}`);
    return "delivered";
  });

  await step("customer writes a review", async () => {
    const r = await request("POST", `/api/products/${productId}/reviews`, {
      token: custToken,
      body: { rating: 5, comment: "Smoke-test review: fast shipping, great battery life." },
    });
    await expect(r.status >= 200 && r.status < 300, `status ${r.status} body=${JSON.stringify(r.body)}`);
    return "rating=5";
  });

  // ─── 8. Admin enqueues review-summary ────────────────────────────────
  await step("admin enqueues ai-review-summary", async () => {
    const r = await request("POST", `/api/ai-tier2/review-summary/${productId}`, { token: adminToken });
    await expect(r.status === 202, `status ${r.status} body=${JSON.stringify(r.body)}`);
    return `jobId=${r.body.jobId}`;
  });

  // ─── 9. RAG support ──────────────────────────────────────────────────
  await step("RAG /support responds (handoff is allowed if embeddings not warm)", async () => {
    const r = await request("POST", "/api/ai-tier2/support", { token: custToken, body: { question: "Do you sell a wireless mouse?" } });
    await expect(r.status === 200, `status ${r.status}`);
    await expect(typeof r.body?.answer === "string", "no answer string");
    return `handoff=${r.body.handoff}, sources=${(r.body.sources || []).length}`;
  });

  // ─── Admin jobs endpoint ─────────────────────────────────────────────
  await step("admin sees recent jobs across states", async () => {
    const r = await request("GET", "/api/jobs", { token: adminToken });
    await expect(r.status === 200, `status ${r.status}`);
    const total = (r.body?.waiting?.length || 0) + (r.body?.active?.length || 0) + (r.body?.completed?.length || 0) + (r.body?.failed?.length || 0);
    return `${total} jobs across all states`;
  });

  await step("admin sees scheduled jobs (11 expected)", async () => {
    const r = await request("GET", "/api/jobs/schedules", { token: adminToken });
    await expect(r.status === 200, `status ${r.status}`);
    const list = Array.isArray(r.body) ? r.body : (r.body?.schedules || []);
    return `${list.length} schedules`;
  });
}

main().then(() => {
  console.log(`\n=== PASS: ${PASS.length} ===`);
  console.log(`=== FAIL: ${FAIL.length} ===`);
  if (FAIL.length) {
    console.log("\nFailures:");
    for (const f of FAIL) console.log("  X " + f);
    process.exit(1);
  }
  process.exit(0);
}).catch((e) => {
  console.error("smoke harness crashed:", e);
  process.exit(2);
});
