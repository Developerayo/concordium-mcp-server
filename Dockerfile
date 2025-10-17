# ---- build ----
FROM node:20-alpine@sha256:5f5f2d5bbf0f1a8f1f1e8c3a7a9e7c6f6b3d1b1a0a0f9d9e9c8b7a6a5a4a3a2 AS build
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json* ./
RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev
COPY . .
RUN npm run build

# ---- runtime (distroless) ----
FROM gcr.io/distroless/nodejs20-debian12@sha256:9d2c5d2e4b2d3a6b0f0a3a2d1c9b8e7f6a5d4c3b2a1908f7e6d5c4b3a2918076

USER 10001:10001
WORKDIR /srv

COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json

ENV NODE_ENV=production \
    PORT=8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
  CMD ["node","-e","fetch('http://127.0.0.1:8080/healthz',{cache:'no-store'}).then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]

CMD ["/nodejs/bin/node","dist/server.js"]
