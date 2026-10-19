# Sentinel Journal

## 2026-10-06 - Masking Client IP in Rate-Limit Logs
**Vulnerability:** Raw client IP addresses were logged in cleartext during rate-limit breaches in `app/api/health/db/route.ts`, leaking PII into log sinks.
**Learning:** `rateLimitLogId` from `@/backend/lib/ratelimit` should always be used to hash client IP addresses before logging rate-limit warnings.
**Prevention:** Use `rateLimitLogId(ip)` whenever logging client IP addresses or rate-limit keys in route handlers or backend loggers.
