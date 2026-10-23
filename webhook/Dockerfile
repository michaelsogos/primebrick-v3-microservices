# Runtime image over a `pnpm deploy` artifact — build context is the
# deployed dir, NOT this repo. Produce it first:
#   node primebrick-us-v3/scripts/deploy-service.mjs webhook
#   docker build -f primebrick-us-v3/webhook/Dockerfile <primebrick>/temp/deploy-out/webhook
# The deployed package.json has workspace deps pinned to real versions and
# node_modules vendored — no install/build inside the image.
FROM oven/bun:1.1.0-alpine

WORKDIR /app

COPY package.json ./
COPY node_modules ./node_modules
COPY dist ./dist
COPY db-meta ./db-meta
COPY scripts ./scripts
COPY docs ./docs

# NODE_ENV is a platform env var — supplied at image level (never in .env,
# never in config_entries). production → release-trusted migration
# signatures only + Secure session cookies.
ENV NODE_ENV=production
# Internal port is always 3005 — comes from config table, not ENV.
# Host port mapping is handled by Terraform.
EXPOSE 3005

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD bun -e "fetch('http://localhost:3005/health').then(r => process.exit(r.status === 200 ? 0 : 1)).catch(() => process.exit(1))"

CMD ["bun", "dist/index.js"]
