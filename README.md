# AI-DLC Shop — production AI engineering on a real e-commerce backend

> **One line:** A single-vendor e-commerce platform where every async LLM feature — RAG-based customer support with citations, semantic search, product enrichment, review summarisation — runs through the same production-grade BullMQ pipeline as the operational hygiene jobs (stale-order sweep, flash-sale ticks, payment retries, etc.). Built end-to-end the way you'd build it for real users, not just to pass a demo.

```
       Node.js + Express + Sequelize           Next.js 16          Anthropic Claude
            │                                       │                       │
            ▼                                       ▼                       ▼
   ┌──────────────────────────────────────────────────────────────────────────┐
   │   22 background jobs · 11 cron schedules · 14 worker handlers · 4 LLM    │
   │   features · 4 test layers · 0 hallucinated SKUs (it can't, by design)   │
   └──────────────────────────────────────────────────────────────────────────┘
```

## Why a recruiter should look at this in 60 seconds

- **It's a real platform, not a tutorial.** Auth, products, carts, orders, payments, returns, reviews, wishlists, admin dashboards, sales reports, CSV bulk import, real-time notifications, media uploads — all wired with role gates and audit logging. The AI is layered *on top of* a working app, not a thin demo around the AI.
- **The AI work shows production patterns, not "I called an SDK".** RAG with **inline `[n]` citations** and a **confidence gate** that hands off to a human instead of hallucinating. **Idempotent LLM jobs** keyed by source-hash so retries never re-burn tokens. **Map-reduce summarisation** so a product with 500 reviews doesn't blow the context window. **Vector embeddings** with a deterministic fallback so the whole pipeline runs reproducibly in CI without an API key.
- **Async is treated as first-class.** Every slow/expensive operation (LLM calls, emails, batch summaries, payment retries, stale-order sweeps, flash-sale activation) runs on BullMQ + Redis with retries, idempotency, dead-letter handling, an admin observability route, and a separate worker process for prod scale-out.
- **There are 4 test layers.** Jest unit + integration suites, an LLM-mocked AI suite, a multi-role API smoke script, and a Playwright e2e suite. You can verify the project end-to-end in under 5 minutes from a clean clone.
- **The README isn't fiction.** Every claim links to a file. Every job has a test. Every prompt has a JSON guard. Every embedding has a hash key. No hand-waving.

---

## Skills demonstrated (maps to a senior AI / senior backend engineer JD)

| Skill | Where it lives |
|---|---|
| Retrieval-augmented generation with citations + confidence gate | [`src/service/ragService.js`](backend/src/service/ragService.js) |
| Vector embeddings (Voyage AI in prod, deterministic fallback in CI) | [`src/lib/ai/embeddings.js`](backend/src/lib/ai/embeddings.js), [`cosine.js`](backend/src/lib/ai/cosine.js) |
| LLM map-reduce summarisation | [`src/lib/jobs/aiReviewSummary.js`](backend/src/lib/jobs/aiReviewSummary.js) |
| Structured-output prompting + JSON validation | [`src/lib/ai/anthropic.js`](backend/src/lib/ai/anthropic.js), [`aiProductEnrichment.js`](backend/src/lib/jobs/aiProductEnrichment.js) |
| Idempotency for retried LLM work (source-hash cache) | `embedProducts.js`, `aiProductEnrichment.js` |
| BullMQ + Redis async pipeline (queue, worker, scheduler) | [`src/lib/queue.js`](backend/src/lib/queue.js), [`worker.js`](backend/src/lib/worker.js), [`scheduler.js`](backend/src/lib/scheduler.js) |
| Cron-style scheduling (production-safe, idempotent re-registration) | repeatable jobs with stable jobIds in `scheduler.js` |
| LLM cost / token tracking on every job | every cached row carries `tokens_used`; rolls up in the admin dashboard |
| Defensive system prompts (handoff vs hallucinate) | confidence-gated answer in `ragService.js` |
| Test discipline around LLM code | `jest.spyOn(anthropic, "complete")` in [`tests/jobs/*.test.js`](backend/tests/jobs/) |
| Multi-role auth + role-gated endpoints | JWT middleware + `/api/jobs` admin gate verified in [`02-admin.spec.js`](e2e/02-admin.spec.js) |
| End-to-end test design (4 layers) | unit → mocked-LLM → multi-role API smoke → Playwright |
| Real-time push (Socket.io) | per-user and per-admin channels |
| Production-style observability | Prometheus + Grafana + Loki bundled in the dev compose |

