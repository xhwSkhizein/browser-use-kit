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

import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const LICENSE_HEADER = `/*
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
*/\n\n`;

const LICENSE_MARKER = "# MIT License";
const EXCLUDED_DIRECTORIES = new Set([
  ".git",
  "node_modules",
  "dist",
  "public",
  "skills"
]);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..", "");

async function collectTypeScriptFiles(dir: string, bucket: string[]): Promise<void> {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (EXCLUDED_DIRECTORIES.has(entry.name)) {
        continue;
      }

      await collectTypeScriptFiles(entryPath, bucket);
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    if (!entry.name.endsWith(".ts") || entry.name.endsWith(".d.ts")) {
      continue;
    }

    bucket.push(entryPath);
  }
}

function needsLicenseHeader(content: string): boolean {
  const trimmed = content.trimStart();
  return !trimmed.startsWith(LICENSE_MARKER);
}

async function prependLicense(filePath: string): Promise<boolean> {
  const content = await fs.readFile(filePath, "utf8");

  if (!needsLicenseHeader(content)) {
    return false;
  }

  await fs.writeFile(filePath, `${LICENSE_HEADER}${content}`);
  return true;
}

async function main(): Promise<void> {
  const tsFiles: string[] = [];
  await collectTypeScriptFiles(projectRoot, tsFiles);

  let updated = 0;
  for (const filePath of tsFiles) {
    const changed = await prependLicense(filePath);
    if (changed) {
      updated += 1;
      console.log(`Added license header to ${path.relative(projectRoot, filePath)}`);
    }
  }

  console.log(`Processed ${tsFiles.length} TypeScript files. Updated ${updated} files.`);
}

main().catch((error) => {
  console.error("Failed to add license headers:", error);
  process.exitCode = 1;
});
