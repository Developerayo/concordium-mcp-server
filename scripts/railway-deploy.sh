#!/bin/bash
set -euo pipefail
echo "setting up Concordium mcp-server HTTP on Railway..."

cat > railway.toml << 'EOF'
[build]
builder = "nixpacks"

[deploy]
startCommand = "node dist/http-server.js"
healthcheckPath = "/health"
healthcheckTimeout = 300
restartPolicyType = "on_failure"
EOF

cat > Dockerfile << 'EOF'
FROM node:20-alpine AS builder
RUN npm install -g pnpm
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY tsconfig.json ./
COPY src ./src
RUN pnpm run build

FROM node:20-alpine
RUN npm install -g pnpm
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod
COPY --from=builder /app/dist ./dist
EXPOSE 3001
ENV NODE_ENV=production
ENV CCD_NETWORK=mainnet
ENV CCD_PORT=20000
ENV CCD_SECURE=true
CMD ["node", "/app/dist/http-server.js"]
EOF

echo "railway config created"
echo "checking that railway cli exists..."

if ! command -v railway &> /dev/null; then
    echo "railway cli not found. Please install it:"
    echo "npm install -g @railway/cli"
    exit 1
fi

echo "deploying..."
railway login --browserless 2>/dev/null || (echo "log in first 'railway login'" && exit 1)

railway link 2>/dev/null || railway create concordium-mcp-server && \
railway up && \
RAILWAY_URL=$(railway status --json | jq -r '.deployments[0].url' 2>/dev/null || echo "https://concordium-mcp-server.railway.app") && \
echo "" && \
echo "deployment successful!" && \
echo "Your Concordium mcpserver is available at:" && \
echo "  SSE endpoint: ${RAILWAY_URL}/sse" && \
echo "  Health: ${RAILWAY_URL}/health" && \
echo "" && \
echo "use with mcp-inspector:" && \
echo "  npx @modelcontextprotocol/inspector ${RAILWAY_URL}/sse" && \
echo "" && \
echo "testing deployment..." && \
sleep 30 && \
curl -s "${RAILWAY_URL}/health" > /dev/null && echo "server is up" || echo "server might still be starting"