---

## Architecture

```
                                   ┌─────────────────┐
   Browser ─────────────────────►  │  Next.js (web)  │
                                   └────────┬────────┘
                                            │  REST + Socket.io
                                            ▼
                              ┌───────────────────────────┐
                              │   Express API (Node.js)   │
                              │                           │
                              │  /api/products  /api/...  │
                              │  /api/ai-tier2  /api/jobs │
                              └─────┬──────────────┬──────┘
                                    │              │
            ┌───────────────────────┘              └──────────────────────┐
            ▼                                                             ▼
   ┌──────────────────┐                                          ┌────────────────┐
   │   MySQL 8        │                                          │   Redis 7      │
   │ - products       │                                          │ - BullMQ queue │
   │ - orders         │                                          │ - schedules    │
   │ - reviews        │                                          │ - DLQ          │
   │ - product_       │  ◄──────────────────────────────────────┤                │
   │   embeddings     │                                          └────────┬───────┘
   │ - product_       │                                                   │
   │   enrichments    │                                                   ▼
   │ - review_        │                                          ┌────────────────┐
   │   summaries      │  ◄─────────────  Worker (BullMQ) ───────►│  Worker(s)     │
   └──────────────────┘                                          │  - 14 handlers │
                                                                 │  - LLM I/O     │
                                                                 │  - retries     │
                                                                 └────────┬───────┘
                                                                          │
                                                                          ▼
                                                              ┌─────────────────────┐
                                                              │ Anthropic (Claude)  │
                                                              │ Voyage (embeddings) │
                                                              └─────────────────────┘
```

The API and the worker share the same codebase. In dev both run in the same Node process; in prod scale workers independently with `npm run worker`.

---

## Background jobs

### Operational (11 — keeping the lights on)

| # | Job | Trigger | What it solves |
|---|---|---|---|
| 1 | `flash-sale-tick` | every minute | Without it, FlashSale rows with start/end times never actually activate or end. |
| 2 | `stale-order-sweep` | every 15 min | Unpaid pending orders silently lock inventory. Cancels them and restores stock. |
| 3 | `coupon-expiry` | hourly | Stops expired coupons from continuing to apply (lost margin) or showing as valid (lost trust). |
| 4 | `daily-sales-report` | 02:00 daily | One canonical email instead of "open the dashboard at 9 AM". |
| 5 | `low-stock-digest` | 09:00 daily | Replaces per-order alert spam with one morning digest admins actually read. |
| 6 | `review-request` | 11:00 daily | Emails buyers 3 days post-delivery. Deduped per user across multiple orders. |
| 7 | `activity-log-retention` | 03:00 daily | Hard TTL on ActivityLog (default 90d) — prevents table bloat. |
| 8 | `wishlist-back-in-stock` | event (stock 0→>0) | Notify + email everyone who wishlisted; highest-converting opt-in channel. |
| 9 | `orphan-media-cleanup` | every 6h | Deletes Media rows whose owner is gone (saves S3 / Cloudinary spend). |
| 10 | `abandoned-cart-reminder` | weekly Mon 08:00 | Re-engagement: one email per user listing items they saved > 7 days ago. |
| 11 | `failed-payment-retry` | every 5 min | Nudges in-window pending payments — recovers a meaningful slice of "abandoned at gateway". |

### AI-powered (4 — the engineering interview talking points)

| ID | Component | Pattern | What it does |
|---|---|---|---|
| **A6** | `embed-products` (job) | Embeddings + source-hash idempotency | Builds product source text, hashes it, skips work if unchanged. Otherwise upserts a vector to `product_embeddings`. |
| **A3** | `ai-product-enrichment` (job) | Structured-output prompting + cache | Generates SEO description, meta keywords, alt text, smart tags. Cached by source-hash so cosmetic edits don't trigger a re-run. |
| **A5** | `ai-review-summary` (job, nightly 04:00) | Map-reduce summarisation | Chunks the last 30 days of reviews into batches of 25, extracts loves/complaints per chunk, then reduces into one synthesis. |
| **A4** | `ai-customer-support-rag` (sync HTTP) | RAG + citations + handoff | Embeds question, retrieves top-K products + recent orders, builds numbered context, generates answer that *must* cite `[n]`. Low-confidence → no LLM call, hand off to human. |

