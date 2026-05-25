// Shared fixtures for the e2e suite.
//
// We register accounts ONCE per test run (in setup.spec.js) and persist the
// credentials + JWTs to .auth/state.json. Each spec can read them so we
// don't pay registration latency in every test.

const { test: base, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const STATE_DIR = path.join(__dirname, ".auth");
const STATE_FILE = path.join(STATE_DIR, "state.json");
const API_URL = process.env.API_URL || "http://localhost:4000";

function loadState() {
  if (!fs.existsSync(STATE_FILE)) throw new Error("state not initialised — run setup.spec.js first");
  return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
}

function saveState(state) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

const test = base.extend({
  state: async ({}, use) => { await use(loadState()); },
  api: async ({}, use) => {
    const call = async (method, path, { token, body } = {}) => {
      const headers = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`${API_URL}${path}`, {
        method, headers,
        body: body ? JSON.stringify(body) : undefined,
      });
      let json = null;
      try { json = await res.json(); } catch { /* non-json */ }
      return { status: res.status, body: json };
    };
    await use(call);
  },
});

module.exports = { test, expect, saveState, loadState, API_URL, STATE_FILE };
