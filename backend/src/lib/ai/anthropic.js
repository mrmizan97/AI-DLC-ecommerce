// Single Anthropic client factory so every AI job uses the same model defaults
// and prompt-cache hints. Wrap completions here so tests can spyOn one method
// instead of mocking the SDK in five places.

const Anthropic = require("@anthropic-ai/sdk");

const DEFAULT_MODEL = "claude-haiku-4-5-20251001"; // cheap; bump per call if needed

let _client = null;
function client() {
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _client;
}

// Generic single-turn completion. Returns the text content.
async function complete({ system, user, model = DEFAULT_MODEL, max_tokens = 1024, json = false }) {
  // If we want JSON, instruct the model AND parse on return. Cheaper than tool use.
  const sys = typeof system === "string" ? [{ type: "text", text: system, cache_control: { type: "ephemeral" } }] : system;
  const msg = await client().messages.create({
    model,
    max_tokens,
    system: sys,
    messages: [{ role: "user", content: user }],
  });
  const text = msg.content?.[0]?.text || "";
  if (!json) return { text, usage: msg.usage };
  try {
    return { text, usage: msg.usage, json: JSON.parse(extractJson(text)) };
  } catch (e) {
    return { text, usage: msg.usage, json: null, parseError: e.message };
  }
}

// Models love to wrap JSON in ```json fences. Strip them if present.
function extractJson(s) {
  const fenced = s.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  return s.trim();
}

module.exports = { complete, client, DEFAULT_MODEL };
