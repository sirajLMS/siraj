
---

# DX & Documentation Audit — Email Template System Design (v7)

**Design**: the v7 email template system design
**Scope**: Developer experience, TypeScript ergonomics, code generation, debugging, API docs, component library docs, onboarding, inline docs, dev environment, build pipeline, design actionability.

Evidence is drawn from the design plus verification against the actual codebase at `/home/ahmed/Projects/siraj-mail`.

---

## Summary Table of All Gaps

| # | Severity | Area | Gap |
|---|----------|------|-----|
| 1 | P2 | TS ergonomics | Generic param name is `S`; codebase convention is `T` (only `T` seen in `enum.ts:34`). `S` carries no semantic weight beyond "scope". |
| 2 | P3 | TS ergonomics | No branded/opaque types used anywhere in repo (grep empty); design introduces `EmailScope`-string-as-`scope` flow but doesn't brand `EmailScope` keys, allowing plain-string scope pollution at boundaries (e.g. `scope as string` at design L314). |
| 4 | P2 | Error messages | Compiler errors from the registry will be **unactionable**: a missing `EmailPropsByScope[S]` entry produces `Property '[EmailScope.X]' is missing` on a structural literal with *no pointer* back to the `EmailPropsByScope` map. Design does not prescribe a comment-directive or assertive helper that surfaces the mapping as the source of truth. |
| 5 | P2 | Error messages | Runtime guard message `Unknown email scope: ${scope}` (design L314, L1284) dumps the raw enum value with **no recovery hint** (which scopes exist, where to register). |
| 6 | P2 | Error messages | GraphQL error **codes** referenced in UI flows (`VERSION_MISMATCH`, `RATE_LIMITED`, `VERSION_RESTORE_CONFLICT`, `SESSION_EXPIRED` at design §P2/§P3/§P7) are **never declared in the design as Pothos mutation throws** — no item creates them. Only `EMAIL_TEMPLATES_DISABLED` is named (item O). Existing codebase uses `extensions: { code: "UPPER_SNAKE" }` literally (auth.mutation.ts) — not a typed union, so no compile-time check that every code referenced by the UI exists backend-side. |
| 7 | P2 | Error messages | Zod validation errors are referenced (design L895-896 RHF+Zod) but there is **no `zodErrorMap` → i18n key** wiring. The codebase has Zod schemas and `parentOnboardingSchema` etc., but no shared i18n error-map pattern; the design doesn't fill this gap. |
| 8 | P1 | Code-gen workflow | `codegen.ts` edit is **never scheduled as an item**. The design adds new GraphQL scalars/enums (item 2 / 14) and the repo's `codegen.ts` egresses both `Email` and `StringMap` scalars — but the file already has them; however, adding new **enums** to the schema surfaces automatically, so the risk is just that a new scalar (if one is needed) would silently fall to `unknown`. No item audits `codegen.ts`. |
| 9 | P2 | Code-gen workflow | The `generate:gqlSchema` → `codegen` sequence is documented **inline** (design L768, L801, items 21a) but there is **no single-command dev loop** script (e.g. `bun run email:dev` that watches schema + regens types). Each doc reference repeats the two-command chain manually. |
| 11 | P1 | Debugging | No **debug mode** for the email pipeline: `safeRender` (design L1273-1303) logs errors only on *failure*. There is no `EMAIL_DEBUG=1` path that logs the rendered HTML (or writes it to a temp preview file) **before send**. Design mentions `pretty` for "debug/preview paths" (L1305) but never wires a debug switch. |
| 12 | P2 | Debugging | **Preview-as-user** is only half-implemented: `previewEmailTemplate(templateId, sampleProps)` (item 14/§P6) returns HTML for an iframe, but there is no "render with a **real recipient's data**" path (load the entity by id → render as that user would receive). `sendTest` (item 12) takes `sampleProps` (manual JSON), not `recipientUserId`. |
| 16 | P1 | Component lib docs | **EmailEditor component API** is undocumented. The design *states* the `EmailEditorRef` API surface (design L149: `getJSON`, `getEmail`, `getEmailHtml`, `getEmailText`, `editor`) but never writes it into a doc file or JSDoc on `EmailEditorWrapper`. No `frontend/**/EmailEditor.ts` doc, no `EmailEditorRef` typed export with JSDoc anywhere (grep empty). |
| 18 | P1 | Component lib docs | No **merge-tag system usage guide**. The merge-tag picker is referenced (§P1 L886, §P8 L936 "merge-tag mismatch") but the system itself (how `{scope, variable}` is resolved, how `EmailPropsByScope` is introspected, allowed variables per scope) is never documented. This is a primary admin-user-facing feature. |
| 19 | P2 | Component lib docs | No **migration guide** for old `renderXxxEmail` functions. Design L1325 says "delete `email-templates.ts` AFTER migration" and existing file (`email-templates.ts`, hardcoded hex `#1976d2`/`#2e7d32`) must be replaced — but there is no migration doc mapping old prop shape (`ComplaintResponseEmailData` with `string` dates, L12-18) to new typed props (`ComplaintResponseEmailProps` with `Date`, L224-229). |
| 20 | P1 | API docs | **GraphQL schema is not self-documenting**. No item requires `description` strings on the new `EmailTemplatePothosObject`, `EmailTemplateInputPothosObject`, enums, queries, or mutations (item 14). Pothos supports `description` field options; the codebase precedent is not inventoried. GraphQL introspection thus yields empty descriptions → Apollo/Playground shows unannotated schema. |
| 21 | P2 | API docs | No **REST endpoints** are documented (there are none intended for email — all GraphQL). Acceptable, but the design should explicitly state "no REST surface — GraphQL-only" to close the question. |
| 22 | P2 | API docs | No **OpenAPI/Swagger** definition. Confirmed: no swagger/openapi packages, GraphQL-only stack. Design should state this explicitly (see #21). |
| 23 | P2 | API docs | **Email provider API** (Resend/SES/Postmark/Mailgun/SMTP) is partially documented inside design prose (L388-396) but **not extracted into a reusable adapter-authoring guide**. Each adapter's gotchas (Postmark base64-only, Mailgun `inline` top-level, SESv2 10MB cap, `@smithy/fetch-http-handler`) live only in the design — a future adapter author has to re-read the design. No `docs/email/adapters.md`. |
| 24 | P0 | Onboarding | **No single-command local bring-up** for the email system. Design defines seeds (item 19) and a dispatcher migration (item 13) but there is no `bun run email:setup` / `bun run email:preview` that combines: seed default templates → start admin UI → mount standalone `react-email dev` preview. A new dev must manually sequence `bun db seed` + `bun dev` + (optional) `react-email dev`. |
| 25 | P1 | Onboarding | No **prerequisites doc** (env keys, provider accounts). `.env.example` exists with `EMAIL_PROVIDER=resend` + commented `RESEND_API_KEY`/`RESEND_FROM_EMAIL` (verified, L176-182) but there is **no doc listing required keys per provider** (Resend, SES, Postmark, Mailgun, SMTP) or how to obtain them (provider accounts, webhooks). |
| 26 | P1 | Onboarding | No **troubleshooting guide**. Pre-existing `docs/auth/REDIRECT_LOOP_FIX.md` style exists for auth; nothing for email (send failures, Resend domain-verification, sandbox mode, webhook signature verification, designJson validation rejections). |
| 27 | P2 | Onboarding | Relationship between design **items and actual code** is unclear: every email-related item is `status: pending` with notes admitting "SWE review v2: was 'completed' but no code exists" (items 1-12). There is no mapping table "item N → file path" beyond inline design references. A new dev cannot see at a glance which files do vs don't exist. |
| 28 | P2 | Inline docs | The `EVENT_TO_SCOPE` mapping (L677-740) is **well-commented inline** (allowlist cross-ref, null-scope rationale, Phase 4 gating) — ✅ this passes. However the **registry pattern** (L215-326) has inline rationale but no `AGENTS.md`-style extraction of the *why* (the #47109 collapse-to-`never` trap) into a standalone doc. The reasoning is buried in design prose. |
| 29 | P2 | Inline docs | **Items/FIXMEs tracking** is ad-hoc: design uses `// Phase 4`, `// (add SES… env keys)`, `// NOTE:` blocks (L377, L626, L737-739). There is no convention to grep `WIP(email)`/`FIXME(email)` to surface every email-work-in-progress item across files. |
| 30 | P2 | Inline docs | **Decision log** exists *inside* the design (SWE review v2-v5 inline notes) but is **not extracted to a decisions doc** (e.g. `docs/email/decisions.md`). Each locked decision is captured as design-review annotations; a maintainer reading code later can't link a comment to its rationale without grepping the design. |
| 31 | P1 | Dev environment | No **mock email provider**. SWE design item 4 lists 5 REAL adapters; there is **no `MockEmailAdapter`** (logs to `console`/file instead of sending). The provider registry has a fixed list of real providers, so a local dev without Resend keys must set `EMAIL_PROVIDER=resend` with no channel-level substitute. |
| 32 | P2 | Dev environment | **Previewing emails without sending** is only via the admin iframe (item 12 `previewHtml`) and optional `@react-email dev` standalone server (design L139-140, deferred per item 1). No "dry-run" flag on the dispatcher (the `EMAIL_TEMPLATES_ENABLED` flag is a *migration* gate, not a "log instead of send" switch). |
| 34 | P2 | Dev environment | **Hot reloading for React Email components** is implied (`next dev --turbopack`, package.json L6) but not guaranteed: backend `.tsx` email components (design L211 — first `.tsx` in backend) live under `backend/services/communication/templates/components/`. Turbopack dev targets the frontend app route; the registry's `renderEmailTemplate` runs server-side and a component edit requires a code reload, not HMR. Design never verifies HMR for these components. |
| 35 | P2 | Build pipeline | **Build order** is implied but not consolidated: types (item 10) → enums+pgEnums (item 2) → schema (item 9) → registry (item 7) → service (item 12) → Pothos (item 14) → `generate:gqlSchema && codegen` (item 21a) → frontend (item 16). No single "phase gate checklist" lists this ordering; dependencies are scattered across item notes. |
| 36 | P2 | Build pipeline | **Circular dependency risk**: the registry `.tsx` imports `getServerTranslations` from `@/shared/locale` (design L1271) AND `@/shared/locale` modules import nothing from backend — confirmed one-directional (design L1164). Low risk. But `email-template.service.ts` → `renderEmailTemplate` (registry) → React Email component → `getServerTranslations` → `emailsEn`/`emailsAr` (which the service-extended `EmailsErrorLabels` shapes) creates a cycle if the type file imports from the registry. Design does not call out this layering boundary. |
| 37 | P1 | Build pipeline | **Tree-shaking for editor bundle**: design §L855 + item 20b verify code-splitting via `NEXT_BUNDLE_ANALYZER=enabled bun run build` (analyzer installed 2026-08-02, item 20b note). GAP: the `EmailEditorWrapper` uses `ssr:false` lazy import (item 16a, L850) — but there is **no explicit `next/dynamic` or route-segment `ssr:false`** documented in the design as the splitting boundary. The analyzer step verifies the *outcome* but not the *technique*. |
| 38 | P3 | Build pipeline | **Production build optimization** (minification/dead-code-elimination) is not addressed — relies on Next.js defaults. Acceptable for a v1; no specific gap unless bundle analyzer finds bloat. |
| 39 | P1 | Design actionability | Several items **require referencing external research files** to execute: item 1 → `reserch_node/15-…`, item 4 → `reserch/05-provider-registry-pattern.md`, item 7b → V3-7 wiring, item 12 → DOMPurify. The design embeds enough inline code that **most** items are self-contained, but adapter authors must still open research files for the ~200-LOC adapter details (design L388 admits "each is realistically ~200 LOC, not ~80"). |
| 40 | P3 | Design actionability | File paths are **relative** in the design (e.g. `backend/enum/email/emailTemplates.enum.ts`, design L171). Consistent and project-root-relative — acceptable, but tooling that consumes the design would benefit from absolute or repo-anchored paths. |
| 41 | P1 | Design actionability | **Inter-item dependencies** are partial: item 13 explicitly blocks on item 3a (design L70 note), but many more implicit deps are not graphed — item 7 (registry) depends on item 2 (enums), item 6 (components), item 10 (types); item 12 (service) depends on items 7/9/10/11; item 18 (builders populate `templateProps`) depends on item 13's `CommunicationPayload` extension (design L531-549). No DAG or dependency column. |
| 42 | P1 | Design actionability | **No per-phase-gate checklist**. The "Phasing recommendation" (L1352+) is explicitly "not part of design, just framing." Phases 0-4 are referenced in notes (e.g. "Phase 0 GO/NO-GO"-21b) but there is no definition-of-done list per phase (e.g. "Phase 1 done when: enums exist, the registry compiles, and seeds run"). |

---

## Detailed Findings per Area

### 1. TypeScript ergonomics
- **Type name consistency**: ✅ Good. `EmailTemplate{Select,Insert,Return,Submit}Type` follows the repo's canonical `{Entity}{Select,Insert,Return,Submit}Type` pattern (verified: `NotificationAlertReturnType`, `AuditLogReturnType`, `UserMeetingConfigReturnType`, etc., all use `*ReturnType`).
- **Generic param name**: `S` (design L302, 306) is unconventional. Repo's single generic enum util uses `T` (`enum.ts:34` `parseEnumValue<T extends StringEnum>`). Recommending `TScope` would be self-documenting. **Gap #1.**
- **Type ammunition**: Low. `EmailTemplateRegistry` is a single-level mapped type `readonly [S in EmailScope]: EmailTemplateDefinition<EmailPropsByScope[S]>` — no deep nesting. `EmailTemplateProps<S>` is a one-level indexed access. Acceptable.
- **Branded/opaque types**: Repo has **zero** branded/opaque types (grep empty). The `scope as string` cast at design L314 and `provider as EmailProviderName` at L357 are entry points where a branded `EmailScopeKey` (opaque) would prevent string leakage — a defense-in-depth opportunity the design skips. **Gap #2.**
- **Actionable compiler errors**: When a new `EmailScope` member is added without a registry entry, the compiler emits the structural `Property '[EmailScope.X]' is missing in type …` on the `_EMAIL_TEMPLATES` literal — it doesn't say *"register EmailScope.XXX"*. A prescribing helper (`function assertScopeRegistered<S extends EmailScope>(s: S, def: EmailTemplateDefinition<EmailPropsByScope[S]>)`) or a `satisfies`-on-`EmailPropsByScope` check would surface a pointer to the right file. **Gap #4.**

### 2. Error messages
- **Compiler errors actionable**: Partially. `Readonly<Record<NotificationEventType, EmailScope | null>>` (design L677) *does* give a pointer-behavior (missing enum value → compile error on the Record), unlike the registry literal (which gives structural missing-property). Design does not standardize the helper. **Gap #4.**
- **Runtime errors user-friendly**: `Unknown email scope: ${scope}` (L314, L1284) dumps raw enum; no list of valid scopes, no hint to register. Other messages route through i18n (`emailsTranslations.errors.*`, L1172-1180) — good. **Gap #5.**
- **GraphQL error codes machine-readable**: Codes `VERSION_MISMATCH`, `RATE_LIMITED`, `VERSION_RESTORE_CONFLICT`, `SESSION_EXPIRED`, `EMAIL_TEMPLATES_DISABLED` are referenced by UI flows (§P2/§P3/§P7/item O) but **only `EMAIL_TEMPLATES_DISABLED` is created as a backend throw** (item O). The others have no item. Codebase precedent is ad-hoc literal `extensions: { code: "UPPER_SNAPE" }` strings (auth.mutation.ts), with no typed union → no compile-time check that every code the UI reads exists backend-side. **Gap #6.**
- **Zod errors → i18n**: Zod exists (`zod` in package.json, schemas under `backend/lib/*.validation.ts` + frontend `schemas/`). No shared `zodErrorMap`/i18n bridge. Design §P3 uses RHF+Zod (L895) but the `z.string().email()` error string is raw Zod default, not localized. **Gap #7.**

### 3. Code generation workflow
- **`codegen.ts` edit scheduled**: ❌ No item. The existing `codegen.ts` already maps `Email`, `StringMap` scalars (verified), so adding enums needs no edit — but this is *undocumented* and a future new scalar would silently map to `unknown`. **Gap #8.**
- **`generate:gqlSchema` → `codegen` sequence**: ✅ Documented inline at L768, L801 and scheduled as item 21a (explicitly added per SWE v2 note L116). But only as a manual two-command chain. **Gap #9.**
- **Single-command dev loop**: ❌ No `bun run email:dev`/`gql:dev` watching `schema.graphql` and regenerating. Each reference repeats the manual pair. **Gap #9.**

### 4. Debugging support
- **Debug mode for pipeline**: ❌ `safeRender` logs only on *failure* (L1298). No `EMAIL_DEBUG=1` / `EMAIL_LOG_RENDERED` switch that logs or writes rendered HTML before send. Design L1305 mentions `pretty` for "debug/preview paths" but never wires it behind a flag. **Gap #11.**
- **Preview-as-user**: Half. `previewEmailTemplate(templateId, sampleProps)` (item 14, §P6) takes manual JSON, not a recipient user/record fetch. No "render with real payload for userId X" path. **Gap #12.**
- **Single-template isolation**: ❌ No `scripts/render-email.ts --scope=INVOICE_GENERATED` harness to render one template with mock props and print HTML. **Gap #13.**

### 5. Component library docs
- **EmailEditor component API**: ❌ Design *states* the `EmailEditorRef` API at L149 but never records it as JSDoc on `EmailEditorWrapper.tsx` or a doc file. No `EmailEditorRef` typed export with JSDoc exists (grep empty). **Gap #16.**
- **Merge-tag usage guide**: ❌ Merge-tag picker is referenced (§P1 L886, §P8 L936) but the system (resolve `{scope, variable}`, introspect `EmailPropsByScope`, allowed variables) is undocumented. **Gap #18.**
- **Migration guide for old `renderXxxEmail`**: ❌ Design L1325 says delete after migration; existing `email-templates.ts` uses `string` dates + hardcoded hex (verified L12-59) vs new typed props with `Date` (design L224-229). No prop-shape migration map doc. **Gap #19.**

### 6. API documentation
- **GraphQL schema self-documenting**: ❌ No item requires `description` strings on the new Pothos objects/inputs/enums/queries/mutations (item 14 doesn't mention descriptions). Existing precedent not inventoried. **Gap #20.**
- **REST endpoints**: None intended (GraphQL-only). Design should state this explicitly (currently silent). **Gaps #21/#22.**
- **OpenAPI/Swagger**: Not applicable (GraphQL-only); confirm no swagger package (verified empty). **Gap #22.**
- **Email provider API**: Documented only in design prose (L388-396). No `docs/email/adapters.md` extracting adapter-authoring gotchas. **Gap #23.**

### 7. Onboarding
- **Single-command bring-up**: ❌ No `email:setup`/`email:preview` chaining seed + dev + standalone preview (item 19 seeds, item 13 migrates, standalone `react-email dev` deferred at item 1). **Gap #24 (P0).**
- **Prerequisites doc**: ❌ `.env.example` has `EMAIL_PROVIDER` + commented Resend keys (verified L176-182) but no per-provider key checklist / account-acquisition doc. **Gap #25.**
- **Troubleshooting guide**: ❌ Repo has `docs/auth/REDIRECT_LOOP_FIX.md` precedent; nothing for email (send failures, Resend domain-verify, sandbox, webhook sigs). **Gap #26.**
- **Item ↔ code relationship**: ❌ All items `status:pending` with notes "was completed but no code exists" (items 1-12). No "item N → file path (exists?)" mapping table. **Gap #27.**

### 8. Inline documentation
- **Complex sections commented**: ✅ `EVENT_TO_SCOPE` map (L677-740) is well-commented (allowlist cross-ref, null-scope rationale, Phase 4 gating). Registry (L215-326) has inline rationale but the *architectural why* (#47109 collapse-to-`never`) stays design-bound, not in `AGENTS.md`. **Gap #28.**
- **Items/FIXMEs tracked**: Ad-hoc `// Phase 4`, `// NOTE:` (L377, L626, L737-739). No `WIP(email)`/`FIXME(email)` convention for a single grep. **Gap #29.**
- **Decision log**: Locked decisions live as SWE-review annotations in the design, not in `docs/email/decisions.md`. **Gap #30.**

### 9. Development environment
- **Mock email provider**: ❌ Item 4 lists 5 real adapters; no `MockEmailAdapter`/`InMemoryEmailAdapter` (dry-run to console/file) at the channel layer. **Gap #31.**
- **Preview without sending**: Partial — admin iframe (item 12 `previewHtml`) + deferred optional `@react-email dev`. `EMAIL_TEMPLATES_ENABLED` is a *migration* gate, not a "log-not-send" dry-run flag. **Gap #32.**
- **Hot reload for React Email components**: Implied by `next dev --turbopack` (package.json L6) for the *frontend* route, but the registry's server-side `.tsx` components (first backend `.tsx`, design L211) under `backend/services/communication/templates/components/` are rendered server-side — an edit needs a server reload, not HMR. Design never verifies HMR for these. **Gap #34.**

### 10. Build pipeline
- **Build order**: Implied (10→2→9→7→12→14→21a→16) but no consolidated phase-gate checklist. **Gap #35.**
- **Circular dependency risk**: Low — `shared → backend` is one-directional (design L1164). But `email-template.service.ts → registry → component → getServerTranslations → emailsEn/Ar` (which the service-side `EmailsErrorLabels` shapes) could self-cycle if a type file imports the registry. Design doesn't state the boundary. **Gap #36.**
- **Tree-shaking for editor bundle**: `NEXT_BUNDLE_ANALYZER` installed (item 20b note) + `ssr:false` lazy import on `EmailEditorWrapper` (item 16a, L850), but design never names the *split technique* (`next/dynamic` with `ssr:false` / route-segment config). Analyzer checks outcome only. **Gap #37.**
- **Production build optimization**: Relies on Next.js defaults; acceptable for v1. **Gap #38 (P3).**

### 11. Design actionability
- **Self-contained items**: Mostly — heavy code blocks inline. But adapter items (item 4, L388-396) require opening research files for the ~200-LOC detail. **Gap #39.**
- **File paths**: Relative (`backend/enum/email/…`), project-root-anchored — consistent. Absolute would be tool-friendlier. **Gap #40 (P3).**
- **Inter-item dependencies**: Partial — item 13↔3a is explicit (L70 note). Many implicit deps (7↔2/6/10; 12↔7/9/10/11; 18↔13's `CommunicationPayload`) are not graphed. **Gap #41.**
- **Per-phase-gate checklist**: ❌ "Phasing recommendation" explicitly "not part of design" (L1352). No DoD list per phase. **Gap #42.**

---

## Top-5 Actionable Recommendations

1. **Add an email onboarding/troubleshooting doc (`docs/email/README.md` + `docs/email/troubleshooting.md`)** covering: per-provider env-key checklist (Resend/SES/Postmark/Mailgun/SMTP accounts + webhook setup), a single-command `bun run email:setup` script (seed + admin route), sandbox/dry-run mode, Resend domain-verification gotchas, and how to obtain provider accounts. Closes P0 gap #24 and P1 gaps #11/#25/#26.

2. **Introduce a `MockEmailAdapter` and an `EMAIL_LOG_RENDERED=1` debug path.** Add the mock adapter to `EmailProviderRegistry` gated by `EMAIL_PROVIDER=mock` (logs rendered HTML/text/attachments to a file or logger, never sends). Wire `EMAIL_LOG_RENDERED=1` (or reuse `pretty`) inside `safeRender` to log pre-send HTML. Closes P1 gaps #11/#31 and P2 gap #32.

3. **Create a `docs/email/adapters.md` + a typed `EmailErrorCode` union.** Extract the per-adapter gotchas (Postmark base64-only, Mailgun `inline` top-level, SESv2 10MB cap, `@smithy/fetch-http-handler`, nodemailer `encoding` literal-union cast) into a reusable adapter-authoring guide. Define `EmailErrorCode` (typed union consumed by both the Pothos throw sites and the frontend error handlers) so every code the UI reads (`VERSION_MISMATCH`, `RATE_LIMITED`, `VERSION_RESTORE_CONFLICT`, `SESSION_EXPIRED`, `EMAIL_TEMPLATES_DISABLED`) is compile-checked against the union. Closes P1/P2 gaps #6, #23.

4. **Make the registry's error actionable at both type and runtime levels.** (a) Rename the generic `S → TScope` for codebase consistency. (b) Add a prescribing `assertScopeRegistered<TScope extends EmailScope>(...)` helper or a `satisfies EmailPropsByScope` check on `EmailPropsByScope` so the compiler message points to the mapping file. (c) Upgrade the runtime guard to list valid scopes: `Unknown email scope: '${scope}'. Valid scopes: ${Object.values(EmailScope).join(", ")}. Register it in EmailPropsByScope and EMAIL_TEMPLATES.` (d) Add a `satisfies`-assertion on generated GraphQL enums to keep them aligned with the TS enums. Closes P2/P3 gaps #1, #4, #5.

5. **Add a per-phase Definition-of-Done checklist + an item↔file mapping table + GraphQL `description` strings.** (a) Insert a DoD table per phase (e.g. "Phase 1 done: enums exist, the registry compiles, seeds run, and `generate:gqlSchema && codegen` succeeds"). (b) Add a mapping column "item N → target file(s) → exists? (Y/N)" so the "was completed but no code exists" status confusion (items 1-12) is resolved at a glance. (c) Require `description` strings on every new Pothos object/input/enum/query/mutation (item 14 amendment — Repo uses Pothos `description` field option support). Closes P1 gaps #20, #41, #42 and P2 gap #27.

---

*Report complete. 42 gaps identified: 1 P0, 9 P1, 26 P2, 6 P3.*