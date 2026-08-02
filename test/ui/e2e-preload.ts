// Preload: patch graphql-tag ESM issue on Bun + use system Chromium on Alpine
// graphql-tag UMD calls require('graphql'), but Bun resolves to index.mjs (async ESM)
// Pre-load graphql's CJS entry point and inject it into require cache
try {
  const graphqlCjs = require("graphql/index.js");
  const Module = require("node:module");
  const cjsPath = require.resolve("graphql/index.js");
  if (!Module._cache[cjsPath]) {
    Module._cache[cjsPath] = {
      id: cjsPath,
      filename: cjsPath,
      loaded: true,
      exports: graphqlCjs,
    };
  }
} catch {}

// Use system Chromium on Alpine (Playwright's bundled Chromium is glibc-only)
try {
  const fs = require("node:fs");
  if (fs.existsSync("/usr/bin/chromium")) {
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH = "/usr/bin/chromium";
  }
} catch {}
