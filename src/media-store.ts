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
 * Media storage utilities (standalone)
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";

export function ensureMediaDir(): string {
  const dir = path.join(os.homedir(), ".browser-control", "media");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export async function saveMediaBuffer(
  buffer: Buffer,
  mimeType: string | undefined,
  category: string,
  sizeBytes: number,
): Promise<{ path: string }> {
  const mediaDir = ensureMediaDir();
  const ext = mimeType?.includes("jpeg") || mimeType?.includes("jpg")
    ? "jpg"
    : mimeType?.includes("png")
      ? "png"
      : mimeType?.includes("pdf")
        ? "pdf"
        : "bin";
  
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const filePath = path.join(mediaDir, filename);
  
  fs.writeFileSync(filePath, buffer);
  
  return { path: filePath };
}
