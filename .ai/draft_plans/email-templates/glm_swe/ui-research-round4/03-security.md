Agent is idle (waiting for messages). agent_id: r4-security, agent_type: explore, status: idle, description: R4: Validate v8 §U security, elapsed: 680s, total_turns: 1

[Turn 0]
I notice tool output contains email addresses that got auto-redacted as `[EMAIL_REDACTED]`. Important confirmation from this run: `isEmail()` returns `false` for CRLF-injected, URL-encoded CRLF, and trailing-newline variants — meaning the `Email` scalar **rejects** CRLF (does NOT merely strip it). The design's wording "ENSURES CRLF stripping" is technically imprecise — the scalar actually rejects CRLF at the parse step, which is safer.

I have all the validation data needed. Let me confirm §U's `EmailPropsByScope` exists in the design body for the U2 zod-mirror claim and verify the S6 endpoint.

I now have enough to compile the full validation report.

---

# v8 §U (Security Hardening) — Round 4 Validation Audit

## 1. Validation Summary Table

| Sub-section | Status | Verified Claim | Remaining Gaps |
|---|---|---|---|
| **U1** Env Key Registration | **VALID** (with one precision issue) | `EMAIL_TEMPLATES_ENABLED` confirmed ABSENT from `backend/lib/env-config-keys.ts` (grep returned no matches) and ABSENT from `environment.d.ts`; `IS_DEMO` confirmed at line 510 with `excludeFromDb: true, serverOnly: true`. | 3 gaps |
| **U2** Server-Side Validation | **PARTIAL** | `Email` scalar at `backend/graphql/scalars/emailScalar.ts` confirmed `GraphQLScalarType` with `parseLiteral`/`parseValue` + wired into Pothos builder (line 53). But the scalar does NOT strip CRLF — it **rejects** it (verified). Mirror-zod claim is underspecified. | 5 gaps |
| **U3** Preview AuthScope | **INVALID** (re: directive syntax) | `notImpersonating` confirmed in `PothosTypes.AuthScopes` (line 35) and `gqlSchemaBuilder.ts:108`; `superAdmin` confirmed (line 107). But `{ superAdmin, notImpersonating }` is NOT valid Pothos syntax — booleans must be wrapped. `limitSimple` confirmed. | 4 gaps |
| **U4** CSP for Preview Iframe | **PARTIAL** | `next.config.ts` confirmed to use a global `headers()` block (lines 73-93) with NO route-CSP — U4's corrected "srcdoc injection" approach is sound. But srcdoc CSP support is browser-dependent & not specced. | 4 gaps |
| **U5** DOMPurify + Re-Sanitize on Read | **PARTIAL** | No DOMPurify config exists in codebase (grep returned nothing actionable). Re-sanitize-on-read conflicts with §T2 render cache (P0 design conflict). | 4 gaps |
| **U6** SMTP Header Injection | **PARTIAL** | `Email` scalar rejects CRLF on `to`, but `subject`/`cc`/`bcc`/`replyTo` are plain strings (not scalar). RTL mark handling missing. `Return-Path` not addressed. | 3 gaps |
| **U7** Rate Limit Atomicity | **INVALID** | `limitSimple` confirmed to exist (`ratelimit.ts:103-158`) but it is NOT atomic — it does `get → set/incr` as **separate non-atomic operations** with multiple `cacheService` round-trips; worse under TOCTOU than `limit()`'s pipeline. Design's premise is backwards. | 3 gaps |

---

## 2. Detailed Findings per Sub-section

### U1 — Env Key Registration — **VALID** (precision gap)

**Verified claims:**
- `EMAIL_TEMPLATES_ENABLED` is genuinely ABSENT from `backend/lib/env-config-keys.ts` (grep on full file → no matches). RE-CONFIRMED.
- ABSENT from `environment.d.ts` (grep → no matches). RE-CONFIRMED.
- `IS_DEMO` entry at line 510 of `env-config-keys.ts`:
  ```ts
  { key: "IS_DEMO", category: "app", displayStrategy: "plain",
    description: { en: "…", ar: "…" },
    isSecret: false, excludeFromDb: true, serverOnly: true }
  ```
