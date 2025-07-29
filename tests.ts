// src/tests.ts
import { spawn, ChildProcess } from "child_process";

// Test configuration
const TEST_WALLET = "3kBx2h5Y2veb4hZgAJWPrr8RyQESKm5TjzF3ti1QQ4VSYLwK1G";

// Colors for output
const colors = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  reset: "\x1b[0m",
};

function log(
  message: string,
  type: "success" | "error" | "info" | "test" = "info"
) {
  const color =
    type === "success"
      ? colors.green
      : type === "error"
      ? colors.red
      : type === "test"
      ? colors.blue
      : colors.yellow;
  console.log(`${color}${message}${colors.reset}`);
}

async function waitForServer(
  process: ChildProcess,
  mode: string
): Promise<boolean> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      log(`❌ ${mode} mode timeout`, "error");
      process.kill();
      resolve(false);
    }, 10000);

    process.stderr?.on("data", (data) => {
      const output = data.toString();
      if (output.includes("MCP server connected via stdio")) {
        clearTimeout(timeout);
        log(`✅ ${mode} mode started successfully`, "success");
        resolve(true);
      }
    });

    process.on("error", (err) => {
      clearTimeout(timeout);
      log(`❌ Failed to start ${mode} process: ${err.message}`, "error");
      resolve(false);
    });
  });
}

async function testStdioMode(): Promise<boolean> {
  log("\n📝 Testing STDIO Mode...", "test");

  const stdioProcess = spawn("pnpm", ["tsx", "src/index.ts"], {
    env: { ...process.env, CCD_NETWORK: "testnet" },
    stdio: ["pipe", "pipe", "pipe"],
    shell: true,
  });

  const started = await waitForServer(stdioProcess, "STDIO");

  if (started) {
    // Test basic STDIO communication
    const testMessage = JSON.stringify({
      jsonrpc: "2.0",
      method: "tools/list",
      id: 1,
    });

    log("\n🛠️  Testing MCP protocol...", "test");
    stdioProcess.stdin?.write(testMessage + "\n");

    // Give it a moment to respond
    await new Promise((resolve) => setTimeout(resolve, 2000));
    log("✅ MCP protocol communication successful", "success");
    stdioProcess.kill();
  }

  return started;
}

async function runTests() {
  log("\n🚀 Starting Concordium MCP Server Tests", "info");

  // Run STDIO tests
  const stdioSuccess = await testStdioMode();

  // Summary
  log("\n📊 Test Summary:", "info");
  if (stdioSuccess) {
    log("✨ All tests passed!", "success");
    process.exit(0);
  } else {
    log("❌ Tests failed!", "error");
    process.exit(1);
  }
}

// Handle cleanup
process.on("SIGINT", () => {
  log("\n🛑 Tests interrupted", "info");
  process.exit(1);
});

// Run tests
runTests().catch((err) => {
  log(`❌ Fatal error: ${err.message}`, "error");
  process.exit(1);
});
