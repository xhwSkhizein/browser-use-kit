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

import { ensurePageState, getPageForTargetId } from "./pw-session.js";

export async function cookiesGetViaPlaywright(opts: {
  cdpUrl: string;
  targetId?: string;
}): Promise<{ cookies: unknown[] }> {
  const page = await getPageForTargetId(opts);
  ensurePageState(page);
  const cookies = await page.context().cookies();
  return { cookies };
}

export async function cookiesSetViaPlaywright(opts: {
  cdpUrl: string;
  targetId?: string;
  cookie: {
    name: string;
    value: string;
    url?: string;
    domain?: string;
    path?: string;
    expires?: number;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: "Lax" | "None" | "Strict";
  };
}): Promise<void> {
  const page = await getPageForTargetId(opts);
  ensurePageState(page);
  const cookie = opts.cookie;
  if (!cookie.name || cookie.value === undefined) {
    throw new Error("cookie name and value are required");
  }
  const hasUrl = typeof cookie.url === "string" && cookie.url.trim();
  const hasDomainPath =
    typeof cookie.domain === "string" &&
    cookie.domain.trim() &&
    typeof cookie.path === "string" &&
    cookie.path.trim();
  if (!hasUrl && !hasDomainPath) {
    throw new Error("cookie requires url, or domain+path");
  }
  await page.context().addCookies([cookie]);
}

export async function cookiesClearViaPlaywright(opts: {
  cdpUrl: string;
  targetId?: string;
}): Promise<void> {
  const page = await getPageForTargetId(opts);
  ensurePageState(page);
  await page.context().clearCookies();
}

type StorageKind = "local" | "session";

export async function storageGetViaPlaywright(opts: {
  cdpUrl: string;
  targetId?: string;
  kind: StorageKind;
  key?: string;
}): Promise<{ values: Record<string, string> }> {
  const page = await getPageForTargetId(opts);
  ensurePageState(page);
  const kind = opts.kind;
  const key = typeof opts.key === "string" ? opts.key : undefined;
  const values = await page.evaluate(
    ({ kind: kind2, key: key2 }) => {
      const store = kind2 === "session" ? window.sessionStorage : window.localStorage;
      if (key2) {
        const value = store.getItem(key2);
        return value === null ? {} : { [key2]: value };
      }
      const out: Record<string, string> = {};
      for (let i = 0; i < store.length; i += 1) {
        const k = store.key(i);
        if (!k) continue;
        const v = store.getItem(k);
        if (v !== null) out[k] = v;
      }
      return out;
    },
    { kind, key },
  );
  return { values: values ?? {} };
}

export async function storageSetViaPlaywright(opts: {
  cdpUrl: string;
  targetId?: string;
  kind: StorageKind;
  key: string;
  value: string;
}): Promise<void> {
  const page = await getPageForTargetId(opts);
  ensurePageState(page);
  const key = String(opts.key ?? "");
  if (!key) throw new Error("key is required");
  await page.evaluate(
    ({ kind, key: k, value }) => {
      const store = kind === "session" ? window.sessionStorage : window.localStorage;
      store.setItem(k, value);
    },
    { kind: opts.kind, key, value: String(opts.value ?? "") },
  );
}

export async function storageClearViaPlaywright(opts: {
  cdpUrl: string;
  targetId?: string;
  kind: StorageKind;
}): Promise<void> {
  const page = await getPageForTargetId(opts);
  ensurePageState(page);
  await page.evaluate(
    ({ kind }) => {
      const store = kind === "session" ? window.sessionStorage : window.localStorage;
      store.clear();
    },
    { kind: opts.kind },
  );
}
