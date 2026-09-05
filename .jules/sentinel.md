## 2026-09-05 - Host Header Injection in Navigation Redirect Routes
**Vulnerability:** `app/api/set-locale/route.ts` and `app/logout/route.ts` trusted untrusted `Host` or `X-Forwarded-Host` request headers unconditionally when building redirect URLs, enabling Host header injection / open redirect attacks.
**Learning:** `request.headers.get("host")` and `x-forwarded-host` are client-controlled unless verified against trusted proxy configurations or explicitly allowed host origins (`ALLOWED_ORIGINS` / `request.nextUrl.host`).
**Prevention:** Always validate candidate hosts against `request.nextUrl.host`, `ALLOWED_ORIGINS`, or `TRUSTED_PROXY` flag before incorporating header values into `NextResponse.redirect` targets.
