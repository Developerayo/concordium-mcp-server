#!/bin/bash
set -euo pipefail
echo "setting up Concordium mcp-server via Docker..."

cat > .dockerignore << 'EOF'
node_modules
dist
.env
.git
coverage
*.md
scripts
tests.ts
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
# Add DNS utilities for debugging
RUN apk add --no-cache bind-tools
RUN npm install -g pnpm
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod
COPY --from=builder /app/dist ./dist
ENV NODE_ENV=production
ENTRYPOINT ["node", "/app/dist/index.js"]
EOF

docker build -t concordium-mcp-server . && \
echo "Docker image built successfully"
echo ""
echo "If Claude Desktop, add this to claude_desktop_config.json:"
echo '{'
echo '  "mcpServers": {'
echo '    "concordium": {'
echo '      "command": "docker",'
echo '      "args": ["run", "-i", "--rm", "--network=host", "concordium-mcp-server"],'
echo '      "env": {'
echo '        "CCD_NETWORK": "mainnet",'
echo '        "CCD_PORT": "20000",'
echo '        "CCD_SECURE": "true"'
echo '      }'
echo '    }'
echo '  }'
echo '}'
echo "If Cursor, add this to mcp.json"
echo '{'
echo '  "mcpServers": {'
echo '    "concordium": {'
echo '      "command": "docker",'
echo '      "args": ["run", "-i", "--rm", "--network=host", "concordium-mcp-server"],'
echo '      "env": {'
echo '        "CCD_NETWORK": "mainnet",'
echo '        "CCD_PORT": "20000",'
echo '        "CCD_SECURE": "true"'
echo '      }'
echo '    }'
echo '  }'
echo '}'
