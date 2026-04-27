/**
 * AI Features Test Suite
 * Tests the /api/ai endpoints with a mocked Anthropic SDK.
 */

// ─── Mock Anthropic SDK before any imports ────────────────────────────────────
jest.mock("@anthropic-ai/sdk", () => {
  return jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn().mockResolvedValue({
        content: [
          {
            type: "text",
            text: JSON.stringify({
              sentiment: "positive",
              confidence: 0.9,
              themes: ["quality", "value"],
              summary: "Great product with excellent quality",
            }),
          },
        ],
      }),
    },
  }));
});

const request = require("supertest");
const app = require("../src/app");
const shared = require("./shared");

describe("AI API", () => {
  // ─── Recommendations ───────────────────────────────────────────────────────

  describe("GET /api/ai/recommendations", () => {
    test("401 without token", async () => {
      const res = await request(app).get("/api/ai/recommendations");
      expect(res.status).toBe(401);
    });

    test("returns recommendations array for authenticated customer", async () => {
      const res = await request(app)
        .get("/api/ai/recommendations")
        .set("Authorization", `Bearer ${shared.customerToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    test("returns recommendations array for authenticated admin", async () => {
      const res = await request(app)
        .get("/api/ai/recommendations")
        .set("Authorization", `Bearer ${shared.adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    test("respects limit query param", async () => {
      const res = await request(app)
        .get("/api/ai/recommendations?limit=2")
        .set("Authorization", `Bearer ${shared.customerToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeLessThanOrEqual(2);
    });
  });

  // ─── Sentiment Analysis ────────────────────────────────────────────────────

  describe("POST /api/ai/sentiment", () => {
    test("401 without token", async () => {
      const res = await request(app)
        .post("/api/ai/sentiment")
        .send({ review_text: "Great product!" });
      expect(res.status).toBe(401);
    });

    test("403 for customer (non-admin)", async () => {
      const res = await request(app)
        .post("/api/ai/sentiment")
        .set("Authorization", `Bearer ${shared.customerToken}`)
        .send({ review_text: "Great product!" });
      expect(res.status).toBe(403);
    });

    test("400 when review_text is missing", async () => {
      const res = await request(app)
        .post("/api/ai/sentiment")
        .set("Authorization", `Bearer ${shared.adminToken}`)
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test("returns sentiment object for admin", async () => {
      const res = await request(app)
        .post("/api/ai/sentiment")
        .set("Authorization", `Bearer ${shared.adminToken}`)
        .send({ review_text: "This product is absolutely fantastic! Great quality and fast delivery." });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("sentiment");
      expect(res.body.data).toHaveProperty("confidence");
      expect(res.body.data).toHaveProperty("themes");
      expect(res.body.data).toHaveProperty("summary");
      expect(["positive", "negative", "neutral"]).toContain(res.body.data.sentiment);
      expect(typeof res.body.data.confidence).toBe("number");
      expect(Array.isArray(res.body.data.themes)).toBe(true);
    });
  });

  // ─── Bulk Sentiment Analysis ───────────────────────────────────────────────

  describe("POST /api/ai/sentiment/bulk", () => {
    test("401 without token", async () => {
      const res = await request(app)
        .post("/api/ai/sentiment/bulk")
        .send({ review_ids: [1] });
      expect(res.status).toBe(401);
    });

    test("403 for customer (non-admin)", async () => {
      const res = await request(app)
        .post("/api/ai/sentiment/bulk")
        .set("Authorization", `Bearer ${shared.customerToken}`)
        .send({ review_ids: [1] });
      expect(res.status).toBe(403);
    });

    test("400 when review_ids is not an array", async () => {
      const res = await request(app)
        .post("/api/ai/sentiment/bulk")
        .set("Authorization", `Bearer ${shared.adminToken}`)
        .send({ review_ids: "not-an-array" });
      expect(res.status).toBe(400);
    });

    test("400 when review_ids is empty", async () => {
      const res = await request(app)
        .post("/api/ai/sentiment/bulk")
        .set("Authorization", `Bearer ${shared.adminToken}`)
        .send({ review_ids: [] });
      expect(res.status).toBe(400);
    });

    test("404 when no reviews found for given ids", async () => {
      const res = await request(app)
        .post("/api/ai/sentiment/bulk")
        .set("Authorization", `Bearer ${shared.adminToken}`)
        .send({ review_ids: [999999, 999998] });
      expect(res.status).toBe(404);
    });
  });

  // ─── Natural Language Search ───────────────────────────────────────────────

  describe("POST /api/ai/search", () => {
    test("400 when query is missing", async () => {
      const res = await request(app)
        .post("/api/ai/search")
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test("returns search params and products for a basic query (public)", async () => {
      const res = await request(app)
        .post("/api/ai/search")
        .send({ query: "wireless mouse" });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.search_params).toBeDefined();
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    test("returns search params and products for a price query (public)", async () => {
      const res = await request(app)
        .post("/api/ai/search")
        .send({ query: "cheap keyboard under 1000 taka" });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.search_params).toHaveProperty("search_terms");
      expect(res.body.search_params).toHaveProperty("min_price");
      expect(res.body.search_params).toHaveProperty("max_price");
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    test("works without authentication (public route)", async () => {
      const res = await request(app)
        .post("/api/ai/search")
        .send({ query: "gaming accessories" });
      // Should not return 401
      expect(res.status).not.toBe(401);
      expect(res.status).toBe(200);
    });
  });

  // ─── Chatbot ──────────────────────────────────────────────────────────────

  describe("POST /api/ai/chat", () => {
    test("400 when message is missing", async () => {
      const res = await request(app)
        .post("/api/ai/chat")
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test("returns chatbot response for simple message (public)", async () => {
      const res = await request(app)
        .post("/api/ai/chat")
        .send({ message: "What products do you have?" });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("response");
      expect(typeof res.body.data.response).toBe("string");
    });

    test("accepts conversation_history (public)", async () => {
      const res = await request(app)
        .post("/api/ai/chat")
        .send({
          message: "Tell me more about that.",
          conversation_history: [
            { role: "user", content: "Do you have wireless mice?" },
            { role: "assistant", content: "Yes, we have a Wireless Mouse for $29.99." },
          ],
        });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("response");
    });

    test("works without authentication (public route)", async () => {
      const res = await request(app)
        .post("/api/ai/chat")
        .send({ message: "Hello!" });
      // Should not return 401
      expect(res.status).not.toBe(401);
      expect(res.status).toBe(200);
    });
  });
});
