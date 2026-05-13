# ── Stage 1: install production dependencies ──────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

# ── Stage 2: development (full deps + node --watch) ───────────────────────────
FROM node:20-alpine AS development

WORKDIR /app

COPY package*.json ./
RUN npm ci

EXPOSE 3000

# Source code is bind-mounted at runtime; node --watch reloads on change
CMD ["sh", "-c", "npx sequelize-cli db:migrate || true && npm run dev"]

# ── Stage 3: production image ──────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Copy only production node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY . .

# Create uploads directory (volume mount point)
RUN mkdir -p uploads

EXPOSE 3000

# Run database migrations then start the server
CMD ["sh", "-c", "npx sequelize-cli db:migrate && node index.js"]