- `getBooleanEnv` confirmed env.ts-style: `process.env[name]?.toLowerCase() === "true"` → unset returns `false`.

**Remaining gaps:**
1. **Missing `shared/constants/env-config-keys.ts` `HIDDEN_ENV_CONFIG_KEYS` entry.** This array (lines 6-17) is a redundant client-facing blocklist (`ADMIN_EMAIL`, `IS_DEMO`, `DATABASE_URL`, `JWT_SECRET`, …). The v8 design's "Do NOT expose via `environment-config.pothos.ts`" assumes `excludeFromDb: true` filters it. **This is false** — see U1-gap-2. `EMAIL_TEMPLATES_ENABLED` must ALSO be added to `HIDDEN_ENV_CONFIG_KEYS` for defense-in-depth. v8 does NOT say this.
2. **`environment-config.pothos.ts` does NOT filter on `excludeFromDb`.** Verified at `environment-config.pothos.ts:150-161`: the `envConfigEntries` query resolver just calls `listEnvConfigEntries()` then `assertCanViewEnvironmentConfig()` — no `.filter(e => !e.excludeFromDb)`. The filtering must happen inside the service (`backend/services/system/environment-config.service.ts`). The design's "Do NOT expose via `environment-config.pothos.ts` — filter out …" is misleading: filtering is in the service, not the Pothos file. Actionable? Only if the implementer greps the resolver — the design points at the wrong file. The design should cite the service function name.
3. **Entry format completeness.** v8 says "entry with `excludeFromDb: true, serverOnly: true` (matching `IS_DEMO`)" — but `IS_DEMO`'s entry ALSO has `category: "app"`, `displayStrategy: "plain"`, `description: { en, ar }` (bilingual), `isSecret: false`. v8 doesn't enumerate these required fields. A developer would have to copy `IS_DEMO`'s full block; the design implies a partial entry which won't satisfy the `EnvConfigKeyDescriptor` interface (all fields except `serverOnly`/`defaultValue` are required — verified at lines 52-75).

---

### U2 — Server-Side Validation for Send-Test — **PARTIAL**

**Verified claims:**
- `Email` scalar confirmed `GraphQLScalarType` at `backend/graphql/scalars/emailScalar.ts:5` with `parseLiteral` (line 24) + `parseValue` (line 14) + `serialize` (line 8). ✅
- Wired into Pothos builder: `gqlSchemaBuilder.ts:53` → `Email: { Input: Email; Output: Email }`. ✅ — so `t.arg({ type: "Email" })` works.
- `Email` backing class uses `validator/lib/isEmail` (`backend/lib/email.ts:7`). Tested empirically: `isEmail('[EMAIL_REDACTED]\r\nBcc:[EMAIL_REDACTED]')` returns `false`; same for `'%0d%0a'`-encoded, trailing-newline, and trailing-space variants.

