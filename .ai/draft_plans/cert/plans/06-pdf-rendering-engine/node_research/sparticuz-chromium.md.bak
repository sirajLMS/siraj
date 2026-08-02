# @sparticuz/chromium v149.0.0 — Node Module Research

## Package Overview

**Package**: `@sparticuz/chromium` v149.0.0
**Description**: "Chromium Binary for Serverless Platforms"
**License**: MIT
**Author**: Kyle McNally (Sparticuz)
**Repository**: https://github.com/Sparticuz/chromium
**Forked from**: `alixaxel/chrome-aws-lambda` (which itself was forked from `alixaxel/chrome-aws-lambda`)

This package provides a pre-compiled Chromium binary (specifically `chrome-headless-shell`) compressed with Brotli, designed to run in serverless environments (AWS Lambda, Vercel Functions, Netlify, etc.). It includes decompression utilities and a predefined set of Chrome flags optimized for serverless.

**Key design principle**: The package is NOT tied to specific `puppeteer` versions. It provides only the Chromium binary, decompression code, and recommended args — no puppeteer hooks or overrides.

### Versioning Schema

```
MajorChromiumVersion.MinorChromiumIncrement.@Sparticuz/chromiumPatchLevel
```

This package follows Chromium's release cycle — **NOT semantic versioning**. Breaking changes may occur at the "patch" level.

### Node.js Engine Requirement

```json
"engines": {
    "node": "^22.17.0 || >=24.0.0"
}
```

