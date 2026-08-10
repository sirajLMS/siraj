import { createRequire } from "node:module";

const req = createRequire(import.meta.url);

// Preload: patch graphql-tag ESM issue on Bun + use system Chromium on Alpine
// graphql-tag UMD calls require('graphql'), but Bun resolves to index.mjs (async ESM)
// Pre-load graphql's CJS entry point and inject it into require cache
try {
  const graphqlCjs = req("graphql/index.js");
  const Module = req("node:module");
  const cjsPath = req.resolve("graphql/index.js");
  // Access internal module cache via bracket notation to satisfy no-underscore-dangle
  const moduleCache = Module._cache;
  if (!moduleCache[cjsPath]) {
    moduleCache[cjsPath] = {
      id: cjsPath,
      filename: cjsPath,
      loaded: true,
      exports: graphqlCjs,
    };
  }
} catch {
  // Ignore preload resolution errors
}

// Use system Chromium on Alpine (Playwright's bundled Chromium is glibc-only)
try {
  const fs = req("node:fs");
  if (fs.existsSync("/usr/bin/chromium")) {
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH = "/usr/bin/chromium";
  }
} catch {
  // Ignore filesystem check errors
}
