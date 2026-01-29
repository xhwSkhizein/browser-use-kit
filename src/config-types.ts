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

/**
 * Browser configuration types (standalone)
 */

export type BrowserConfig = {
  enabled?: boolean;
  controlUrl?: string;
  controlToken?: string;
  cdpUrl?: string;
  remoteCdpTimeoutMs?: number;
  remoteCdpHandshakeTimeoutMs?: number;
  defaultProfile?: string;
  color?: string;
  executablePath?: string;
  headless?: boolean;
  noSandbox?: boolean;
  attachOnly?: boolean;
  profiles?: Record<string, BrowserProfileConfig>;
};

export type BrowserProfileConfig = {
  cdpPort?: number;
  cdpUrl?: string;
  color?: string;
  driver?: "clawd" | "extension";
};

export function createDefaultBrowserConfig(): BrowserConfig {
  return {
    enabled: true,
    controlUrl: "http://127.0.0.1:18791",
    headless: false,
    noSandbox: false,
    attachOnly: false,
    defaultProfile: "clawd",
    color: "#FF4500",
    profiles: {
      clawd: {
        cdpPort: 18800,
        color: "#FF4500",
      },
    },
  };
}