A6 is the foundation (A4 and any future recommender consume the embeddings). A3 is the cheapest production-AI pattern to learn (generate once, cache forever). A5 demonstrates map-reduce on real data. A4 is the centerpiece — grounded answers with citations and a confidence gate.

---

## A4 in detail (the RAG flow)

```
question
   │
   ▼
embed(question)  ────►  query vector
   │
   ▼                       ProductEmbedding rows
load embeddings ────────►   { id, vector, product }
   │
   ▼
topK by cosine                    ┐
   │                              │
   ├─►  topK products             │  build numbered context:
   │                              │    [1] PRODUCT id:7 name:"Wireless Mouse" ...
   ├─►  user's recent orders      │    [2] ORDER number:R123 status:shipped ...
   │   (if logged in)             ┘
   │
   ▼
confidence gate
   │
   ├─►  no hits clear the threshold  →  return { handoff: true }  (no LLM call)
   │
   └─►  call Claude with system prompt that REQUIRES [n] citations
              │
              ▼
       { answer, sources, handoff, tokensUsed }
```

**What this stops:**
- Hallucinated SKUs (model can only cite retrieved context).
- Confidently wrong answers when nothing matched (confidence gate short-circuits before the LLM).
- Unsourced claims (system prompt enforces inline `[n]` citations and the UI renders them as footnotes).

---

## Testing — 4 layers, each proves something different

| Layer | File(s) | What it proves | Needs |
|---|---|---|---|
| **1. Static verification** | [`backend/tests/_static_check.js`](backend/tests/_static_check.js) | All modules load, all 14 handlers registered, all 11 cron strings parse, every test file is syntactically valid, pure utilities (cosine, embed-fallback, hash) behave correctly | nothing — runs in ~250ms |
| **2. Jest unit + integration** | [`backend/tests/`](backend/tests/) | 305+ existing tests + 15 new tests covering every job handler in isolation. LLM mocked at the wrapper (`jest.spyOn(anthropic, "complete")`) so AI tests are deterministic and free | MySQL |
| **3. Multi-role API smoke** | [`backend/tests/smoke/multiRoleSmoke.js`](backend/tests/smoke/multiRoleSmoke.js) | Walks the full contract with two roles: admin registers → creates product → enqueues AI jobs; customer registers → wishlists → orders → reviews; admin reads jobs / schedules. Exit code 0 only if every step passes | running API + MySQL + Redis |
| **4. Playwright e2e** | [`e2e/`](e2e/) | Real browser: form login as admin & customer, role-gate verification (customer → 403 on `/api/jobs`), RAG endpoint always returns valid shape (answered or `handoff:true`), never crashes on empty embedding index | running stack (frontend + API + DB + Redis) |

Run them with one command each:

```bash
# Layer 1 — no infra needed
cd backend && node tests/_static_check.js

# Layer 2 — needs MySQL
cd backend && npm test                    # full suite
cd backend && npx jest tests/jobs/        # just the new jobs

# Layer 3 — needs running API + Redis
cd backend && npm run smoke

# Layer 4 — needs full dev stack
npm install                               # at repo root
npm run e2e:install                       # one-time chromium download
npm run e2e
```

---

## Engineering decisions worth calling out

