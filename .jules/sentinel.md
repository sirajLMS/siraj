## 2026-08-31 - Open Redirect via Backslash Bypasses
**Vulnerability:** Handlers checking relative redirect paths using `.startsWith("/")` and `!startsWith("//")` allowed backslash variants like `/\evil.com` or `/\\evil.com`. When passed to `new URL(path, origin)`, the WHATWG URL parser treats backslashes following a leading slash as path delimiters or authority indicators, resolving `new URL("/\\google.com", "https://app.com")` to `https://google.com/`.
**Learning:** Checking only for `//` or `://` is insufficient to prevent open redirects in Next.js / WHATWG URL parsing environments.
**Prevention:** Use centralized `isRelativeSafePath` from `@/frontend/common/lib/safeRedirect`, which explicitly checks `url.startsWith("/") && !url.startsWith("//") && !url.startsWith("/\\")`.