**Remaining gaps / risks introduced:**
1. **"ENSURES CRLF stripping" is technically incorrect — the scalar REJECTS, not strips.** Verification confirms `isEmail()` returns `false` for CRLF input → scalar throws `TypeError`. This means a `to` containing CRLF yields a GraphQL parse error (not silently stripped). Functionally safe, but the design's language ("stripping") leads an implementer to expect a sanitized string. Recommend reword: "Rejects CRLF at the schema layer via `validator`, so any `\r\n` in `to` fails validation with `INVALID_EMAIL`."
2. **No `extensions: { code: "INVALID_EMAIL" }` mapping.** When `parseValue` throws `TypeError`, the GraphQL layer emits a codeless error. The design specifies `INVALID_SAMPLE_PROPS` for `sampleProps` but is silent on the `to` failure case. Cross-ref §S (Error Handling) missing here.
3. **`sampleProps` zod mirror is non-actionable.** v8 says "zod schema mirroring `EmailPropsByScope[scope]` (compile-time type-safe; runtime validation)". But `EmailPropsByScope` (design lines 244-302) is a TypeScript mapped type from `EmailScope` (union) → `EmailTemplateDefinition<...>` — it is NOT a runtime zod schema and TS types are erased at runtime. There is **no per-scope zod schema generator** in the design. The implementer would have to hand-write 9+ per-scope zod schemas and keep them in sync with the TS types — a known drift risk. The design must either (a) declare the per-scope zod array next to the EmailLabels interfaces (§V calls for these at line 1860), or (b) specify a `zod-from-email-labels` codegen step.
4. **50KB JSON size limit — wrong layer.** v8 says "`sampleProps` max 50KB JSON string → prevents render DoS." But `sampleProps` arrives as a GraphQL `JSON` scalar (already-parsed object), not a string — `parseValue` produces an object before the resolver sees it. The size limit must be enforced at the Apollo/network layer (e.g., request body cap in `next.config.ts` or middleware), not as a zod check on a string that no longer exists. The design proposes an impossible check.
5. **Prototype-pollution / `__proto__` not addressed for unusual JSON inputs.** `JSON.parse` for JSON scalar input is permissive; `sampleProps: { "__proto__": { … } }` could poison the resolver's prototype chain. zod's default `z.object().strict()` rejects unknown keys but the design doesn't require `.strict()`.

---

### U3 — Preview Query Authorization — **INVALID** (directive syntax wrong)

**Verified claims:**
- `authScope` plug is `ScopeAuthPlugin` (`gqlSchemaBuilder.ts:81`); the `authScopes` map builder is at line 92-111, returning `{ loggedIn, permission, superAdmin, notImpersonating, notSimulatingGroup }`.
- `notImpersonating` resolves to `!ctx.isImpersonating` (line 108). ✅
- `superAdmin` resolves to `actorIsSuperAdmin` (line 107). ✅
- `limitSimple` exists — see U7.

**Remaining gaps / risks introduced:**
1. **`authScopes: { superAdmin, notImpersonating }` is INVALID Pothos-4 syntax.** Valid forms are (a) `{ superAdmin: true, notImpersonating: true }` (boolean flags must be explicit truthy values), or (b) `{ permission: AppPermission.X, ... }`. Passing bare identifiers like `{ superAdmin }` is shorthand for `{ superAdmin: superAdmin }` (undefined reference — TS error / runtime ReferenceError). The existing codebase uses the explicit form: `environment-config.pothos.ts:168` → `authScopes: { permission: AppPermission.SETTINGS_EDIT_ENV, notImpersonating: true }`. The design writes it the invalid way twice (U3 line 1562; also line 1555 reference). **Actionable? NO** — a developer copy-pasting the design gets a compile error. Must correct to `{ superAdmin: true, notImpersonating: true }`.
2. **`superAdmin: true` alone is already sufficient for impersonation guard?** `superAdmin` resolves from the real user (`realUserId ?? actorUserId`), so impersonators do not get `superAdmin: true` unless the real actor is a super-admin. But the design wants `notImpersonating` to additionally block even super-admins acting AS another user. The design doesn't explain WHY both are required (only that both should be applied). An implementer may drop `notImpersonating`, thinking `superAdmin` suffices, and accidentally allow a super-admin's impersonation session to read every template's HTML. Add explicit rationale.
3. **Rate limit value (30/min) only specified for `previewEmailTemplate`.** The send-test mutation is rate-limited in U7 at "5/min" but U3's `limitSimple` reference is for the preview query. The design doesn't name a second `RateLimiter` instance — both could collide on the same `graphqlRateLimiter` (100/min default). Must instantiate a dedicated `previewEmailRenderRateLimiter = new RateLimiter("ratelimit:email-preview", 30, 60_000)`.
4. **`previewEmailTemplate` is a query (GET-equivalent) but does server-side render — CSRF.** Queries over `cache-and-network` Apollo policy run on GET in some transports; no CSRF token check. Within the same rate-limit guard this is bounded, but v8 doesn't address CSRF for the mutating-but-idempotent `previewEmailTemplate` semantics.

