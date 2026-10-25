# Runtime image over a `pnpm deploy` artifact — build context is the
# deployed dir, NOT this repo. Produce it first:
#   node primebrick-us-v3/scripts/deploy-service.mjs job-handler
#   docker build -f primebrick-us-v3/job-handler/Dockerfile <primebrick>/temp/deploy-out/job-handler
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

ENV NODE_ENV=production
# Internal port is always 3006 — comes from config table, not ENV.
# Host port mapping is handled by Terraform.
EXPOSE 3006

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD bun -e "fetch('http://localhost:3006/health').then(r => process.exit(r.status === 200 ? 0 : 1)).catch(() => process.exit(1))"

CMD ["bun", "dist/index.js"]
