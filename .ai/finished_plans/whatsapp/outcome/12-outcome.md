# Task 12 Outcome — Webhook Route

## Files Created
- `app/api/webhooks/whatsapp/route.ts` — Meta WhatsApp Cloud API webhook endpoint
- `backend/services/whatsapp/whatsapp-webhook.handler.ts` — Handler stub (full impl in Task 13)

## Files Modified
- `backend/services/whatsapp/index.ts` — Added `WhatsappWebhookHandler` export

## Implementation Summary

### GET handler (webhook verification)
- Validates `hub.mode=subscribe`, `hub.verify_token`, `hub.challenge` params
- **S1**: Per-IP rate limiting via `checkRateLimit()` with `apiRateLimiter`
- **S5**: `hub.verify_token` compared via `crypto.timingSafeEqual` over equal-length buffers (safeEqual helper)
- 403 on mismatch, 200 with challenge as plain text on success

### POST handler (inbound events)
- **Body-size cap**: Content-Length header check + actual body size check, both >1MB → 413
- `await req.text()` to get raw body for HMAC verification
- **HMAC-SHA256**: `crypto.createHmac("sha256", appSecret).update(rawBody).digest()` compared with `timingSafeEqual`
- **S2**: On signature mismatch, logs only `(ip, userAgent, contentLength, signaturePrefix)` — never the body
- 401 on HMAC mismatch, 400 on invalid JSON, 404 on `body.object !== "whatsapp_business_account"`
- **S3**: `stripInboundMessages()` removes `value.messages[]` from every change entry before anything else
- **C3**: Returns 200 immediately, defers handler via `after()` from `next/server` (not queueMicrotask)

### Security Requirements Met
| Req | Implementation |
|-----|----------------|
| S1 | `checkRateLimit()` with `apiRateLimiter` on GET verification |
| S2 | HMAC mismatch logs only metadata (ip, userAgent, contentLength, signaturePrefix) |
| S3 | `stripInboundMessages()` deletes `value.messages[]` from all change entries |
| S5 | `safeEqual()` uses `crypto.timingSafeEqual` over equal-length buffers |
| C3 | `after()` from `next/server` for deferred handler execution |

## Quality Gates
- `bun tsgo` ✅ (exit 0)
- `bun biome:check` ✅ (1 file auto-fixed, passed)
- `bun run lint` ✅ (no errors in new files; pre-existing error in recurring-class.service.ts is unrelated)