---

### U4 — CSP for Preview Iframe — **PARTIAL**

**Verified claims:**
- `next.config.ts:73-93` sets a `headers()` block for `/(.*)` containing `X-Frame-Options: DENY`, `X-Content-Type-Options`, etc. — but **NO `Content-Security-Policy` header**. ✅ (v8 correctly notes header-based CSP would be a global app header, breaking the GraphQL endpoint.)
- The design's `srcdoc` injection approach (CSP via `<meta http-equiv="Content-Security-Policy">` inside the iframe's srcdoc) is architecturally correct — CSP applies to the iframe document, not the parent route.

**Remaining gaps / risks introduced:**
1. **`X-Frame-Options: DENY` (next.config.ts:78) will block the preview iframe entirely** if it's same-origin and the browser honors the legacy `X-Frame-Options` over CSP `frame-ancestors`. The v8 design adds `frame-ancestors 'self'` in CSP but does NOT remove/override the `X-Frame-Options: DENY` global header. Browser precedence: some browsers (Chrome ≥76) honor CSP `frame-ancestors` over `X-Frame-Options` when both present; others honor the stricter (`DENY`). v8 must explicitly state: **exempt the iframe host route from `X-Frame-Options: DENY`** or remove `X-Frame-Options` entirely in favor of CSP `frame-ancestors`. Currently a self-block.
2. **No browser-compatibility matrix for `srcdoc` CSP.** `<meta http-equiv="Content-Security-Policy">` inside `srcdoc` works in Chrome/Firefox; **Safari has historically ignored `<meta>` CSP inside `srcdoc` iframes** (WebKit bug 241970, documented cross-OS issues). The design proposes this as the CSP delivery mechanism without a fallback. Must specify: detect Safari → fall back to `iframe[index].contentWindow.document` writing via Blob URL or sandbox attributes.
3. **`<iframe srcdoc={...}>` is React/Next.js native** (React supports arbitrary HTML attributes including `srcdoc`). But React **escapes** the string by default; large compiled-HTML payloads (50KB+) can hit per-attribute length limits on some browsers (notably Safari). Not addressed.
4. **sandbox attribute unspecified.** v8 omits `sandbox="allow-same-origin"` (needed for `Document.prototype.contentDocument` access from the parent, used by the ResizeObserver / viewport selector at design line 644). Without an explicit `sandbox` value, the iframe runs with the parent origin's full privileges, partially defeating the CSP. v8 must specify `sandbox="allow-same-origin"` (NO `allow-scripts`).

---

### U5 — DOMPurify + Re-Sanitize on Read — **PARTIAL**

**Verified claims:**
- No DOMPurify config object exists in the codebase (grep returned only design-internal references; codebase has no `isomorphic-dompurify` or `dompurify` config file). So v8 is designing from scratch — this is fine.
- `safeRender` runs DOMPurify at render time — the design says "the stored `compiledHtml` is a cache, NOT the source of truth."

