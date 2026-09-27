## 2026-09-27 - URL constructor validation for Host header redirects
**Vulnerability:** Potential URL parsing exceptions or host injection in `resolveTrustedOrigin` when processing raw `x-forwarded-host` or `host` headers.
**Learning:** String comparisons or basic splitting on host headers fail to handle malformed URL characters or port differences when proxied via `x-forwarded-proto`.
**Prevention:** Always parse host headers using `new URL()` within a `try/catch` block, and compare parsed host/hostname against `request.nextUrl` or allowlist entries before constructing redirect URLs.
