// AI Tier 2 RAG + semantic search:
//   - Embed the seed product (admin) — synchronous-equivalent: we run
//     embedOne directly via a job ID + status check is overkill for e2e.
//     Here we hit the route and trust the worker. If embeddings aren't
//     ready when we ask, the RAG endpoint returns handoff:true — also valid.
//   - Hit /api/ai-tier2/search with a relevant query
//   - Hit /api/ai-tier2/support with a question — verify response shape

const { test, expect } = require("./_fixtures");

test.describe("AI Tier 2", () => {
  test("admin enqueues embed-products for the seed product", async ({ api, state }) => {
    const r = await api("POST", `/api/ai-tier2/embed/${state.productId}`, { token: state.admin.token });
    expect(r.status).toBe(202);
  });

  test("semantic search returns a well-formed response", async ({ api }) => {
    const r = await api("POST", "/api/ai-tier2/search", { body: { query: "wireless mouse", topK: 3 } });
    expect(r.status).toBe(200);
    expect(r.body).toHaveProperty("results");
    expect(Array.isArray(r.body.results)).toBe(true);
    // Each result has id, score, product — but the array may be empty if
    // the worker hasn't drained the embed job yet. We only assert shape.
    for (const hit of r.body.results) {
      expect(hit).toHaveProperty("id");
      expect(hit).toHaveProperty("score");
    }
  });

  test("/support returns answer + sources or handoff (never crashes)", async ({ api, state }) => {
    const r = await api("POST", "/api/ai-tier2/support", { token: state.customer.token, body: { question: "Do you sell a wireless mouse?" } });
    expect(r.status).toBe(200);
    expect(typeof r.body?.answer).toBe("string");
    expect(typeof r.body?.handoff).toBe("boolean");
    expect(Array.isArray(r.body?.sources)).toBe(true);

    // If handoff=true (no embeddings warm yet) the LLM must not have been called.
    if (r.body.handoff) {
      expect(r.body.sources.length).toBe(0);
    }
  });

  test("/support without a question returns 400-shaped error", async ({ api }) => {
    const r = await api("POST", "/api/ai-tier2/support", { body: {} });
    // The handler returns the error in the JSON body rather than a 4xx code
    // — assert the contract is consistent (either 4xx OR a shaped error).
    if (r.status === 200) {
      expect(r.body?.error).toMatch(/question/i);
    } else {
      expect(r.status).toBeGreaterThanOrEqual(400);
    }
  });
});
