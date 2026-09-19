# Round 5 Audit: §U — Security Hardening

## Summary
- INVALID designs: 0 (v9 fixes all correct!)
- PARTIAL designs: 5 (U1, U2, U4, U5', U6)
- NEW gaps: 6
- v9 fixes verified correct: 4/4 (U3 syntax ✓, U3 superAdmin+notImpersonating ✓, U7 atomicity ✓, U2 CRLF wording ✓)

## U1 — PARTIAL (wrong file for "do not expose")
- `EMAIL_TEMPLATES_ENABLED` confirmed absent from `backend/lib/env-config-keys.ts` ✓
- v9 does NOT carry forward R4's 3 sub-gaps:
  (a) missing `shared/constants/env-config-keys.ts` `HIDDEN_ENV_CONFIG_KEYS` entry
  (b) filter is in `environment-config.service.ts`, not `environment-config.pothos.ts`
  (c) full `EnvConfigKeyDescriptor` entry format not enumerated

## U2 — PARTIAL (scalar unchanged, sampleProps non-actionable)
- v9 reworded CRLF stripping → "Rejects CRLF at schema layer via `validator`" ✓ (verified empirically)
- `emailScalar.ts:14-23` still throws bare `TypeError` — NO `GraphQLError`, NO `extensions` → codeless error ships
- Fix is forward-looking, not done; this is a GLOBAL scalar change (affects every `Email` field) — design fails to flag blast radius
- `sampleProps` zod mirror STILL non-actionable: `EmailPropsByScope` is a TS mapped type, erased at runtime — no runtime zod schema exists
- Implementers must hand-write 9+ per-scope zod schemas with drift risk

## U3 — VALID
- `authScopes: { superAdmin: true, notImpersonating: true }` verified correct ✓
- `PothosTypes.AuthScopes` declares both flags ✓
- `superAdmin` resolves to `actorIsSuperAdmin` (real user, even during impersonation) ✓
- `notImpersonating: !ctx.isImpersonating` ✓
- Minor: omits `notSimulatingGroup` (defensible but inconsistent)

## U4 — PARTIAL (sandbox attr still missing)
- `next.config.ts:73-93` global `X-Frame-Options: DENY` verified ✓
- v9 remediation options sound ✓
- CSP string complete for React Email CSS-only preview ✓
- **Still PARTIAL**: §U4 omits iframe `sandbox=''` attribute — body mandates it (line 66, 1428) but §U4 does not
- Without `sandbox`, iframe runs with parent-origin privileges, defeating CSP intent
- v9 doesn't address `<meta http-equiv>` srcdoc browser-dependency (Safari historically ignored)

## U5 — MISSING (bounce/complaint webhook)
- bounce/complaint webhook topic entirely MISSING from §U
- No webhook verification pattern in `app/api/**/route.ts`
- No `sendgrid|bounceWebhook|complaint.*webhook|SNS.*webhook` references outside design
- Actionable gap: design needs `app/api/email/events/route.ts`, HMAC verification, idempotency on event id, per-event rate limit

## U5' — PARTIAL (DOMPurify re-sanitize)
- Re-sanitize-on-read sound in principle ✓
- NEW conflict: §U5 contradicts §T2 (cache-first reads) — must explicitly state "DOMPurify runs server-side before HTTP response; Apollo cache-first is CLIENT only"
- `FORBID_TAGS: ['style']` good but no `FORBID_ATTR: ['style']` — combined with `style-src 'unsafe-inline'`, attacker gets inline-style exfil at CSP layer

## U6 — PARTIAL (misapplied scalar + missing bidi marks)
- Line 1800 "Enforce `Email` scalar on all email-address inputs" MISAPPLIED to non-email fields (`subject`, `replyTo`, `cc`, `bcc`)
- `sanitizeHeader(str)` is the right tool for those — but line 1800 points them at Email scalar
- `sanitizeHeader` only strips `[\r\n]` — NOT bare `\n` nor RTL/LTR unicode marks (`\u202E\u202D\u200E\u200F`)
- `Return-Path` envelope header NOT addressed
- Subject merge-tag injection: save-time key allowlist is necessary but not sufficient — resolved VALUE of allowed key (e.g. `user.name` from poisoned DB row) never sanitized at send time

## U7 — VALID (premise correct, implementation gaps)
- v9 reversal verified correct: `limit()` uses non-atomic TOCTOU, `limitSimple` strictly worse ✓
- `failOpen=false` correct for premium user-facing endpoints ✓
- **Dead code**: v9's "memory → accept non-atomic" branch — `CacheServiceFactory` has no memory provider (only redis/postgres)
- **Missing interface work**: `IRedisService` has NO `eval`/`evalsha`/`script load` method — implementing Lua script requires extending `IRedisService` + both adapters
- **Missing Postgres path**: `PostgresCacheAdapter` has no `pg_advisory_xact_lock` — brand-new pattern, not in codebase
- `checkRateLimit` uses `limitSimple` — design silent on whether email limiters bypass `checkRateLimit` or migrate it

## v9 Fix Side-Effects
1. U7 fix introduced dead code (memory branch has no provider)
2. U7 fix silently requires `IRedisService` interface extension
3. U2 wording fix is cosmetic — scalar unchanged in codebase
4. `INVALID_EMAIL`/`INVALID_SAMPLE_PROPS` codes not registered in Apollo error formatter

## NEW gaps (not in audit prompt)
1. SSRF prevention for preview rendering — `sampleProps` caller-supplied; no egress allowlist/private-IP block
2. HTML email sanitization at render OUTPUT — no post-render sanitization before SMTP send
3. Timing attacks on idempotency key — no `crypto.timingSafeEqual` design
4. Audit logging for template changes — no design to log `updateEmailTemplate`/`publishEmailTemplate`/`deleteEmailTemplate` with actor, diff, timestamp