Requires Node.js 22.17+ or Node.js 24+. This is important for Vercel function configuration (`nodeVersion` must be 22`).

### Package Type

- **ESM-only** (`"type": "module"`)
- Default export: `Chromium` class
- Named exports: `setupLambdaEnvironment`, `inflate`

## Installation & Size

```shell
npm install --save puppeteer-core@$PUPPETEER_VERSION
npm install --save @sparticuz/chromium@$CHROMIUM_VERSION  # production dep (not dev, unless using a Lambda Layer)
```

### Package Size

| Component | Size |
|-----------|------|
| **Total package** | **67 MB** |
| `bin/chromium.br` | 62 MB (Brotli-compressed Chromium binary) |
| `bin/swiftshader.tar.br` | 3.5 MB (SwiftShader/ANGLE for WebGL) |
| `bin/al2023.tar.br` | 1.1 MB (Amazon Linux 2023 shared libs) |
| `bin/fonts.tar.br` | 180 KB (Open Sans font files + fonts.conf) |
| `build/` (JS code) | ~17 KB |

### Dependency

Only one runtime dependency:
- `tar-fs` (^3.1.2) — for tar extraction during decompression

### Binary Files in `bin/`

```
bin/
├── al2023.tar.br       — Amazon Linux 2023 shared libraries (extracted when running on AL2023-based runtimes)
├── chromium.br         — The main Chromium headless-shell binary (Brotli-compressed, 62 MB)
├── fonts.tar.br        — Built-in fonts archive (Open Sans only — see Font Handling section)
└── swiftshader.tar.br  — SwiftShader/ANGLE Vulkan libraries for CPU-based WebGL
```

## TypeScript Types & Interfaces

### Main Export: `Chromium` Class

**File**: `build/index.d.ts`

```typescript
declare class Chromium {
    /**
     * Returns a list of additional Chromium flags recommended for serverless environments.
     */
    static get args(): string[];

    /**
     * Returns whether the graphics stack is enabled or disabled.
     */
    static get graphics(): boolean;

    /**
     * Sets whether the graphics stack is enabled or disabled.
     * @param true means the stack is enabled. WebGL will work.
     * @param false means that the stack is disabled. WebGL will not work.
     * @default true
     */
    static set setGraphicsMode(value: boolean);

    /**
     * Inflates the included version of Chromium.
     * @param input The location of the `bin` folder (or a URL to a remote pack).
     * @returns The path to the `chromium` binary.
     */
    static executablePath(input?: string): Promise<string>;
}
export { setupLambdaEnvironment } from "./helper.js";
export { inflate } from "./lambdafs.js";
export default Chromium;
```

### Named Export: `setupLambdaEnvironment`

```typescript
export declare function setupLambdaEnvironment(baseLibPath: string): void;
```

Sets up environment variables for Lambda runtime:
- `FONTCONFIG_PATH` → `/tmp/fonts` (if not already set)
- `HOME` → `/tmp` (if not already set)
- `LD_LIBRARY_PATH` — prepends the base lib path

### Named Export: `inflate`

```typescript
export declare function inflate(filePath: string): Promise<string>;
```

Decompresses a Brotli or Gzip compressed tar file and returns the path to the decompressed file/folder.

### Named Export: `isRunningInAmazonLinux2023`

```typescript
export declare function isRunningInAmazonLinux2023(nodeMajorVersion: number): boolean;
```

Detects AL2023-based environments: AWS Lambda, Netlify, CodeBuild, **and Vercel** (Node 20+).

### IMPORTANT: What's NOT in v149

The following APIs from the **old `chrome-aws-lambda`** package do **NOT exist** in `@sparticuz/chromium` v149:

| Old API | Status in v149 |
|---------|----------------|
| `chromium.fonts` | ❌ **Does not exist** |
| `chromium.fonts.put(fontFiles)` | ❌ **Does not exist** |
| `chromium.headless` property | ❌ **Does not exist** — headless mode is hardcoded to `"shell"` via args |
| `chromium.setHeadlessMode()` | ❌ **Does not exist** |
| `chromium.getNewHeadlessMode()` | ❌ **Does not exist** |
| `HeadlessShellMode` type | ❌ **Does not exist** |
| `Interface` type | ❌ **Does not exist** |
| `FontFiles` type (`{ [path: string]: string }`) | ❌ **Does not exist** |

The v149 API surface is **minimal**: only `args`, `graphics`/`setGraphicsMode`, and `executablePath()`.

## Core API

### `chromium.args` — Serverless Chrome Flags

**Type**: `static get args(): string[]`

Returns a curated array of Chrome command-line flags optimized for serverless. This is the **complete** list from the v149 source code:

```javascript
// Core serverless flags
"--ash-no-nudges",                    // Disables "user education" nudges
"--disable-domain-reliability",       // Disables Google monitoring
"--disable-print-preview",            // Disable print preview dialog
"--disk-cache-size=33554432",        // 32MB disk cache limit
"--no-default-browser-check",        // Don't prompt to set default browser
"--no-pings",                        // Don't send hyperlink audit pings
"--single-process",                  // REQUIRED: avoids prctl(PR_SET_NO_NEW_PRIVS) error
"--font-render-hinting=none",        // Better font rendering in headless

// Disabled features (combined into --disable-features=)
"--disable-features=AudioServiceOutOfProcess,IsolateOrigins,site-per-process",

// Enabled features (combined into --enable-features=)
"--enable-features=SharedArrayBuffer",

// Graphics flags (when graphics=true, the default)
"--ignore-gpu-blocklist",
"--in-process-gpu",                   // Saves memory by merging GPU process
"--use-gl=angle",
"--use-angle=swiftshader",
"--enable-unsafe-swiftshader",

// OR when graphics=false:
"--disable-webgl",

// Insecure/sandbox flags
"--allow-running-insecure-content",
"--disable-setuid-sandbox",           // Required since Lambda runs as root
"--disable-site-isolation-trials",
"--disable-web-security",

// Headless flags
"--headless='shell'",                 // Only supports chrome-headless-shell mode
"--no-sandbox",
"--no-zygote",
```

### `chromium.graphics` / `chromium.setGraphicsMode`

**Type**: `static get graphics(): boolean` / `static set setGraphicsMode(value: boolean)`

- Default: `true` (WebGL enabled via SwiftShader/ANGLE)
- Set to `false` to disable WebGL (the `swiftshader.tar.br` file will not be extracted, saving time)
- When `false`, `--disable-webgl` is added instead of the swiftshader flags
- Must be set **before** calling `executablePath()`

```typescript
// Disable WebGL (recommended for PDF-only use cases to save cold start time)
chromium.setGraphicsMode = false;
```

### `chromium.executablePath(input?)`

**Type**: `static async executablePath(input?: string): Promise<string>`

Returns the path to the extracted Chromium binary. The path is cached in `/tmp/chromium` — subsequent calls return immediately.

**Parameters**:
- `input` (optional): Path to a directory containing the Brotli files, OR a URL to a remote `.tar` pack file
- If omitted, uses the built-in `bin/` directory (via `getBinPath()`)

**Extraction process**:
1. If `/tmp/chromium` already exists → return it immediately (warm start cache)
2. If `input` is a URL → download and extract the tar to `/tmp/chromium-pack`, then recursively call `executablePath("/tmp/chromium-pack")`
3. If `input` is a directory path → use it directly
4. If `input` is omitted → use `getBinPath()` (resolves to `node_modules/@sparticuz/chromium/bin`)
5. Inflate (decompress) these files in parallel:
   - `chromium.br` → `/tmp/chromium` (the binary)
   - `fonts.tar.br` → `/tmp/fonts` (Open Sans + fonts.conf)
   - `swiftshader.tar.br` → `/tmp/` (SwiftShader libraries, only if graphics=true)
   - `al2023.tar.br` → `/tmp/al2023` (only if running on Amazon Linux 2023)
6. Return the path to `/tmp/chromium`

**Error on bundling failure**:
```
The input directory "/var/task/bin" does not exist. If you are using a bundler (esbuild, webpack, etc.), you must externalize @sparticuz/chromium so it is not relocated.
```

## Font Handling (CRITICAL for Arabic)

### Built-in Fonts: Open Sans ONLY

**CRITICAL FINDING**: The package ships with **only Open Sans** fonts — specifically:
- `OpenSans-Regular.ttf` (147 KB)
- `OpenSans-Bold.ttf` (147 KB)
- `OpenSans-Italic.ttf` (153 KB)

Open Sans supports: **Latin, Greek, Cyrillic** scripts only.

**There is NO Arabic font support out of the box.** If you render Arabic text without bundling additional fonts, you will see:
- Fallback to a default system font that likely doesn't have Arabic glyphs
- Empty boxes/tofu characters (□□□) for Arabic text
- Missing or broken text shaping (RTL, ligatures, kashida)

### Font Configuration: `fonts.conf`

The `fonts.tar.br` archive includes a `fonts.conf` file that configures fontconfig paths:

```xml
<?xml version="1.0" ?>
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig>
  <dir>/var/task/.fonts</dir>
  <dir>/var/task/fonts</dir>
  <dir>/opt/fonts</dir>
  <dir>/tmp/fonts</dir>
  <cachedir>/tmp/fonts-cache/</cachedir>
  <config></config>
</fontconfig>
```

Fontconfig checks these directories (in order):
1. `/var/task/.fonts` — lambda function directory (hidden folder)
2. `/var/task/fonts` — lambda function directory (regular folder)
3. `/opt/fonts` — lambda layer directory
4. `/tmp/fonts` — temporary directory (where built-in Open Sans is extracted)

### How to Bundle Arabic Fonts

**IMPORTANT**: The old `chromium.fonts.put()` method from `chrome-aws-lambda` does **NOT exist** in `@sparticuz/chromium` v149. You cannot programmatically inject fonts at runtime via this package's API.

Instead, you must use one of these approaches:

#### Approach 1: Write fonts to `/tmp/fonts/` at runtime (RECOMMENDED for Vercel)

On Vercel, `/var/task/` and `/opt/` don't exist (those are Lambda paths). But `/tmp/` is writable. The built-in Open Sans is already extracted there. You can write your Arabic fonts to `/tmp/fonts/` alongside the built-in fonts.

```typescript
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

// Ensure /tmp/fonts exists (the built-in fonts.tar.br extraction may have already created it)
const fontsDir = join(tmpdir(), "fonts");
if (!existsSync(fontsDir)) {
  mkdirSync(fontsDir, { recursive: true });
}

// Bundle your Arabic font as a base64 string or read from the filesystem
import { readFileSync } from "node:fs";

// If the font is in your function bundle (e.g., in a `public/fonts/` directory):
const cairoFont = readFileSync(join(process.cwd(), "fonts", "Cairo-Regular.ttf"));
writeFileSync(join(fontsDir, "Cairo-Regular.ttf"), cairoFont);

const tajawalFont = readFileSync(join(process.cwd(), "fonts", "Tajawal-Regular.ttf"));
writeFileSync(join(fontsDir, "Tajawal-Regular.ttf"),tajawalFont);
```

#### Approach 2: Include fonts in a Lambda Layer (AWS only)

Create a `fonts/` or `.fonts/` directory, zip it, and upload as a Lambda Layer:

```shell
mkdir fonts
cp /path/to/Cairo-Regular.ttf fonts/
cp /path/to/Tajawal-Regular.ttf fonts/
zip -9 --filesync --move --recurse-paths fonts.zip fonts/
# Upload as Lambda Layer — fonts appear in /opt/fonts/
```

#### Approach 3: Download fonts at runtime from a CDN/update

```typescript
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const fontsDir = join(tmpdir(), "fonts");
mkdirSync(fontsDir, { recursive: true });

// Download Arabic font from a CDN (e.g., Google Fonts)
const response = await fetch("https://fonts.gstatic.com/s/cairo/v28/SLXgc1nY6HkvangtZmpQdkZB.woff2");
const buffer = Buffer.from(await response.arrayBuffer());
writeFileSync(join(fontsDir, "Cairo-Regular.woff2"), buffer);
```

> **Note**: Downloading fonts at runtime adds latency and depends on network availability. Prefer bundling.

### Supported Font Formats

Chromium/Fontconfig supports:
- **TTF** (TrueType) — ✅ recommended
- **OTF** (OpenType) — ✅ supported
- **WOFF** (Web Open Font Format 1) — ✅ supported
- **WOFF2** (Web Open Font Format 2) — ✅ supported

For serverless, prefer **TTF** or **WOFF2** for best compression/compatibility.

### Recommended Arabic Fonts for Certificate Generation

| Font | Style | Best For |
|------|-------|----------|
| **Cairo** | Sans-serif, modern | Professional certificates, headings |
| **Tajawal** | Sans-serif, geometric | Modern UI, body text |
| **Amiri** | Serif, traditional | Traditional/formal certificates |
| **Noto Sans Arabic** | Sans-serif, universal | Universal coverage, fallback |
| **Noto Naskh Arabic** | Naskh, traditional | Body text, Quran-style |
| **Reem Kufi** | Kufi, decorative | Headlines, decorative elements |

**Recommendation**: Use **Cairo** for the main certificate text and **Amiri** for the candidate's name (traditional formal feel). Include both TTF files in your bundle.

### RTL Text Shaping

Chromium handles Arabic RTL text shaping natively via HarfBuzz (built into the binary). You do NOT need to configure anything special for RTL shaping — just make sure:
1. An Arabic font is available (bundled as described above)
2. The HTML has proper `dir="rtl"` or `lang="ar"` attributes

## Serverless Integration with Puppeteer

### Standard Integration Pattern

```typescript
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

const browser = await puppeteer.launch({
  args: await puppeteer.defaultArgs({ args: chromium.args, headless: "shell" }),
  defaultViewport: {
    deviceScaleFactor: 1,
    hasTouch: false,
    height: 1080,
    isLandscape: true,
    isMobile: false,
    width: 1920,
  },
  executablePath: await chromium.executablePath(),
  headless: "shell",
});
```

### Key Configuration Points

| Puppeteer Option | Value | Notes |
|-----------------|-------|-------|
| `executablePath` | `await chromium.executablePath()` | MUST await — returns a Promise |
| `args` | `await puppeteer.defaultArgs({ args: chromium.args, headless: "shell" })` | Merges puppeteer's defaults with chromium's serverless flags |
| `headless` | `"shell"` | v149 only supports chrome-headless-shell mode (NOT `true` or `"new"`) |

### The Headless Mode

**CRITICAL**: v149 uses `chrome-headless-shell` — the purpose-built headless binary. It does NOT support:
- `"new"` headless mode (the full-browser headless mode)
- `true` (old headless mode)
- Headful/GUI mode (the binary has no GUI at all)

The recommended value is `"shell"` which maps to `--headless='shell'`.

### `--single-process` Flag

The `--single-process` flag is included by default in `chromium.args`. According to the source code comment:

```javascript
"--single-process", // Runs the renderer and plugins in the same process as the browser.
                    // NOTES: Needs to be single-process to avoid `prctl(PR_SET_NO_NEW_PRIVS)` error
```

This flag is **required** on Lambda — running multi-process causes `prctl(PR_SET_NO_NEW_PRIVS)` errors because Lambda's sandbox disallows creating new privileged processes. Do NOT remove this from the args.

### Memory/CPU Recommendations

From the README:
> You should allocate at least 512 MB of RAM to your instance; however, 1600 MB (or more) is recommended.

## Vercel-Specific Considerations

### Vercel Detection

The package explicitly detects Vercel via the `VERCEL` environment variable and Node version:

```javascript
// Vercel: Node 20+ is AL2023 compatible
if (process.env["VERCEL"] && nodeMajorVersion >= 20) {
    return true;  // isRunningInAmazonLinux2023
}
```

This means on Vercel with Node 20+, the package expects an AL2023-compatible environment and will extract `al2023.tar.br` shared libraries.

### Function Configuration

```json
// vercel.json or function config
{
  "functions": {
    "api/certificates/route.ts": {
      "maxDuration": 60,
      "memory": 2048
    }
  }
}
```

- **Memory**: Minimum 2048 MB recommended (PDF rendering is memory-intensive; 1600 MB is the floor)
- **Max Duration**: 60 seconds on Vercel Pro (may take 5-15s for cold start + render)
- **Node Version**: Must be 20+ for AL2023 compatibility (22+ is ideal; the package requires `^22.17.0 || >=24.0.0`)

### Bundler Exclusion (CRITICAL)

`@sparticuz/chromium` uses **relative path resolution** to find its `bin/` directory. If a bundler relocates the package, the binary won't be found. **It MUST be marked as external.**

For Next.js (Turbopack/webpack), add to `next.config.ts`:

```typescript
// next.config.ts
const nextConfig = {
  serverExternalPackages: ["@sparticuz/chromium"],
  // ...
};
```

### Function Size Limits on Vercel

- Vercel has a **250 MB** unzipped function size limit (on Pro/Enterprise)
- The `@sparticuz/chromium` package is **67 MB** total, but the real concern is the `chromium.br` at **62 MB**
- If you hit size limits, use the `@sparticuz/chromium-min` package (does NOT include the binary) and host the binary remotely:

```typescript
const browser = await puppeteer.launch({
  // ...
  executablePath: await chromium.executablePath(
    "https://your-cdn.example.com/chromium-pack.tar"
  ),
  // ...
});
```

### Cold Start

- **Cold start**: ~3-5 seconds to decompress the Brotli binary to `/tmp/chromium`
- **Warm start**: Near-instant (the binary is cached in `/tmp/chromium` between invocations in the same container)
- Disabling graphics (`chromium.setGraphicsMode = false`) skips SwiftShader extraction, saving ~0.5s

### `/tmp` Directory

- Vercel Functions have **512 MB** of `/tmp` storage
- The extracted files use approximately:
  - Chromium binary: ~131 MB (decompressed from 62 MB Brotli)
  - SwiftShader: ~8 MB
  - AL2023 libs: ~3 MB
  - Fonts: ~0.5 MB
  - **Total**: ~143 MB — well within the 512 MB limit

## Deprecations & Breaking Changes

### No @deprecated Tags

There are **zero** `@deprecated` JSDoc tags in the v149 source code or type definitions.

### Breaking Changes from `chrome-aws-lambda` / Earlier Versions

The package was originally forked from `chrome-aws-lambda`. If migrating from that package, these APIs are **gone**:

| Old API (`chrome-aws-lambda`) | Status in `@sparticuz/chromium` v149 |
|-------------------------------|--------------------------------------|
| `chromium.fonts` | ❌ Removed |
| `chromium.fonts.put(fontFiles)` | ❌ Removed |
| `chromium.headless` | ❌ Removed — now hardcoded to `"shell"` via args |
| `chromium.setHeadlessMode(mode)` | ❌ Removed |
| `chromium.getNewHeadlessMode()` | ❌ Removed |
| `FontFiles` type | ❌ Removed |
| `HeadlessShellMode` type | ❌ Removed |
| `Interface` type | ❌ Removed |
| `chromium.width` / `chromium.height` | ❌ Removed |
| `chromium.addCustomArguments()` | ❌ Removed |
| `chromium.addCustomFlags()` | ❌ Removed |

### New Headless Mode

From the README:
> From what I can tell, `headless_shell` does not seem to include support for the "new" headless mode.

The binary is `chrome-headless-shell` — the purpose-built headless variant. It only supports `"shell"` headless mode.

### ARM64 Support (v135+)

Starting at Chromium v135, arm64 binaries are available. **However**, the npm package (`@sparticuz/chromium`) includes **only x64 binaries**. For arm64:
- Use `@sparticuz/chromium-min` + Lambda Layer or remote pack
- Or host the arm64 pack tar and pass the URL to `executablePath()`

## Gotchas & Warnings

### 1. FONT BUNDLING IS MANDATORY — No Built-in Arabic Fonts

**This is the #1 gotcha.** The package ships with **only Open Sans** (Latin/Greek/Cyrillic). There is **ZERO Arabic support** out of the box.

If you render Arabic text without bundling Arabic fonts:
- Text will appear as empty boxes (tofu □□□)
- Or will fall back to a non-Arabic font, losing all Arabic glyphs
- RTL shaping will fail silently

**You MUST bundle Arabic fonts**. See the Font Handling section above.

### 2. No `chromium.fonts.put()` Method

The old `chrome-aws-lambda` had a `chromium.fonts.put(fontFiles)` method to inject fonts programmatically. This **does NOT exist** in v149. You must write font files to `/tmp/fonts/` manually.

### 3. ESM-Only

The package is `"type": "module"`. If your code uses CommonJS, you need either:
- Convert your code to ESM
- Use dynamic `import()` in CJS code

### 4. `executablePath()` is ASYNC

```typescript
// ❌ WRONG — will pass a Promise
executablePath: chromium.executablePath()

// ✅ CORRECT — await the promise
executablePath: await chromium.executablePath()
```

### 5. `--single-process` is REQUIRED

Do not filter out `--single-process` from the args. It's required to avoid the `prctl(PR_SET_NO_NEW_PRIVS)` error on Lambda/Vercel.

### 6. Headless Mode is `"shell"` Only

Using `headless: true` or `headless: "new"` will NOT work. You must use:
```typescript
headless: "shell"
```

### 7. Graphics Mode Affects Cold Start

If you don't need WebGL (e.g., for PDF generation), disable it:
```typescript
chromium.setGraphicsMode = false;  // Skip SwiftShader extraction, saves ~0.5s
```

### 8. Linux x64 Binary Only

The npm package includes **only Linux x64** binaries. It will NOT work on:
- macOS (local dev — use local Chrome/Chromium instead)
- Windows
- ARM64 (use `-min` package + lambda layer or remote pack)

### 9. Bundler Must Externalize

If you see:
```
The input directory "/var/task/bin" does not exist
```
It means the bundler relocated the package. Add `@sparticuz/chromium` to `serverExternalPackages` (Next.js) or `externals` (webpack/esbuild).

### 10. `/tmp` Gets Cleared on Cold Start

The `/tmp/` directory is ephemeral and cleared on cold starts. Fonts you write there during a cold start will persist for warm starts (same container), but will need to be re-written on the next cold start.

### 11. Accessible PDFs Not Supported Out of the Box

If you need tagged/accessible PDFs (PDF/UA), the Chromium build has `enable_pdf` and `enable_tagged_pdf` disabled. You'd need to recompile Chromium and use `@sparticuz/chromium-min`.

### 12. `tar-fs` is the Only Dependency

The single runtime dependency is `tar-fs` (^3.1.2). This means minimal supply-chain risk.

## Usage Examples

### Complete Serverless PDF with Arabic Fonts (Vercel)

```typescript
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import { readFileSync, mkdirSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

/**
 * Bundles Arabic fonts into the Chromium environment.
 * Must be called BEFORE launching the browser (after executablePath() has extracted fonts).
 */
async function setupArabicFonts() {
  const fontsDir = join(tmpdir(), "fonts");
  if (!existsSync(fontsDir)) {
    mkdirSync(fontsDir, { recursive: true });
  }

  // Read bundled Arabic fonts from the function's public/ directory
  // These should be included in your Vercel function's deployed files
  const arabicFonts = [
    { src: "fonts/Cairo-Regular.ttf", dest: "Cairo-Regular.ttf" },
    { src: "fonts/Cairo-Bold.ttf", dest: "Cairo-Bold.ttf" },
    { src: "fonts/Amiri-Regular.ttf", dest: "Amiri-Regular.ttf" },
    { src: "fonts/Amiri-Bold.ttf", dest: "Amiri-Bold.ttf" },
  ];

  for (const font of arabicFonts) {
    const fontPath = join(process.cwd(), "public", font.src);
    if (existsSync(fontPath)) {
      const buffer = readFileSync(fontPath);
      writeFileSync(join(fontsDir, font.dest), buffer);
    }
  }
}

export async function generateCertificatePDF(htmlContent: string): Promise<Uint8Array> {
  // Disable WebGL for PDF-only use (saves cold start time)
  chromium.setGraphicsMode = false;

  // Get the Chromium binary path (triggers extraction to /tmp)
  const executablePath = await chromium.executablePath();

  // Bundle Arabic fonts AFTER executablePath() (which extracts the built-in fonts.tar.br to /tmp/fonts)
  await setupArabicFonts();

  // Launch browser
  const browser = await puppeteer.launch({
    args: await puppeteer.defaultArgs({ args: chromium.args, headless: "shell" }),
    defaultViewport: {
      deviceScaleFactor: 2,      // Higher DPI for sharper text
      hasTouch: false,
      height: 1080,
      isLandscape: true,
      isMobile: false,
      width: 1920,
    },
    executablePath,
    headless: "shell",
  });

  try {
    const page = await browser.newPage();

    // Set content with proper lang/dir for Arabic
    await page.setContent(htmlContent, {
      waitUntil: "networkidle0",  // Wait for fonts to load
      timeout: 30000,
    });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: "A4",
      landscape: true,
      printBackground: true,
      margin: {
        top: "0",
        right: "0",
        bottom: "0",
        left: "0",
      },
      preferCSSPageSize: false,
    });

    return pdfBuffer;
  } finally {
    // Always close the browser
    try {
      for (const page of await browser.pages()) {
        await page.close();
      }
      await browser.close();
    } catch {
      // Ignore close errors
    }
  }
}
```

### HTML Template with Arabic RTL

```html
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <style>
    /* Use bundled Arabic fonts via @font-face (Fontconfig loads them system-wide) */
    @font-face {
      font-family: 'Cairo';
      src: local('Cairo Regular'), local('Cairo-Regular');
      font-weight: 400;
      font-style: normal;
    }
    @font-face {
      font-family: 'Amiri';
      src: local('Amiri Regular'), local('Amiri-Regular');
      font-weight: 400;
      font-style: normal;
    }
    
    body {
      font-family: 'Cairo', 'Tajawal', 'Noto Sans Arabic', sans-serif;
      margin: 0;
      padding: 0;
    }
    
    .certificate {
      width: 297mm;
      height: 210mm;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
    }
    
    .candidate-name {
      font-family: 'Amiri', serif;
      font-size: 48px;
      font-weight: 700;
      color: #1a1a1a;
    }
    
    .certificate-title {
      font-family: 'Cairo', sans-serif;
      font-size: 32px;
      font-weight: 700;
    }
  </style>
</head>
<body>
  <div class="certificate">
    <h1 class="certificate-title">شهادة إتمام</h1>
    <p class="candidate-name">أحمد محمد</p>
  </div>
</body>
</html>
```

### Local Development Pattern

```typescript
const isLocal = process.env.IS_LOCAL === "true";

const browser = await puppeteer.launch({
  args: isLocal
    ? await puppeteer.defaultArgs()
    : await puppeteer.defaultArgs({ args: chromium.args, headless: "shell" }),
  executablePath: isLocal
    ? "/tmp/localChromium/chromium/chrome-linux/chrome"  // local Chrome path
    : await chromium.executablePath(),
  headless: isLocal ? true : "shell",
});
```