| Decision | Why |
|---|---|
| **Pure handler functions for every job** | The BullMQ worker only dispatches. Unit tests call `runFlashSaleTick()` etc. directly — no Redis needed in CI. |
| **Source-hash idempotency** (not just BullMQ jobId) | LLM jobs are expensive. Idempotency at the job level prevents duplicate enqueue; source-hash at the handler level prevents duplicate *work* across re-enqueues. |
| **Cosine on JSON, not pgvector** | MySQL 8 is what the project ships on. JSON-stored vectors with O(N) cosine handles 10k products fine. Comment in `cosine.js` flags when to migrate. |
| **Deterministic hash embeddings as fallback** | Tests stay reproducible offline. Production sets `VOYAGE_API_KEY` and gets real semantic vectors. Same call site. |
| **Confidence-gated RAG handoff** | The user-trust win you don't get from "always answer." The model literally cannot fabricate when the context is empty — we don't call it. |
| **`maxRetriesPerRequest: null` on the BullMQ ioredis** | Mandatory or BullMQ's blocking commands fail. Easy to forget; deliberately documented in `queue.js`. |
| **JOBS_DISABLED=1** | Tests skip booting the worker. Same flag lets you run workers as a separate process in prod. |
| **Standalone `npm run worker`** | Scale workers independently of the API. One image, two entrypoints. |
| **Token tracking on every AI job** | Every cached enrichment / summary row carries `tokens_used`. Admin dashboard rolls them up — cost visibility is a first-class output. |

---

## API surfaces

### Async jobs (admin)

```
GET    /api/jobs                          # waiting / active / completed / failed
GET    /api/jobs/:id                      # state, progress, return value
POST   /api/jobs/run/:name                # enqueue any handler on demand
GET    /api/jobs/schedules                # cron list + next run time
POST   /api/jobs/schedules/register       # idempotent re-register
```

### AI Tier 2

```
POST   /api/ai-tier2/embed/:productId           # admin — enqueue A6 for one product
POST   /api/ai-tier2/embed-all                  # admin — batch A6
POST   /api/ai-tier2/enrich/:productId          # admin — enqueue A3
GET    /api/ai-tier2/enrich/:productId          # public — read cached enrichment
POST   /api/ai-tier2/review-summary/:productId  # admin — enqueue A5
GET    /api/ai-tier2/review-summary/:productId  # public — read cached summary
POST   /api/ai-tier2/search                     # public — semantic product search
POST   /api/ai-tier2/support                    # public — RAG support chat (A4)
```

### Everything else

CRUD for products, variants, categories, tags, orders, addresses, coupons, flash sales, reviews, returns, notifications, wishlist, media, low-stock, bulk import, sales reports, activity log, plus the earlier AI surfaces (sentiment, recommendations, natural-language search, chatbot). Full list of routes in [`backend/src/app.js`](backend/src/app.js).

---

## Tech stack

| Layer | Tech | Notes |
|---|---|---|
| API | Node.js 18+, Express 5, Sequelize 6 | |
| DB | MySQL 8 | JSON columns for vectors and AI cache rows |
| Queue / scheduler | BullMQ 5 + ioredis on Redis 7 | one queue, repeatable jobs for cron, stable jobIds for idempotent registration |
| AI — generation | `@anthropic-ai/sdk`, Claude Haiku 4.5 default | wrapper enforces JSON parsing and prompt-cache hints |
| AI — embeddings | Voyage AI (prod) / deterministic hash (dev/test) | swap via env var, same call site |
| Realtime | Socket.io | per-user and per-admin channels |
| Payments | SSLCommerz | sandbox by default, stale-order sweep covers half-finished checkouts |
| Email | nodemailer | `sendCustom(to, subject, html)` used by scheduled jobs |
| Web | Next.js 16 App Router | |
| Observability | Prometheus + Grafana + Loki | bundled in dev compose |
| CI | Jenkins (JCasC) | bundled in dev compose |
| Tests | Jest 30 + Supertest + Playwright | LLM mocked at the wrapper; multi-role smoke + full e2e |

---

## Run it locally

### Recommended — Docker dev stack

```bash
cp .env.example .env
# set JWT_SECRET; ANTHROPIC_API_KEY and VOYAGE_API_KEY are optional
docker compose -f docker-compose.dev.yml up -d
```

| Service | URL |
|---|---|
| Web | http://localhost:4001 |
| API | http://localhost:4000 |
| MySQL | localhost:3308 |
| Redis | localhost:6381 |
| Grafana | http://localhost:3300 |
| Prometheus | http://localhost:9090 |
| Jenkins | http://localhost:8080 |

### Without Docker