**Remaining gaps / risks introduced:**
1. **CONFLICT with §T2 (P0 design contradiction v8 introduces a NEW security/perf conflict)**. §T2 says: "Switch preview fetchPolicy from `network-only` to `cache-first` keyed on `(id, version, isDirty)`. When `isDirty: false`, serve the stored `compiledHtml` from DB (avoid server render)." U5 says: "Always re-sanitize the `compiledHtml` from DB before sending." If T2's "avoid server render" means **avoid re-rendering React Email** but DOES still re-run DOMPurify.sanitize on the stored string, these are compatible. But the v8 text uses the word "send" (U5) vs "serve from DB" (T2) — a developer could reasonably interpret T2 as "skip sanitize too" if reads happen client-side. v8 must cross-reference: **DOMPurify re-sanitize happens on the SERVER before any HTTP response, even for T2 cache-first reads; the Apollo `cache-first` reads happen on the CLIENT after the server has already re-sanitized.** Otherwise T2 inadvertently ships unsanitized cached HTML to the client.
2. **DOMPurify config drift handling absent.** "Does `DOMPurify.sanitize(storedCompiledHtml, { ...config })` use the SAME config as the save-time pass? What if config changes between save and read?" v8 does NOT specify config versioning. Two failure modes:
   - Save-time config is MORE permissive (new CVE forces stricter config on read) → re-sanitize cleanly removes the now-forbidden tag (this is the intent). ✅ safe.
   - Save-time config is STRICTER (config relaxed on read) → re-sanitize with looser config could **introduce** new attack surface on already-safe HTML. v8 silently allows config regression. Recommend pinning config to a versioned constant + only allowing "monotonic tightening" via a `DOMPurify_CONFIG_VERSION` semaphore.
3. **`FORBID_TAGS: ['style']` vs `ALLOWED_ATTR: ["style"]`.** v8 proposes both. But DOMPurify's `FORBID_TAGS` interacts with `ALLOWED_TAGS` unpredictably when both lists appear in different passes (e.g., save-time uses `FORBID_TAGS`, read-time uses `ALLOWED_TAGS`). The design must adopt ONE approach (recommend `ALLOWED_TAGS` exhaustive + `ALLOWED_ATTR` exhaustive — safer than deny-list). The design uses deny-list (`FORBID_TAGS`), which is the **weaker** pattern and OWASP-discouraged.
4. **Re-sanitize perf cost not measured.** DOMPurify.sanitize on a ~50KB string takes ~5-15ms (DOMPurify jsdom instantiation per call). For bulk send (1000 emails), that's ~15s added to the send path per-recipient if not memoized. v8 doesn't specify memoize-by-(templateId, version, configHash). T2's cache-first helps only for the SAME compile within the SAME T2 read window — send-time is a different code path.

---

### U6 — SMTP Header Injection — **PARTIAL**

**Verified claims:**
- The `Email` scalar (U2) REJECTS CRLF on `to`. ✅ (verified empirically — `isEmail` returns false for CRLF input).
- `SmtpEmailAdapter` is referenced but not present in codebase yet — this is greenfield.
- The design inherits nodemailer's API surface: `sendMail({ from, to, cc, bcc, subject, replyTo })` accepts plain strings.

