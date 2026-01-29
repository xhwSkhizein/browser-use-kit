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

import type { BrowserActionPathResult, BrowserActionTargetOk } from "./client-actions-types.js";
import { fetchBrowserJson } from "./client-fetch.js";
import type {
  BrowserConsoleMessage,
  BrowserNetworkRequest,
  BrowserPageError,
} from "./pw-session.js";

function buildProfileQuery(profile?: string): string {
  return profile ? `?profile=${encodeURIComponent(profile)}` : "";
}

export async function browserConsoleMessages(
  baseUrl: string,
  opts: { level?: string; targetId?: string; profile?: string } = {},
): Promise<{ ok: true; messages: BrowserConsoleMessage[]; targetId: string }> {
  const q = new URLSearchParams();
  if (opts.level) q.set("level", opts.level);
  if (opts.targetId) q.set("targetId", opts.targetId);
  if (opts.profile) q.set("profile", opts.profile);
  const suffix = q.toString() ? `?${q.toString()}` : "";
  return await fetchBrowserJson<{
    ok: true;
    messages: BrowserConsoleMessage[];
    targetId: string;
  }>(`${baseUrl}/console${suffix}`, { timeoutMs: 20000 });
}

export async function browserPdfSave(
  baseUrl: string,
  opts: { targetId?: string; profile?: string } = {},
): Promise<BrowserActionPathResult> {
  const q = buildProfileQuery(opts.profile);
  return await fetchBrowserJson<BrowserActionPathResult>(`${baseUrl}/pdf${q}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ targetId: opts.targetId }),
    timeoutMs: 20000,
  });
}

export async function browserPageErrors(
  baseUrl: string,
  opts: { targetId?: string; clear?: boolean; profile?: string } = {},
): Promise<{ ok: true; targetId: string; errors: BrowserPageError[] }> {
  const q = new URLSearchParams();
  if (opts.targetId) q.set("targetId", opts.targetId);
  if (typeof opts.clear === "boolean") q.set("clear", String(opts.clear));
  if (opts.profile) q.set("profile", opts.profile);
  const suffix = q.toString() ? `?${q.toString()}` : "";
  return await fetchBrowserJson<{
    ok: true;
    targetId: string;
    errors: BrowserPageError[];
  }>(`${baseUrl}/errors${suffix}`, { timeoutMs: 20000 });
}

export async function browserRequests(
  baseUrl: string,
  opts: {
    targetId?: string;
    filter?: string;
    clear?: boolean;
    profile?: string;
  } = {},
): Promise<{ ok: true; targetId: string; requests: BrowserNetworkRequest[] }> {
  const q = new URLSearchParams();
  if (opts.targetId) q.set("targetId", opts.targetId);
  if (opts.filter) q.set("filter", opts.filter);
  if (typeof opts.clear === "boolean") q.set("clear", String(opts.clear));
  if (opts.profile) q.set("profile", opts.profile);
  const suffix = q.toString() ? `?${q.toString()}` : "";
  return await fetchBrowserJson<{
    ok: true;
    targetId: string;
    requests: BrowserNetworkRequest[];
  }>(`${baseUrl}/requests${suffix}`, { timeoutMs: 20000 });
}

export async function browserTraceStart(
  baseUrl: string,
  opts: {
    targetId?: string;
    screenshots?: boolean;
    snapshots?: boolean;
    sources?: boolean;
    profile?: string;
  } = {},
): Promise<BrowserActionTargetOk> {
  const q = buildProfileQuery(opts.profile);
  return await fetchBrowserJson<BrowserActionTargetOk>(`${baseUrl}/trace/start${q}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      targetId: opts.targetId,
      screenshots: opts.screenshots,
      snapshots: opts.snapshots,
      sources: opts.sources,
    }),
    timeoutMs: 20000,
  });
}

export async function browserTraceStop(
  baseUrl: string,
  opts: { targetId?: string; path?: string; profile?: string } = {},
): Promise<BrowserActionPathResult> {
  const q = buildProfileQuery(opts.profile);
  return await fetchBrowserJson<BrowserActionPathResult>(`${baseUrl}/trace/stop${q}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ targetId: opts.targetId, path: opts.path }),
    timeoutMs: 20000,
  });
}

export async function browserHighlight(
  baseUrl: string,
  opts: { ref: string; targetId?: string; profile?: string },
): Promise<BrowserActionTargetOk> {
  const q = buildProfileQuery(opts.profile);
  return await fetchBrowserJson<BrowserActionTargetOk>(`${baseUrl}/highlight${q}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ targetId: opts.targetId, ref: opts.ref }),
    timeoutMs: 20000,
  });
}

export async function browserResponseBody(
  baseUrl: string,
  opts: {
    url: string;
    targetId?: string;
    timeoutMs?: number;
    maxChars?: number;
    profile?: string;
  },
): Promise<{
  ok: true;
  targetId: string;
  response: {
    url: string;
    status?: number;
    headers?: Record<string, string>;
    body: string;
    truncated?: boolean;
  };
}> {
  const q = buildProfileQuery(opts.profile);
  return await fetchBrowserJson<{
    ok: true;
    targetId: string;
    response: {
      url: string;
      status?: number;
      headers?: Record<string, string>;
      body: string;
      truncated?: boolean;
    };
  }>(`${baseUrl}/response/body${q}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      targetId: opts.targetId,
      url: opts.url,
      timeoutMs: opts.timeoutMs,
      maxChars: opts.maxChars,
    }),
    timeoutMs: 20000,
  });
}
