/*
# MIT License
## Original Copyright
Copyright (c) 2025 Peter Steinberger
## Modified Copyright
Copyright (c) 2026 xhwSkhizein）

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Code Source
This software is modified from the original work of Peter Steinberger (2025).
Original project address: https://github.com/moltbot/moltbot 
*/

#!/usr/bin/env node

/**
 * Standalone Browser Control Server CLI
 * 
 * Starts an HTTP API server for controlling browsers via CDP.
 */

import { startBrowserBridgeServer, stopBrowserBridgeServer } from "./bridge-server.js";
import { createDefaultBrowserConfig, resolveBrowserConfig } from "./config.js";
import type { BrowserConfig } from "./config-types.js";

const DEFAULT_PORT = 18791;
const DEFAULT_HOST = "127.0.0.1";

async function main() {
  const args = process.argv.slice(2);
  
  let host = DEFAULT_HOST;
  let port = DEFAULT_PORT;
  let authToken: string | undefined;
  let configPath: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--host" && i + 1 < args.length) {
      host = args[++i];
    } else if (arg === "--port" && i + 1 < args.length) {
      port = Number.parseInt(args[++i], 10);
      if (!Number.isFinite(port) || port <= 0 || port > 65535) {
        console.error("Invalid port number");
        process.exit(1);
      }
    } else if (arg === "--token" && i + 1 < args.length) {
      authToken = args[++i];
    } else if (arg === "--config" && i + 1 < args.length) {
      configPath = args[++i];
    } else if (arg === "--help" || arg === "-h") {
      console.log(`
Usage: browser-server [options]

Options:
  --host <host>      Bind to host (default: ${DEFAULT_HOST})
  --port <port>      Bind to port (default: ${DEFAULT_PORT})
  --token <token>    Authentication token (Bearer)
  --config <path>    Path to config JSON file
  --help, -h         Show this help message

Example:
  browser-server --host 127.0.0.1 --port 18791 --token my-secret-token
`);
      process.exit(0);
    }
  }

  let resolved: ReturnType<typeof resolveBrowserConfig>;
  
  if (configPath) {
    const fs = await import("node:fs");
    const configJson = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    const browserConfig: BrowserConfig = configJson.browser || createDefaultBrowserConfig();
    resolved = resolveBrowserConfig(browserConfig);
  } else {
    resolved = resolveBrowserConfig(createDefaultBrowserConfig());
  }

  console.log(`Starting browser control server on http://${host}:${port}/`);
  if (authToken) {
    console.log("Authentication enabled (Bearer token)");
  }

  const bridge = await startBrowserBridgeServer({
    resolved,
    host,
    port,
    authToken,
  });

  console.log(`Browser control server listening on ${bridge.baseUrl}/`);
  console.log(`API tester UI available at ${bridge.baseUrl}/`);
  console.log(`API endpoints available at ${bridge.baseUrl}/*`);

  // Graceful shutdown
  const shutdown = async () => {
    console.log("\nShutting down browser control server...");
    await stopBrowserBridgeServer(bridge.server);
    
    // Stop all running browsers
    for (const [name, profileState] of bridge.state.profiles) {
      if (profileState.running) {
        const { stopClawdChrome } = await import("./chrome.js");
        await stopClawdChrome(profileState.running).catch(() => {});
      }
    }
    
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error("Failed to start browser server:", err);
  process.exit(1);
});
