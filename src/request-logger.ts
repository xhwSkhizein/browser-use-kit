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

import path from "node:path";

import type express from "express";

const MAX_DEPTH = 5;
const MAX_KEYS = 40;
const MAX_ITEMS = 40;
const MAX_STRING = 1500;

let nextRequestId = 0;

function isSensitiveKey(key: string): boolean {
  return /authorization|token|password|secret|cookie|set-cookie/i.test(key);
}

function summarizeForLog(
  value: unknown,
  depth: number,
  seen: WeakSet<object>,
  keyHint?: string,
): unknown {
  if (isSensitiveKey(keyHint ?? "")) return "***";
  if (value === null || value === undefined) return value;
  if (typeof value === "string") {
    if (value.length <= MAX_STRING) return value;
    return `${value.slice(0, MAX_STRING)}... [truncated ${value.length - MAX_STRING} chars]`;
  }
  if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") {
    return value;
  }
  if (typeof value === "function") return "[Function]";
  if (Buffer.isBuffer(value)) return `[Buffer ${value.byteLength} bytes]`;
  if (value instanceof Date) return value.toISOString();
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: typeof value.stack === "string" ? value.stack.split("\n").slice(0, 8).join("\n") : "",
    };
  }

  if (depth >= MAX_DEPTH) return "[MaxDepth]";
  if (Array.isArray(value)) {
    const out = value.slice(0, MAX_ITEMS).map((v) => summarizeForLog(v, depth + 1, seen));
    if (value.length > MAX_ITEMS) out.push(`[+${value.length - MAX_ITEMS} items]`);
    return out;
  }

  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if (seen.has(obj)) return "[Circular]";
    seen.add(obj);
    const keys = Object.keys(obj);
    const out: Record<string, unknown> = {};
    for (const key of keys.slice(0, MAX_KEYS)) {
      out[key] = summarizeForLog(obj[key], depth + 1, seen, key);
    }
    if (keys.length > MAX_KEYS) out.__truncatedKeys = keys.length - MAX_KEYS;
    return out;
  }

  return String(value);
}

function toLogJson(value: unknown): string {
  const summarized = summarizeForLog(value, 0, new WeakSet<object>());
  try {
    return JSON.stringify(summarized);
  } catch {
    return JSON.stringify({ value: "[Unserializable]" });
  }
}

function isStaticRequest(req: express.Request): boolean {
  const p = req.path || "/";
  if (p === "/index.html") return true;
  if (p.startsWith("/assets/") || p.startsWith("/css/") || p.startsWith("/js/")) return true;
  return path.extname(p) !== "";
}

function isSuccessResponse(statusCode: number, responseBody: unknown): boolean {
  if (statusCode >= 400) return false;
  if (responseBody && typeof responseBody === "object") {
    const rec = responseBody as Record<string, unknown>;
    if (rec.ok === false) return false;
    if (typeof rec.error === "string" && rec.error.trim()) return false;
  }
  return true;
}

function extractErrorMessage(statusCode: number, responseBody: unknown): string | undefined {
  if (responseBody && typeof responseBody === "object") {
    const rec = responseBody as Record<string, unknown>;
    if (typeof rec.error === "string" && rec.error.trim()) return rec.error;
    if (typeof rec.message === "string" && rec.message.trim()) return rec.message;
  }
  if (statusCode >= 400) return `HTTP ${statusCode}`;
  return undefined;
}

function nowMs() {
  return Number(process.hrtime.bigint()) / 1_000_000;
}

export function registerApiRequestLogger(app: express.Express): void {
  app.use((req, res, next) => {
    if (isStaticRequest(req)) return next();

    const requestId = ++nextRequestId;
    const start = nowMs();
    let responseBody: unknown;

    const originalJson = res.json.bind(res);
    res.json = ((body: unknown) => {
      responseBody = body;
      return originalJson(body);
    }) as typeof res.json;

    const input = {
      requestId,
      method: req.method,
      endpoint: req.path,
      url: req.originalUrl,
      query: req.query,
      body: req.body,
    };
    console.log(`[browser:api] request ${toLogJson(input)}`);

    res.once("finish", () => {
      const durationMs = Number((nowMs() - start).toFixed(1));
      const success = isSuccessResponse(res.statusCode, responseBody);
      const error = success ? undefined : extractErrorMessage(res.statusCode, responseBody);
      const summary = {
        requestId,
        method: req.method,
        endpoint: req.path,
        statusCode: res.statusCode,
        durationMs,
        success,
        ...(req.params && Object.keys(req.params).length ? { params: req.params } : {}),
        ...(error ? { error } : {}),
      };
      const line = `[browser:api] response ${toLogJson(summary)}`;
      if (success) {
        console.log(line);
      } else {
        console.error(line);
      }
    });

    next();
  });
}

export function registerApiErrorHandler(app: express.Express): void {
  app.use(
    (
      err: unknown,
      req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ): void => {
      if (isStaticRequest(req)) {
        console.error(
          `[browser:api] unhandled ${toLogJson({
            method: req.method,
            endpoint: req.path,
            error: err,
          })}`,
        );
        if (!res.headersSent) res.status(500).send("Internal Server Error");
        return;
      }

      const message = err instanceof Error ? err.message : String(err);
      const stack = err instanceof Error ? err.stack : undefined;
      console.error(
        `[browser:api] unhandled ${toLogJson({
          method: req.method,
          endpoint: req.path,
          url: req.originalUrl,
          error: message,
          stack,
        })}`,
      );

      if (res.headersSent) return;
      res.status(500).json({ error: message || "Internal Server Error" });
    },
  );
}

