#!/bin/bash
set -euo pipefail
echo "setting up Concordium mcp-server HTTP on fly.io..."

cat > fly.toml << 'EOF'
app = 'concordium-mcp-server'
primary_region = 'ord'

[build]

[env]
  NODE_ENV = 'production'
  CCD_NETWORK = 'mainnet'
  CCD_PORT = '20000'
  CCD_SECURE = 'true'

[http_service]
  internal_port = 3001
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0
  processes = ['app']

[[http_service.checks]]
  interval = '15s'
  timeout = '2s'
  grace_period = '5s'
  method = 'GET'
  path = '/health'

[vm]
  cpu_kind = 'shared'
  cpus = 1
  memory_mb = 512
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
CMD ["node", "/app/dist/http-server.js"]
EOF

echo "fly.io config created"
echo "checking that fly cli exists..."

if ! command -v fly &> /dev/null; then
    echo "fly cli not found. Please install it:"
    echo "curl -L https://fly.io/install.sh | sh"
    exit 1
fi

echo "deploying..."
fly auth whoami > /dev/null 2>&1 || (echo "log in first 'fly auth login'" && exit 1)

APP_NAME=$(grep "app = " fly.toml | cut -d "'" -f 2)
fly apps create $APP_NAME 2>/dev/null || echo "app already exists"

fly deploy && \
FLY_URL="https://${APP_NAME}.fly.dev" && \
echo "" && \
echo "deployment successful!" && \
echo "Your Concordium mcpserver is available at:" && \
echo "  SSE endpoint: ${FLY_URL}/sse" && \
echo "  Health: ${FLY_URL}/health" && \
echo "" && \
echo "use with mcp-inspector:" && \
echo "  npx @modelcontextprotocol/inspector ${FLY_URL}/sse" && \
echo "" && \
echo "testing deployment..." && \
curl -s "${FLY_URL}/health" > /dev/null && echo "server is up" || echo "server might still be starting"