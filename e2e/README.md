# Multi-role e2e tests

End-to-end tests covering both **admin** and **customer** roles across the API + UI surfaces. No MCP server required — these run with stock `@playwright/test`.

## What's covered

| File | Role | Surface | What it asserts |
|------|------|---------|-----------------|
| `01-setup.spec.js` | bootstrap | API | Registers fresh admin + customer (unique per run), seeds one category + one product, writes credentials to `.auth/state.json`. |
| `02-admin.spec.js` | admin | UI + API | Logs in via the login form; verifies token works against `/api/jobs`, `/api/jobs/schedules`, and the Tier 2 enqueue endpoints; verifies role gate (customer→403 on `/api/jobs`). |
| `03-customer.spec.js` | customer | UI + API | Logs in via the form; products page renders the seed product; wishlist add + list; places a cash order; finds it in the customer's order list. |
| `04-ai-rag.spec.js` | mixed | API | Admin enqueues `embed-products`; checks `/api/ai-tier2/search` returns a well-formed result list; `/api/ai-tier2/support` returns either an answer-with-sources or a `handoff:true` (both are correct outcomes). |

## Run it

```bash
# from the repo root
npm install                  # installs @playwright/test at root
npm run e2e:install          # downloads chromium (once)
npm run e2e                  # runs all specs

# overrides
FRONTEND_URL=http://localhost:4001 API_URL=http://localhost:4000 npm run e2e
```

Reports land in `playwright-report/`. Open with `npm run e2e:report`.

## Requirements

The dev stack must be running:

```bash
docker compose -f docker-compose.dev.yml up -d
```

That gives you frontend on `:4001`, API on `:4000`, MySQL on `:3308`, Redis on `:6381`. The tests don't manage any of that — they just hit the URLs.

## Why this exists

These are integration tests, not unit tests. They prove:

- The **role gate** actually rejects (customer can't reach admin routes).
- The **login form** posts to the API correctly and persists a session.
- The **Tier 2 AI routes** accept the enqueue and produce a job (worker draining is async — we don't block on it here; the unit tests in `backend/tests/jobs/aiProductEnrichment.test.js` already prove handler behaviour with the LLM mocked).
- The **RAG endpoint** always returns a valid shape — either answered with sources or short-circuited to `handoff:true` — never a 500 from an empty embedding index.
