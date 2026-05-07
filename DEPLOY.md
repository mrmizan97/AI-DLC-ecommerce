# Deploy AI-DLC Shop to free infrastructure

This guide gets you to a live demo on three free services in roughly 15 minutes:

| Layer    | Service                       | What it gives you on free tier             |
|----------|-------------------------------|--------------------------------------------|
| DB       | TiDB Cloud Serverless         | 5 GB MySQL-compatible storage, free        |
| Backend  | Render (Web Service)          | 750 h/month, sleeps after 15 min idle      |
| Frontend | Vercel                        | Hobby plan, native Next.js host            |

The repo already contains a `render.yaml` Blueprint and `Dockerfile`s for both services, so most of the work is filling in environment variables in each provider's UI.

---

## 1. Create the database — TiDB Cloud Serverless

1. Sign up at [tidbcloud.com](https://tidbcloud.com) (GitHub login works).
2. Create a new **Serverless** cluster (free tier). Pick the region closest to your Render region (Oregon or Frankfurt are good defaults).
3. Once the cluster is ready, click **Connect** → choose **Public Endpoint** → **General**. Copy these values:

   ```
   Host:     gateway01.<region>.prod.aws.tidbcloud.com
   Port:     4000
   User:     <prefix>.root
   Password: <generated, save it now>
   ```
4. Open the SQL Editor and run:
   ```sql
   CREATE DATABASE ai_dlc_crud;
   ```

You will paste these into Render in step 2 as `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`. Keep `DB_SSL=true` — TiDB requires TLS.

---

## 2. Deploy the backend — Render

1. Sign up at [render.com](https://render.com) and connect your GitHub.
2. Click **New +** → **Blueprint**, point it at this repo, branch `main`. Render will pick up `render.yaml` and create the `ai-dlc-backend` web service.
3. In the new service's **Environment** tab, add the secret variables that aren't in the blueprint:

   | Key             | Value                                                            |
   |-----------------|------------------------------------------------------------------|
   | `DB_HOST`       | TiDB host from step 1                                            |
   | `DB_PORT`       | `4000`                                                           |
   | `DB_NAME`       | `ai_dlc_crud`                                                    |
   | `DB_USER`       | TiDB user (e.g. `xxxxxx.root`)                                   |
   | `DB_PASSWORD`   | TiDB password                                                    |
   | `JWT_SECRET`    | any random 32+ char string (`openssl rand -hex 32`)              |
   | `FRONTEND_URL`  | placeholder for now (`https://example.vercel.app`); update after step 3 |

4. Click **Manual Deploy** → **Deploy latest commit**. The Dockerfile runs `sequelize-cli db:migrate` before start, so your TiDB cluster gets all tables on first boot.
5. When the build finishes, copy the service URL — looks like `https://ai-dlc-backend-xxxx.onrender.com`. This is your backend URL for step 3.

> **Idle sleep warning:** Render free web services spin down after 15 minutes idle. The first request afterwards takes ~30 s while it wakes. Fine for a demo; not fine for a live shop.

---

## 3. Deploy the frontend — Vercel

1. Sign up at [vercel.com](https://vercel.com) and connect your GitHub.
2. Click **Add New** → **Project**, import this repo.
3. In the import settings, set:

   - **Root Directory:** `frontend`
   - **Framework Preset:** Next.js (auto-detected)
   - **Environment Variables:** add `NEXT_PUBLIC_API_URL` = `https://ai-dlc-backend-xxxx.onrender.com/api` (the URL from step 2, with `/api` appended)

4. Click **Deploy**. When it finishes, copy your Vercel URL (e.g. `https://ai-dlc-shop.vercel.app`).

---

## 4. Wire the frontend URL back into Render

Go back to your Render service → **Environment** → set `FRONTEND_URL` to the Vercel URL from step 3, then click **Save**. Render will redeploy automatically.

That's it — open the Vercel URL in a browser and you should see the shop.

---

## Known free-tier limitations

- **File uploads are ephemeral.** The backend writes user-uploaded images to `backend/uploads/`, which is wiped whenever Render rebuilds or restarts. To make uploads persist, swap multer's disk storage for [Cloudinary](https://cloudinary.com) (free tier: 25 GB) — the change touches `backend/src/middleware/upload.js` and the media controller.
- **Render cold starts.** Idle sleep kicks in after 15 minutes. Either accept the cold start, upgrade Render to a Starter plan ($7/mo), or move the backend to [Fly.io](https://fly.io) free tier (no idle sleep, 3 shared-CPU machines).
- **No background workers.** If you add scheduled jobs (e.g. flash-sale expiry), don't rely on a separate worker dyno — call them from a route that an external cron pings (e.g. [cron-job.org](https://cron-job.org), free).
- **WebSocket on Render free.** Supported, but the cold start interrupts open sockets — clients have to reconnect after a sleep.

---

## Local dev unchanged

`docker compose up` and `npm run dev` workflows still work as before. The only difference is `backend/src/config/database.js` now reads `DB_SSL` — defaults to `false`, so local MySQL keeps working without TLS.
