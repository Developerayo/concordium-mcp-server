#!/bin/bash
set -euo pipefail
echo "setting up Concordium mcp-server HTTP on Render..."

cat > render.yaml << 'EOF'
services:
  - type: web
    name: concordium-mcp-server
    runtime: node
    plan: free
    buildCommand: pnpm install && pnpm run build
    startCommand: node dist/http-server.js
    healthCheckPath: /health
    envVars:
      - key: NODE_ENV
        value: production
      - key: CCD_NETWORK
        value: mainnet
      - key: CCD_PORT
        value: "20000"
      - key: CCD_SECURE
        value: "true"
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

echo "render config created"
echo "checking that render cli exists..."

if ! command -v render &> /dev/null; then
    echo "render cli not found. Please install it:"
    echo "npm install -g @render/cli"
    exit 1
fi

echo "deploying..."
render auth status > /dev/null 2>&1 || (echo "log in first 'render auth login'" && exit 1)

SERVICE_NAME="concordium-mcp-server-$(date +%s)"
render create web --name $SERVICE_NAME --runtime node --build-command "pnpm install && pnpm run build" --start-command "node dist/http-server.js" --plan free && \
RENDER_URL="https://${SERVICE_NAME}.onrender.com" && \
echo "" && \
echo "deployment initiated!" && \
echo "Your Concordium mcpserver will be available at:" && \
echo "  SSE endpoint: ${RENDER_URL}/sse" && \
echo "  Health: ${RENDER_URL}/health" && \
echo "" && \
echo "use with mcp-inspector:" && \
echo "  npx @modelcontextprotocol/inspector ${RENDER_URL}/sse" && \
echo "" && \
echo "Note: Render deployments take 5-10 minutes. Check status at:" && \
echo "  https://dashboard.render.com" && \
echo "" && \
echo "testing deployment in 60 seconds..." && \
sleep 60 && \
curl -s "${RENDER_URL}/health" > /dev/null && echo "server is up" || echo "server still building, check dashboard"