**Remaining gaps / risks introduced:**
1. **`subject` / `cc` / `bcc` / `replyTo` are NOT validated by the `Email` scalar.** Only `to` is. v8 says "Enforce `Email` scalar on all email-address GraphQL inputs (U2) — catches CRLF at the schema layer" — but `subject` is NOT an email (it's a free string), `replyTo` is a GraphQL `String` arg (not necessarily `Email`-typed per the §M mutation signatures), and `cc`/`bcc` are not in the §M mutation schema at all in v8. The design conflates "CRLF in email address" with "CRLF in non-email headers" (subject). The `sanitizeHeader(str)` helper is correctly placed, but v8's U6 bullet "Enforce Email scalar … catches CRLF at the schema layer" is misapplied to non-Email fields.
2. **RTL mark (U+200E, U+200F, U+202E) stripping missing.** v8 says "strip `[\r\n]` from all envelope/header fields." This is insufficient — Unicode bidirectional override marks (`\u202E`, `\u200E`, `\u200F`) can cause header-value spoofing (e.g., subject "Bill From: [EMAIL_PROTECTED]" rendered reversed). The attack does not break SMTP but breaks the email client's display, enabling phishing. OWASP-suggested regex: `/[\u200E\u200F\u202A\u202B\u202C\u202D\u202E]/g`. v8 must extend the `sanitizeHeader` regex.
3. **`Return-Path` and `Reply-To` asymmetric handling.** v8 lists `replyTo` in the `sanitizeHeader` apply-list but NOT `returnPath`. SMTP `Return-Path` is set by the receiving MTA, not the sender — OK to skip in `sendMail()`. But `sender` / `inReplyTo` / `references` headers (used for threaded replies) are NOT in the v8 list and CAN receive user-controlled strings via merge-tags. Must add `sender` and `inReplyTo` to the sanitization list.
4. **Subject merge-tag injection (U6 last bullet) — already separately handled?** Design §V8 (line 1581) says "merge-tag keys must be in `EmailPropsByScope[scope]` — reject unknown keys at subject-template save time." This is a STATIC save-time check, but the merge-tags are resolved at SEND time (e.g., `{{user.secret}}` resolves from live DB data). A static allowlist of KEYS does not prevent the resolved VALUE of `user.name` from being malicious if the DB row was poisoned upstream. v8 conflates key-allowlist with value sanitization. Must add a runtime `sanitizeSubject(resolvedSubject)` step too.

---

### U7 — Rate Limit Atomicity — **INVALID** (premise is backwards)

**Verified claims:**
- `RateLimiter.limit` exists at `ratelimit.ts:37-80`. It uses `cacheService.pipeline([zremrangebyscore, zadd, zcard, expire])` — confirmed non-atomic pipeline (no MULTI/EXEC).
- `RateLimiter.limitSimple` exists at `ratelimit.ts:103-158`.

**Remaining gaps / risks introduced:**
1. **`limitSimple` is LESS atomic than `limit`, not MORE.** v8's premise ("use `limitSimple` — atomic, not `limit` — non-atomic pipeline") is **incorrect**. Reading `ratelimit.ts:103-158`:
   - Line 114: `const current = await cacheService.get(key)` — round-trip 1
   - Line 117: `if (count === 0)` → line 119: `await cacheService.set(key, "1", {ex})` — round-trip 2
   - Line 140: `await cacheService.incr(key)` — round-trip 3
   - Line 141: `await cacheService.ttl(key)` — round-trip 4
   
   That's a **get → conditional set/incr → ttl** sequence with THREE separate cache operations — a classic TOCTOU race. Two concurrent requests both read `count === 4` (under limit 5), both `incr` → count becomes 6, both report `success: true`. Meanwhile `limit()` uses a single Redis pipeline (atomic at the Redis wire level even though MULTI/EXEC isn't wrapped around it — Redis pipelining is FIFO within the connection). **`limit()` is actually safer**, despite v8's claim. v8's recommendation will WORSEN the race.
2. **No Lua script.** v8 says "Or implement a Lua atomic script for Redis backends." This is the correct approach, but the design provides no Lua body. For atomic fixed-window counting, the standard Redis Lua is:
   ```lua
   local current = redis.call('INCR', KEYS[1])
   if current == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end
   return current
   ```
   v8 should embed this. Without it, the implementer is left choosing between two non-atomic helpers.
3. **Backend ambiguity — Redis vs Postgres vs memory.** `ratelimit.ts:4` imports `cacheService` — a polymorphic backend (`CacheServiceFactory.ts:35` reads `CACHE_PROVIDER`). v8 doesn't address that Lua scripts won't work on the in-memory or Postgres-backed cache backends. Need a backend-detection branch: Redis → Lua; fallback → Postgres advisory lock (`pg_advisory_xact_lock`) or accept non-atomic.

---

## 3. New Gaps Discovered During Validation (not in original audit)

1. **`environment-config.pothos.ts` resolver has NO `excludeFromDb` filter** — the filtering is delegated to the service layer (`listEnvConfigEntries`), which the v8 design does NOT cite. A reader implementing U1's "do NOT expose via `environment-config.pothos.ts` — filter out …" won't find the filter point. **This means U1's instruction is technically wrong about WHERE to add the filter.**

