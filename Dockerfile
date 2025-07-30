# Build
FROM node:20-alpine AS builder
RUN npm install -g pnpm
WORKDIR /app

# Copy deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy src and build
COPY tsconfig.json ./
COPY src ./src
RUN pnpm run build

# Run
FROM node:20-alpine
RUN npm install -g pnpm
WORKDIR /app

# Install prod deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

# Copy built dist
COPY --from=builder /app/dist ./dist
ENV NODE_ENV=production
EXPOSE 3001

# Default
CMD ["node", "/app/dist/index.js"]

# usage:
# stdio - docker run -i --rm concordium-mcp-server
# HTTP - docker run -p 3001:3001 --rm concordium-mcp-server node /app/dist/http-server.js