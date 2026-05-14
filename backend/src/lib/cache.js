const stores = new Map();

function getStore(namespace) {
  let store = stores.get(namespace);
  if (!store) {
    store = new Map();
    stores.set(namespace, store);
  }
  return store;
}

function get(namespace, key) {
  const entry = getStore(namespace).get(key);
  if (!entry) return undefined;
  if (entry.expiresAt < Date.now()) {
    getStore(namespace).delete(key);
    return undefined;
  }
  return entry.value;
}

function set(namespace, key, value, ttlSeconds) {
  getStore(namespace).set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

function invalidate(namespace) {
  stores.delete(namespace);
}

async function memo(namespace, key, ttlSeconds, loader) {
  const hit = get(namespace, key);
  if (hit !== undefined) return hit;
  const value = await loader();
  set(namespace, key, value, ttlSeconds);
  return value;
}

module.exports = { get, set, invalidate, memo };
