## 2026-08-27 - Open Redirect via WHATWG Backslash Normalization
**Vulnerability:** Simple relative URL checks (`raw.startsWith("/") && !raw.startsWith("//")`) allowed open redirects when passed inputs starting with `/\` or `/\\` (e.g. `GET /api/set-locale?redirect=/\\evil.com`).
**Learning:** In the WHATWG URL standard used by modern browsers, Bun, and Node.js `new URL(relative, base)`, backslashes `\` in relative paths are normalized to forward slashes `/`. Consequently, `new URL("/\\evil.com", "http://localhost:3000")` resolves to `http://evil.com/`.
**Prevention:** Always check `!raw.startsWith("/\\")` alongside `!raw.startsWith("//")` and `!raw.includes("://")` when validating relative redirect URLs, or use a shared safe redirect helper function.
