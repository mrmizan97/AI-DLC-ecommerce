// Cosine similarity between two equal-length vectors.
// Assumes both are L2-normalised (our embed() returns normalised vectors)
// in which case the cosine is just the dot product. Cheap.

function cosine(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot;
}

// Given a query vector and an array of { id, vector, ...meta }, return the
// topK by cosine score. O(N) — fine for <10k items. Beyond that, use pgvector.
function topK(queryVec, items, k = 5) {
  const scored = items.map((it) => ({ ...it, score: cosine(queryVec, it.vector) }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k);
}

module.exports = { cosine, topK };
