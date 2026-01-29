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

import { extractErrorCode, formatErrorMessage } from "./utils.js";
import { formatCliCommand } from "./cli-command-format.js";

function getBrowserControlToken(): string | null {
  const env = process.env.BROWSER_CONTROL_TOKEN?.trim() || 
              process.env.CLAWDBOT_BROWSER_CONTROL_TOKEN?.trim();
  return env || null;
}

function unwrapCause(err: unknown): unknown {
  if (!err || typeof err !== "object") return null;
  const cause = (err as { cause?: unknown }).cause;
  return cause ?? null;
}

function enhanceBrowserFetchError(url: string, err: unknown, timeoutMs: number): Error {
  const cause = unwrapCause(err);
  const code = extractErrorCode(cause) ?? extractErrorCode(err) ?? "";

  const hint = `Start (or restart) the browser control server and try again.`;

  if (code === "ECONNREFUSED") {
    return new Error(
      `Can't reach the clawd browser control server at ${url} (connection refused). ${hint}`,
    );
  }
  if (code === "ETIMEDOUT" || code === "UND_ERR_CONNECT_TIMEOUT") {
    return new Error(
      `Can't reach the clawd browser control server at ${url} (timed out after ${timeoutMs}ms). ${hint}`,
    );
  }

  const msg = formatErrorMessage(err);
  if (msg.toLowerCase().includes("abort")) {
    return new Error(
      `Can't reach the clawd browser control server at ${url} (timed out after ${timeoutMs}ms). ${hint}`,
    );
  }

  return new Error(`Can't reach the clawd browser control server at ${url}. ${hint} (${msg})`);
}

export async function fetchBrowserJson<T>(
  url: string,
  init?: RequestInit & { timeoutMs?: number },
): Promise<T> {
  const timeoutMs = init?.timeoutMs ?? 5000;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  let res: Response;
  try {
    const token = getBrowserControlToken();
    const mergedHeaders = (() => {
      if (!token) return init?.headers;
      const h = new Headers(init?.headers ?? {});
      if (!h.has("Authorization")) {
        h.set("Authorization", `Bearer ${token}`);
      }
      return h;
    })();
    res = await fetch(url, {
      ...init,
      ...(mergedHeaders ? { headers: mergedHeaders } : {}),
      signal: ctrl.signal,
    } as RequestInit);
  } catch (err) {
    throw enhanceBrowserFetchError(url, err, timeoutMs);
  } finally {
    clearTimeout(t);
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text ? `${res.status}: ${text}` : `HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}