```bash
# infra (run a modern Redis somewhere — Memurai on Windows, or the Docker
# redis service from docker-compose.dev.yml)
docker compose -f docker-compose.dev.yml up -d redis db

cd backend
cp .env.example .env       # set DB_*, JWT_SECRET, REDIS_URL=redis://localhost:6381
npm install
npm run db:migrate
npm run dev                # API + in-process worker + scheduled jobs
# (optional) npm run worker  # run workers as a separate process
```

```bash
cd frontend
npm install
npm run dev
```

---

## Project structure

```
ai-dlc-crud/
├── README.md                            # ← you are here
├── playwright.config.js                 # e2e config (chromium, serial, .auth state)
├── package.json                         # @playwright/test + e2e npm scripts
├── e2e/                                 # multi-role end-to-end suite
│   ├── README.md
│   ├── _fixtures.js                     # shared { api, state } fixtures
│   ├── 01-setup.spec.js                 # register admin + customer + seed product
│   ├── 02-admin.spec.js                 # admin login (UI) + role-gated API
│   ├── 03-customer.spec.js              # customer login + wishlist + order
│   └── 04-ai-rag.spec.js                # embed, semantic search, RAG /support
│
├── backend/
│   ├── src/
│   │   ├── controller/                  # route handlers (thin)
│   │   ├── service/                     # business logic (incl. ragService.js — A4)
│   │   ├── model/                       # Sequelize models (+ ProductEmbedding, Enrichment, ReviewSummary)
│   │   ├── routes/                      # express routes (+ jobsRoutes, aiTierTwoRoutes)
│   │   ├── middleware/
│   │   ├── lib/
│   │   │   ├── ai/                      # anthropic.js, embeddings.js, cosine.js
│   │   │   ├── jobs/                    # 14 handler files (11 operational + 3 AI)
│   │   │   ├── queue.js                 # BullMQ queue + ioredis options
│   │   │   ├── scheduler.js             # repeatable-job registry (cron)
│   │   │   └── worker.js                # BullMQ Worker, dispatches by job name
│   │   └── workerProcess.js             # standalone worker entry (npm run worker)
│   ├── tests/
│   │   ├── _static_check.js             # layer 1 — no-infra static verification
│   │   ├── jobs/                        # layer 2 — 15 test files, LLM mocked
│   │   ├── smoke/multiRoleSmoke.js      # layer 3 — multi-role API contract walk
│   │   └── ...                          # 305+ existing feature suites
│   └── index.js                         # API boot — wires DB + Socket.io + worker + schedules
│
├── frontend/                            # Next.js 16 App Router
├── observability/                       # Prometheus + Grafana + Loki configs
├── jenkins/                             # JCasC config for the dev Jenkins
└── docker-compose.dev.yml               # full dev stack
```

---

## What I'd build next

These would extend the same async pipeline without re-architecting it:

- **`ai-fraud-score`** — per-order risk scoring using structured outputs (Haiku 4.5) → flag for admin queue when ≥ 70.
- **`ai-review-moderation`** — few-shot classification of new reviews (legit / spam / fake / toxic) → auto-hide non-legit.
- **`ai-personalized-recs`** — hybrid (vector recall + LLM rerank) "you may also like" per active user, run nightly into a cache.
- **`ai-image-alt-text`** — Claude vision on uploaded product images → accessible alt text + auto-tags.

All four slot in as new handlers in `src/lib/jobs/`, registered in `lib/jobs/index.js` and (if scheduled) in `scheduler.js`. The queue, idempotency story, worker, admin endpoints, and test harness are reused.

---

## A note on craft

A lot of portfolio projects show one impressive thing. This one tries to show that the **boring parts** were thought through too:

- The worker boots gracefully when Redis isn't ready (no crashing the API).
- Idempotency is enforced at the right layer (jobId vs source-hash, depending on what's expensive).
- LLM JSON output is parsed defensively — bad output never gets cached.
- Tests don't need API keys to verify AI code paths.
- The e2e suite verifies the **role gate** specifically, because it's the kind of thing that silently breaks in production.
- The README links to every file it claims exists.

If you're hiring for a senior engineer who can put AI into production without it eating the database or hallucinating customer support replies — this is what that looks like.

---

## License

ISC.
