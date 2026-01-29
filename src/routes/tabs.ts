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

import type express from "express";

import type { BrowserRouteContext } from "../server-context.js";
import { getProfileContext, jsonError, toNumber, toStringOrEmpty } from "./utils.js";

export function registerBrowserTabRoutes(app: express.Express, ctx: BrowserRouteContext) {
  app.get("/tabs", async (req, res) => {
    const profileCtx = getProfileContext(req, ctx);
    if ("error" in profileCtx) return jsonError(res, profileCtx.status, profileCtx.error);
    try {
      const reachable = await profileCtx.isReachable(300);
      if (!reachable) return res.json({ running: false, tabs: [] as unknown[] });
      const tabs = await profileCtx.listTabs();
      res.json({ running: true, tabs });
    } catch (err) {
      jsonError(res, 500, String(err));
    }
  });

  app.post("/tabs/open", async (req, res) => {
    const profileCtx = getProfileContext(req, ctx);
    if ("error" in profileCtx) return jsonError(res, profileCtx.status, profileCtx.error);
    const url = toStringOrEmpty((req.body as { url?: unknown })?.url);
    if (!url) return jsonError(res, 400, "url is required");
    try {
      await profileCtx.ensureBrowserAvailable();
      const tab = await profileCtx.openTab(url);
      res.json(tab);
    } catch (err) {
      jsonError(res, 500, String(err));
    }
  });

  app.post("/tabs/focus", async (req, res) => {
    const profileCtx = getProfileContext(req, ctx);
    if ("error" in profileCtx) return jsonError(res, profileCtx.status, profileCtx.error);
    const targetId = toStringOrEmpty((req.body as { targetId?: unknown })?.targetId);
    if (!targetId) return jsonError(res, 400, "targetId is required");
    try {
      if (!(await profileCtx.isReachable(300))) return jsonError(res, 409, "browser not running");
      await profileCtx.focusTab(targetId);
      res.json({ ok: true });
    } catch (err) {
      const mapped = ctx.mapTabError(err);
      if (mapped) return jsonError(res, mapped.status, mapped.message);
      jsonError(res, 500, String(err));
    }
  });

  app.delete("/tabs/:targetId", async (req, res) => {
    const profileCtx = getProfileContext(req, ctx);
    if ("error" in profileCtx) return jsonError(res, profileCtx.status, profileCtx.error);
    const targetId = toStringOrEmpty(req.params.targetId);
    if (!targetId) return jsonError(res, 400, "targetId is required");
    try {
      if (!(await profileCtx.isReachable(300))) return jsonError(res, 409, "browser not running");
      await profileCtx.closeTab(targetId);
      res.json({ ok: true });
    } catch (err) {
      const mapped = ctx.mapTabError(err);
      if (mapped) return jsonError(res, mapped.status, mapped.message);
      jsonError(res, 500, String(err));
    }
  });

  app.post("/tabs/action", async (req, res) => {
    const profileCtx = getProfileContext(req, ctx);
    if ("error" in profileCtx) return jsonError(res, profileCtx.status, profileCtx.error);
    const action = toStringOrEmpty((req.body as { action?: unknown })?.action);
    const index = toNumber((req.body as { index?: unknown })?.index);
    try {
      if (action === "list") {
        const reachable = await profileCtx.isReachable(300);
        if (!reachable) return res.json({ ok: true, tabs: [] as unknown[] });
        const tabs = await profileCtx.listTabs();
        return res.json({ ok: true, tabs });
      }

      if (action === "new") {
        await profileCtx.ensureBrowserAvailable();
        const tab = await profileCtx.openTab("about:blank");
        return res.json({ ok: true, tab });
      }

      if (action === "close") {
        const tabs = await profileCtx.listTabs();
        const target = typeof index === "number" ? tabs[index] : tabs.at(0);
        if (!target) return jsonError(res, 404, "tab not found");
        await profileCtx.closeTab(target.targetId);
        return res.json({ ok: true, targetId: target.targetId });
      }

      if (action === "select") {
        if (typeof index !== "number") return jsonError(res, 400, "index is required");
        const tabs = await profileCtx.listTabs();
        const target = tabs[index];
        if (!target) return jsonError(res, 404, "tab not found");
        await profileCtx.focusTab(target.targetId);
        return res.json({ ok: true, targetId: target.targetId });
      }

      return jsonError(res, 400, "unknown tab action");
    } catch (err) {
      const mapped = ctx.mapTabError(err);
      if (mapped) return jsonError(res, mapped.status, mapped.message);
      jsonError(res, 500, String(err));
    }
  });
}
