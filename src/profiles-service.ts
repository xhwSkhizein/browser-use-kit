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

import fs from "node:fs";
import path from "node:path";

import type { BrowserProfileConfig, BrowserConfig } from "./config-types.js";
import { deriveDefaultBrowserCdpPortRange } from "./config-port-defaults.js";
import { DEFAULT_BROWSER_DEFAULT_PROFILE_NAME } from "./constants.js";
import { resolveClawdUserDataDir } from "./chrome.js";
import { parseHttpUrl, resolveProfile } from "./config.js";
import {
  allocateCdpPort,
  allocateColor,
  getUsedColors,
  getUsedPorts,
  isValidProfileName,
} from "./profiles.js";
import type { BrowserRouteContext, ProfileStatus } from "./server-context.js";
import { movePathToTrash } from "./trash.js";

export type CreateProfileParams = {
  name: string;
  color?: string;
  cdpUrl?: string;
  driver?: "clawd" | "extension";
};

export type CreateProfileResult = {
  ok: true;
  profile: string;
  cdpPort: number;
  cdpUrl: string;
  color: string;
  isRemote: boolean;
};

export type DeleteProfileResult = {
  ok: true;
  profile: string;
  deleted: boolean;
};

const HEX_COLOR_RE = /^#[0-9A-Fa-f]{6}$/;

export function createBrowserProfilesService(ctx: BrowserRouteContext) {
  const listProfiles = async (): Promise<ProfileStatus[]> => {
    return await ctx.listProfiles();
  };

  const createProfile = async (params: CreateProfileParams): Promise<CreateProfileResult> => {
    const name = params.name.trim();
    const rawCdpUrl = params.cdpUrl?.trim() || undefined;
    const driver = params.driver === "extension" ? "extension" : undefined;

    if (!isValidProfileName(name)) {
      throw new Error("invalid profile name: use lowercase letters, numbers, and hyphens only");
    }

    const state = ctx.state();
    const resolvedProfiles = state.resolved.profiles;
    if (name in resolvedProfiles) {
      throw new Error(`profile "${name}" already exists`);
    }

    // In standalone mode, profiles are managed in-memory
    // No persistent config file needed

    const usedColors = getUsedColors(resolvedProfiles);
    const profileColor =
      params.color && HEX_COLOR_RE.test(params.color) ? params.color : allocateColor(usedColors);

    let profileConfig: BrowserProfileConfig;
    if (rawCdpUrl) {
      const parsed = parseHttpUrl(rawCdpUrl, "browser.profiles.cdpUrl");
      profileConfig = {
        cdpUrl: parsed.normalized,
        ...(driver ? { driver } : {}),
        color: profileColor,
      };
    } else {
      const usedPorts = getUsedPorts(resolvedProfiles);
      const range = deriveDefaultBrowserCdpPortRange(state.resolved.controlPort);
      const cdpPort = allocateCdpPort(usedPorts, range);
      if (cdpPort === null) {
        throw new Error("no available CDP ports in range");
      }
      profileConfig = {
        cdpPort,
        ...(driver ? { driver } : {}),
        color: profileColor,
      };
    }

    // In standalone mode, profiles are managed in-memory only
    state.resolved.profiles[name] = profileConfig;
    const resolved = resolveProfile(state.resolved, name);
    if (!resolved) {
      throw new Error(`profile "${name}" not found after creation`);
    }

    return {
      ok: true,
      profile: name,
      cdpPort: resolved.cdpPort,
      cdpUrl: resolved.cdpUrl,
      color: resolved.color,
      isRemote: !resolved.cdpIsLoopback,
    };
  };

  const deleteProfile = async (nameRaw: string): Promise<DeleteProfileResult> => {
    const name = nameRaw.trim();
    if (!name) throw new Error("profile name is required");
    if (!isValidProfileName(name)) {
      throw new Error("invalid profile name");
    }

    const state = ctx.state();
    const profiles = state.resolved.profiles;
    if (!(name in profiles)) {
      throw new Error(`profile "${name}" not found`);
    }

    const defaultProfile = state.resolved.defaultProfile;
    if (name === defaultProfile) {
      throw new Error(
        `cannot delete the default profile "${name}"; change browser.defaultProfile first`,
      );
    }

    let deleted = false;
    const resolved = resolveProfile(state.resolved, name);

    if (resolved?.cdpIsLoopback) {
      try {
        await ctx.forProfile(name).stopRunningBrowser();
      } catch {
        // ignore
      }

      const userDataDir = resolveClawdUserDataDir(name);
      const profileDir = path.dirname(userDataDir);
      if (fs.existsSync(profileDir)) {
        await movePathToTrash(profileDir);
        deleted = true;
      }
    }

    // In standalone mode, profiles are managed in-memory only
    delete state.resolved.profiles[name];
    state.profiles.delete(name);

    return { ok: true, profile: name, deleted };
  };

  return {
    listProfiles,
    createProfile,
    deleteProfile,
  };
}