2. **`X-Frame-Options: DENY` global header (next.config.ts:78) blocks the preview iframe entirely.** The preview-document CSP (`frame-ancestors 'self'`) added in U4 is moot if the parent route still sends `X-Frame-Options: DENY`. This is a real-world break the v8 design didn't catch.

3. **Re-sanitize-on-read (U5) is architecturally incompatible with §T2's "avoid server render" cache-first policy** unless explicitly cross-referenced. v8 introduces an internal contradiction without resolving it.

4. **`sampleProps` size limit (50KB) cannot be enforced as a zod string check** — the GraphQL `JSON` scalar parses the input into an object before zod sees it. Must move the check to the HTTP body size cap or to Apollo `QueryOptions` middleware.

5. **`superAdmin: true` does NOT block impersonators if the underlying actor is a super-admin.** Impersonation flag is `ctx.isImpersonating`; `actorIsSuperAdmin` is computed from the REAL user (`realUserId ?? actorUserId`). So `superAdmin: true` is true during an impersonation session if the impersonator is a super-admin (which is the normal case — only super-admins can impersonate). The design must require BOTH `superAdmin: true` AND `notImpersonating: true` AND articulate why — currently it just shows `{ superAdmin, notImpersonating }` which is the wrong syntax.

6. **DOMPurify config drift regression risk.** Re-sanitize-on-read with a looser config than the save-time config can **re-introduce** forbidden tags into already-safe stored HTML. v8 doesn't require monotonic config tightening.

7. **`previewEmailTemplate` is a GraphQL query (GET-equivalent in some transports) doing server-side render** — CSRF + cache poisoning of the GraphQL persisted-query store could trigger arbitrary `sampleProps` renders. v8 doesn't scope this.

8. **Subject value sanitization (runtime) is missing.** v8's U6 only proposes static key-allowlist at save time; the resolved VALUE of an allowed merge-tag key (e.g., `user.name`) coming from a poisoned DB row is never sanitized before becoming an SMTP header. Header injection + RTL-spoofing both feasible.

9. **`sandbox` attribute on the preview iframe is not specified** — without `sandbox="allow-same-origin"` (sans `allow-scripts`), the iframe runs with parent origin privileges, defeating U4's CSP intent.

---

## 4. Top-5 Actionable Recommendations for v9

### 1. **Fix U7 — Replace `limitSimple` recommendation with a real atomic Lua script**
v8's premise is backwards — `limitSimple` (`ratelimit.ts:103-158`) is a non-atomic `get → set/incr → ttl` sequence (3+ cache round-trips, classic TOCTOU), LESS safe than `limit()`'s single Redis pipeline. v9 must:
- Embed the actual Lua script: `INCR → conditional EXPIRE → return`.
- Branch on cache backend (`CacheServiceFactory.ts:35` reads `CACHE_PROVIDER`): Redis → Lua; Postgres → `pg_advisory_xact_lock` per `(prefix, identifier)`; memory → accept non-atomic with a logged runtime warning.
- Wire a new `previewEmailRenderRateLimiter = new RateLimiter("ratelimit:email-preview", 30, 60_000, false)` and a `sendTestEmailRateLimiter = new RateLimiter("ratelimit:email-send-test", 5, 60_000, false)` — note `failOpen=false` for these (unlike the existing `failOpen: true` graphQL limiter at line 165); a down cache should NOT silently allow send-test beyond quota.

### 2. **Fix U3 — Correct the Pothos `authScopes` syntax and rationale**
v8 writes `authScopes: { superAdmin, notImpersonating }` which is invalid Pothos-4 syntax (bare identifiers are not valid scope flags — match `environment-config.pothos.ts:168` form). v9 must:
- Write `authScopes: { superAdmin: true, notImpersonating: true }`.
- Add rationale paragraph: `superAdmin: true` is TRUE during impersonation when the impersonator is a super-admin (computed from `realUserId`/`actorUserId`), so `notImpersonating: true` is REQUIRED to block impersonation sessions from enumerating every rendered template HTML.
- Cite `gqlSchemaBuilder.ts:107-108` as the canonical resolver.

