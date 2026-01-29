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

import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { ResolvedBrowserConfig } from "./config.js";
import { registerBrowserRoutes } from "./routes/index.js";
import {
  type BrowserServerState,
  createBrowserRouteContext,
  type ProfileContext,
} from "./server-context.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export type BrowserBridge = {
  server: Server;
  port: number;
  baseUrl: string;
  state: BrowserServerState;
};

export async function startBrowserBridgeServer(params: {
  resolved: ResolvedBrowserConfig;
  host?: string;
  port?: number;
  authToken?: string;
  onEnsureAttachTarget?: (profile: ProfileContext["profile"]) => Promise<void>;
}): Promise<BrowserBridge> {
  const host = params.host ?? "127.0.0.1";
  const port = params.port ?? 0;

  const app = express();
  
  // Serve static files from public directory (for API tester UI)
  // This must be before express.json() middleware
  const publicDir = path.join(__dirname, "..", "public");
  app.use(express.static(publicDir));
  
  app.use(express.json({ limit: "1mb" }));

  const authToken = params.authToken?.trim();
  if (authToken) {
    // Skip auth for static files and API tester UI
    app.use((req, res, next) => {
      // Allow access to static files without auth
      // Static files have file extensions or are root path
      const isStaticFile = req.path === "/" || 
                          req.path === "/index.html" ||
                          path.extname(req.path) !== "" ||
                          req.path.startsWith("/assets/") ||
                          req.path.startsWith("/css/") ||
                          req.path.startsWith("/js/");
      
      if (isStaticFile) {
        return next();
      }
      
      // Require auth for API endpoints
      const auth = String(req.headers.authorization ?? "").trim();
      if (auth === `Bearer ${authToken}`) return next();
      res.status(401).json({ error: "Unauthorized" });
    });
  }

  const state: BrowserServerState = {
    server: null as unknown as Server,
    port,
    resolved: params.resolved,
    profiles: new Map(),
  };

  const ctx = createBrowserRouteContext({
    getState: () => state,
    onEnsureAttachTarget: params.onEnsureAttachTarget,
  });
  
  // Register browser API routes
  registerBrowserRoutes(app, ctx);
  
  // Serve index.html for root path (fallback for SPA routing)
  app.get("/", (req, res, next) => {
    // Only serve index.html if it's not an API request
    if (req.path === "/" && !req.path.startsWith("/api")) {
      res.sendFile(path.join(publicDir, "index.html"));
    } else {
      next();
    }
  });

  const server = await new Promise<Server>((resolve, reject) => {
    const s = app.listen(port, host, () => resolve(s));
    s.once("error", reject);
  });

  const address = server.address() as AddressInfo | null;
  const resolvedPort = address?.port ?? port;
  state.server = server;
  state.port = resolvedPort;
  state.resolved.controlHost = host;
  state.resolved.controlPort = resolvedPort;
  state.resolved.controlUrl = `http://${host}:${resolvedPort}`;

  const baseUrl = state.resolved.controlUrl;
  return { server, port: resolvedPort, baseUrl, state };
}

export async function stopBrowserBridgeServer(server: Server): Promise<void> {
  await new Promise<void>((resolve) => {
    server.close(() => resolve());
  });
}
