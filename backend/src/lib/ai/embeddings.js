// Embedding provider.
//
// Anthropic doesn't ship an embedding endpoint — they recommend Voyage AI.
// If VOYAGE_API_KEY is set we call voyage-3-lite (256-dim, fast & cheap).
// Otherwise we fall back to a deterministic hash-based embedding so tests
// and offline dev still work — same product always produces the same
// vector, similar products will share some buckets. Not a real semantic
// embedding, but enough to wire end-to-end search and assert behaviour.
//
// HOW TO SWAP TO REAL EMBEDDINGS IN PROD:
//   1. set VOYAGE_API_KEY in .env
//   2. (optional) bump EMBED_DIMS to 512/1024 to trade cost for quality
//
// For >10k products move to pgvector / Qdrant / Pinecone — the cosine
// search in cosine.js scans all vectors which is fine for demos, not at
// scale.

const EMBED_DIMS_DEFAULT = 256;
const FALLBACK_MODEL = "fallback-hash-256";
const VOYAGE_MODEL = "voyage-3-lite";

async function embed(text) {
  const t = String(text || "").trim();
  if (!t) return { vector: new Array(EMBED_DIMS_DEFAULT).fill(0), model: FALLBACK_MODEL, dims: EMBED_DIMS_DEFAULT };

  if (process.env.VOYAGE_API_KEY) {
    return embedVoyage(t);
  }
  return { vector: hashEmbed(t, EMBED_DIMS_DEFAULT), model: FALLBACK_MODEL, dims: EMBED_DIMS_DEFAULT };
}

async function embedVoyage(text) {
  const res = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
    },
    body: JSON.stringify({ input: text, model: VOYAGE_MODEL }),
  });
  if (!res.ok) throw new Error(`voyage embed failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  const vector = data.data[0].embedding;
  return { vector, model: VOYAGE_MODEL, dims: vector.length };
}

// Deterministic bag-of-words → fixed-length vector. Tokenises the text,
// hashes each token, accumulates weight into a bucket, then L2-normalises.
// Same input → same output. Similar inputs share buckets.
function hashEmbed(text, dims) {
  const v = new Array(dims).fill(0);
  const tokens = text.toLowerCase().match(/[a-z0-9]+/g) || [];
  for (const tok of tokens) {
    const h = djb2(tok);
    const i = h % dims;
    v[i] += 1;
    // Splash a tiny weight into a neighbour to share signal across buckets.
    v[(i + 1) % dims] += 0.5;
  }
  return l2norm(v);
}

function djb2(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h;
}

function l2norm(v) {
  let sum = 0;
  for (const x of v) sum += x * x;
  const n = Math.sqrt(sum) || 1;
  return v.map((x) => x / n);
}

module.exports = { embed, EMBED_DIMS_DEFAULT, FALLBACK_MODEL, VOYAGE_MODEL };
