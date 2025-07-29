#!/bin/bash
set -euo pipefail
echo "setting up concordium mcp-server via local..."

pnpm install && pnpm run build && \
CONFIG_DIR="$([[ "$OSTYPE" == "darwin"* ]] && echo "$HOME/Library/Application Support/Claude" || echo "$HOME/.config/claude")" && \
mkdir -p "$CONFIG_DIR" && \
echo '{"mcpServers":{"concordium":{"command":"node","args":["'$(pwd)'/dist/index.js"],"env":{"CCD_NETWORK":"mainnet","CCD_HOST":"grpc.mainnet.concordium.software","CCD_PORT":"20000","CCD_SECURE":"true"}}}}' > "$CONFIG_DIR/claude_desktop_config.json" && \
echo "Local deployment done! Server configured for Claude Desktop at $(pwd)/dist/index.js" && \
echo "Config written to: $CONFIG_DIR/claude_desktop_config.json" && \
echo "Restart Claude Desktop"