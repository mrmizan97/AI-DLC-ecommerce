const { Op } = require("sequelize");
const { Product, Review, Order, OrderItem } = require("../model");

const MODEL = "claude-haiku-4-5-20251001";

function getClient() {
  const Anthropic = require("@anthropic-ai/sdk");
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

// Shared system prompt content for caching
const SHOPPING_ASSISTANT_SYSTEM = [
  {
    type: "text",
    text: "You are a helpful shopping assistant for an e-commerce platform called AI-DLC Shop. Help users find products, track orders, and answer shopping questions. Be concise, friendly, and helpful. When recommending products, focus on user needs and value for money.",
    cache_control: { type: "ephemeral" },
  },
];

const SENTIMENT_SYSTEM = [
  {
    type: "text",
    text: `You are a sentiment analysis expert for product reviews. Analyze reviews and return structured JSON.
Always respond with valid JSON in this exact format:
{
  "sentiment": "positive" | "negative" | "neutral",
  "confidence": <number between 0 and 1>,
  "themes": [<array of key theme strings>],
  "summary": "<one sentence summary>"
}`,
    cache_control: { type: "ephemeral" },
  },
];

const SEARCH_SYSTEM = [
  {
    type: "text",
    text: `You are a search query parser for an e-commerce platform. Parse natural language product search queries and extract structured search parameters.
Always respond with valid JSON in this exact format:
{
  "search_terms": "<main search keywords>",
  "min_price": <number or null>,
  "max_price": <number or null>,
  "category_keywords": [<array of category-related strings>],
  "brand_keywords": [<array of brand-related strings>]
}`,
    cache_control: { type: "ephemeral" },
  },
];

const RECOMMENDATION_SYSTEM = [
  {
    type: "text",
    text: `You are a product recommendation engine for an e-commerce platform. Based on user purchase and browsing history, suggest relevant products. Return a JSON array of suggested product names with reasons.
Always respond with valid JSON in this exact format:
[
  { "name": "<product name keyword>", "reason": "<brief reason>" }
]`,
    cache_control: { type: "ephemeral" },
  },
];

/**
 * Parse JSON safely from a Claude response text.
 * Claude sometimes wraps JSON in markdown code fences.
 */
function parseJSON(text) {
  // Strip markdown code fences if present
  const cleaned = text.replace(/```(?:json)?\n?/g, "").trim();
  return JSON.parse(cleaned);
}

const aiService = {
  /**
   * 1. Product Recommendations
   */
  async getProductRecommendations(userId, purchaseHistory = [], browsingHistory = [], limit = 5) {
    // Fallback: no API key → return top 5 active products
    if (!process.env.ANTHROPIC_API_KEY) {
      const products = await Product.findAll({
        where: { status: "active" },
        order: [["created_at", "DESC"]],
        limit,
      });
      return products.map((p) => ({ product: p.toJSON(), reason: "Top product" }));
    }

    const purchasedNames = purchaseHistory.map((p) => p.name || p).join(", ") || "none";
    const viewedNames = browsingHistory.map((p) => p.name || p).join(", ") || "none";

    const response = await getClient().messages.create({
      model: MODEL,
      max_tokens: 512,
      system: RECOMMENDATION_SYSTEM,
      messages: [
        {
          role: "user",
          content: `User has purchased: ${purchasedNames}. User viewed: ${viewedNames}. Recommend ${limit} similar or complementary products.`,
        },
      ],
    });

    let suggestions = [];
    try {
      suggestions = parseJSON(response.content[0].text);
    } catch {
      suggestions = [];
    }

    // Query DB to find actual products matching suggestions by name similarity
    const results = [];
    for (const suggestion of suggestions) {
      if (!suggestion.name) continue;
      const product = await Product.findOne({
        where: {
          name: { [Op.like]: `%${suggestion.name}%` },
          status: "active",
        },
      });
      if (product) {
        results.push({ product: product.toJSON(), reason: suggestion.reason || "Recommended for you" });
      }
      if (results.length >= limit) break;
    }

    // If AI suggestions didn't yield enough DB matches, pad with top products
    if (results.length < limit) {
      const existingIds = results.map((r) => r.product.id);
      const extras = await Product.findAll({
        where: {
          status: "active",
          id: { [Op.notIn]: existingIds.length ? existingIds : [0] },
        },
        order: [["created_at", "DESC"]],
        limit: limit - results.length,
      });
      extras.forEach((p) => results.push({ product: p.toJSON(), reason: "Popular product" }));
    }

    return results;
  },

  /**
   * 2. Analyze Review Sentiment
   */
  async analyzeReviewSentiment(reviewText) {
    if (!process.env.ANTHROPIC_API_KEY) {
      return { sentiment: "neutral", confidence: 0.5, themes: [], summary: "Analysis unavailable" };
    }

    const response = await getClient().messages.create({
      model: MODEL,
      max_tokens: 256,
      system: SENTIMENT_SYSTEM,
      messages: [
        {
          role: "user",
          content: `Analyze this product review: "${reviewText}"`,
        },
      ],
    });

    try {
      return parseJSON(response.content[0].text);
    } catch {
      return { sentiment: "neutral", confidence: 0.5, themes: [], summary: "Analysis unavailable" };
    }
  },

  /**
   * 3. Natural Language Search
   */
  async naturalLanguageSearch(query) {
    if (!process.env.ANTHROPIC_API_KEY) {
      return { search_terms: query, min_price: null, max_price: null, category_keywords: [], brand_keywords: [] };
    }

    const response = await getClient().messages.create({
      model: MODEL,
      max_tokens: 256,
      system: SEARCH_SYSTEM,
      messages: [
        {
          role: "user",
          content: `Parse this search query: "${query}"`,
        },
      ],
    });

    try {
      return parseJSON(response.content[0].text);
    } catch {
      return { search_terms: query, min_price: null, max_price: null, category_keywords: [], brand_keywords: [] };
    }
  },

  /**
   * 4. Chatbot Response
   */
  async getChatbotResponse(message, conversationHistory = [], contextData = {}) {
    if (!process.env.ANTHROPIC_API_KEY) {
      return {
        response:
          "Hello! I'm the AI-DLC Shop assistant. I can help you find products, check order status, and answer shopping questions. Please set up the API key to enable full AI features.",
        suggestedProducts: [],
      };
    }

    // Build context injection into the system prompt
    let contextText = "";
    if (contextData.products && contextData.products.length) {
      contextText += `\n\nAvailable products context:\n${JSON.stringify(contextData.products.slice(0, 5))}`;
    }
    if (contextData.categories && contextData.categories.length) {
      contextText += `\n\nCategories: ${contextData.categories.map((c) => c.name).join(", ")}`;
    }
    if (contextData.userOrder) {
      contextText += `\n\nUser's recent order: ${JSON.stringify(contextData.userOrder)}`;
    }

    const systemBlocks = [
      {
        type: "text",
        text: SHOPPING_ASSISTANT_SYSTEM[0].text + contextText,
        cache_control: { type: "ephemeral" },
      },
    ];

    // Limit conversation history to last 10 messages
    const historyMessages = (conversationHistory || []).slice(-10).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const messages = [...historyMessages, { role: "user", content: message }];

    const response = await getClient().messages.create({
      model: MODEL,
      max_tokens: 512,
      system: systemBlocks,
      messages,
    });

    return {
      response: response.content[0].text,
      suggestedProducts: [],
    };
  },

  /**
   * 5. Bulk Analyze Sentiment
   */
  async bulkAnalyzeSentiment(reviews) {
    const results = [];
    for (const review of reviews) {
      const text = review.comment || review.text || String(review);
      const result = await this.analyzeReviewSentiment(text);
      results.push({ review_id: review.id || null, ...result });
      // Rate limiting: 100ms delay between calls
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return results;
  },
};

module.exports = aiService;