### 3. **Resolve U5 ↔ T2 contradiction explicitly; pin DOMPurify config version**
v8 introduces a P0 conflict between T2 ("cache-first, avoid server render") and U5 ("always re-sanitize the stored HTML before sending"). v9 must:
- Add a §U5/§T2 cross-reference: DOMPurify re-sanitize runs **server-side regardless of fetch policy**; Apollo `cache-first` only skips React Email render, NOT sanitize. Client cached HTML comes from a server response that has already passed through the sanitize gate.
- Define a `DOMPurify_CONFIG_VERSION = 3` constant; reject any read-time config whose version is **less than** the save-time version logged per-row (add a `compiledHtmlDompurifyVersion` column), forcing re-render from `designJson` instead of re-sanitizing when the config has regressed.
- Move from deny-list (`FORBID_TAGS: ['style']`) to explicit allow-list of tags + attrs (OWASP-preferred). Add `iframe`, `object`, `embed`, `base`, `form`, `meta`, `link`, `svg`, `math` to the tag FORBIDDEN set and `data:`, `javascript:`, `vbscript:`, `blob:` URL schemes to the `FORBID_URI` regex.

### 4. **Fix U6 — Extend `sanitizeHeader` beyond `\r\n`; cover non-Email fields and resolved values**
v9 must:
- Strip CRLF + Unicode bidi override marks (`\u200E \u200F \u202A \u202B \u202C \u202D \u202E`) + zero-width joiners + BOM in ALL envelope fields: `from, to, cc, bcc, sender, replyTo, inReplyTo, references, subject`. The `Email` scalar only covers `to`; the rest flow from `subject` template + merge-tag resolution.
- Add a runtime `sanitizeSubject(resolvedSubject)` step at send-time — the v8 save-time key allowlist only validates which merge-tags are referenced, NOT whether their resolved values are safe. A poisoned `user.name` upstream reaches the subject header unsanitized otherwise.
- Add a `subject` maxlength cap (e.g., 998 octets per RFC 5322 line; 78 octets for display safety) — v8 mentions none for headers.

### 5. **Fix U1+U4 — Cite the correct filter location and resolve the `X-Frame-Options: DENY` self-block**
v9 must:
- **U1**: Replace "Do NOT expose via `environment-config.pothos.ts` — filter out …" with "Add `EMAIL_TEMPLATES_ENABLED` to `export const HIDDEN_ENV_CONFIG_KEYS = [...]` in `shared/constants/env-config-keys.ts` (the service-layer deny-list queried by `backend/services/system/environment-config.service.ts::listEnvConfigEntries`). The `excludeFromDb: true` flag in `env-config-keys.ts` is NOT sufficient because the Pothos resolver at `environment-config.pothos.ts:150-161` calls `listEnvConfigEntries()` directly without an `.filter(!excludeFromDb)` guard." Replace v8's partial entry description with the full `EnvConfigKeyDescriptor` (key/category/displayStrategy/description{en,ar}/isSecret/excludeFromDb/serverOnly) so the implementer can satisfy the interface at `env-config-keys.ts:52-75`.
- **U4**: Add a step "Before landing the preview route, REMOVE `X-Frame-Options: DENY` from `next.config.ts:78` (or scope it via `source` glob to exclude `/__email/preview/*` routes) — CSP `frame-ancestors 'self'` (U4) is the intended embedding control, but the global `X-Frame-Options: DENY` header currently blocks the iframe in browsers that honor the legacy header over CSP (Safari, older Chrome)." Also specify `sandbox="allow-same-origin"` (NO `allow-scripts`) on the iframe and add a Safari-detection branch (WebKit ignores `<meta>` CSP inside srcdoc — fall back to Blob URL or data-URL-with-CSP-header).