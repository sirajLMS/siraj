
---

# DX & Documentation Audit — Email Template System Plan (v7)

**Plan**: `.cursor/plans/email_template_system_(react_email_+_editor)_08419060.plan.md`
**Scope**: Developer experience, TypeScript ergonomics, code generation, debugging, API docs, component library docs, onboarding, inline docs, dev environment, build pipeline, plan actionability.

Evidence is drawn from the plan plus verification against the actual codebase at `/home/ahmed/Projects/siraj-mail`.

---

## Summary Table of All Gaps

| # | Severity | Area | Gap |
|---|----------|------|-----|
| 1 | P2 | TS ergonomics | Generic param name is `S`; codebase convention is `T` (only `T` seen in `enum.ts:34`). `S` carries no semantic weight beyond "scope". |
| 2 | P3 | TS ergonomics | No branded/opaque types used anywhere in repo (grep empty); plan introduces `EmailScope`-string-as-`scope` flow but doesn't brand `EmailScope` keys, allowing plain-string scope pollution at boundaries (e.g. `scope as string` at plan L314). |
| 3 | P2 | TS ergonomics | No type-level test that emits an **actionable** error naming the missing scope. Plan L333 declares a `__tests__/email-template.registry.types.test.ts` but it asserts only `@ts-expect-error` — the compiler error from a missing `EmailPropsByScope` entry is the generic `Type 'X' is missing` message, not "Add EmailScope.XXX to the registry". A helper `assertExhaustive` is not prescribed. |
| 4 | P2 | Error messages | Compiler errors from the registry will be **unactionable**: a missing `EmailPropsByScope[S]` entry produces `Property '[EmailScope.X]' is missing` on a structural literal with *no pointer* back to the `EmailPropsByScope` map. Plan does not prescribe a comment-directive or assertive helper that surfaces the mapping as the source of truth. |
| 5 | P2 | Error messages | Runtime guard message `Unknown email scope: ${scope}` (plan L314, L1284) dumps the raw enum value with **no recovery hint** (which scopes exist, where to register). |
| 6 | P2 | Error messages | GraphQL error **codes** referenced in UI flows (`VERSION_MISMATCH`, `RATE_LIMITED`, `VERSION_RESTORE_CONFLICT`, `SESSION_EXPIRED` at plan §P2/§P3/§P7) are **never declared in the plan as Pothos mutation throws** — no todo creates them. Only `EMAIL_TEMPLATES_DISABLED` is named (todo O). Existing codebase uses `extensions: { code: "UPPER_SNAKE" }` literally (auth.mutation.ts) — not a typed union, so no compile-time check that every code referenced by the UI exists backend-side. |
| 7 | P2 | Error messages | Zod validation errors are referenced (plan L895-896 RHF+Zod) but there is **no `zodErrorMap` → i18n key** wiring. The codebase has Zod schemas and `parentOnboardingSchema` etc., but no shared i18n error-map pattern; the plan doesn't fill this gap. |
| 8 | P1 | Code-gen workflow | `codegen.ts` edit is **never scheduled as a todo**. The plan adds new GraphQL scalars/enums (todo 2 / 14) and the repo's `codegen.ts` egresses both `Email` and `StringMap` scalars — but the file already has them; however, adding new **enums** to the schema surfaces automatically, so the risk is just that a new scalar (if one is needed) would silently fall to `unknown`. No todo audits `codegen.ts`. |
| 9 | P2 | Code-gen workflow | The `generate:gqlSchema` → `codegen` sequence is documented **inline** (plan L768, L801, todos 21a) but there is **no single-command dev loop** script (e.g. `bun run email:dev` that watches schema + regens types). Each doc reference repeats the two-command chain manually. |
| 10 | P2 | Code-gen workflow | No **stale-type detection**: no guard test that imports a `.generated.ts` enum and asserts equality with the TS `enum` source-of-truth, so a generated enum drift (after schema edit, pre-codegen) compiles silently. |
| 11 | P1 | Debugging | No **debug mode** for the email pipeline: `safeRender` (plan L1273-1303) logs errors only on *failure*. There is no `EMAIL_DEBUG=1` path that logs the rendered HTML (or writes it to a temp preview file) **before send**. Plan mentions `pretty` for "debug/preview paths" (L1305) but never wires a debug switch. |
| 12 | P2 | Debugging | **Preview-as-user** is only half-implemented: `previewEmailTemplate(templateId, sampleProps)` (todo 14/§P6) returns HTML for an iframe, but there is no "render with a **real recipient's data**" path (load the entity by id → render as that user would receive). `sendTest` (todo 12) takes `sampleProps` (manual JSON), not `recipientUserId`. |
| 13 | P2 | Debugging | **Isolated single-template test** has no one-liner. Plan §test strategy (L1327-1346) covers unit/integration/E2E but no `bun run test:email --scope INVOICE_GENERATED` filter or a `scripts/render-email.ts` REPL/harness to render one template with mock props and print HTML. |
| 14 | P2 | Debugging | No **GraphQL playground query list** for manual testing. Plan creates queries/mutations (todos 14, 15) but there is no committed `.graphql` scratch file or `apollo.config.json` operation list. `apollo.config.json` exists at repo root but the plan never edits it. |
| 15 | P2 | Debugging | **Apollo DevTools setup** is not documented anywhere. No onboarding doc references `@apollo/client` devtools, the `MockLink` pattern (referenced at plan L835) is test-only. |
| 16 | P1 | Component lib docs | **EmailEditor component API** is undocumented. The plan *states* the `EmailEditorRef` API surface (plan L149: `getJSON`, `getEmail`, `getEmailHtml`, `getEmailText`, `editor`) but never writes it into a doc file or JSDoc on `EmailEditorWrapper`. No `frontend/**/EmailEditor.ts` doc, no `EmailEditorRef` typed export with JSDoc anywhere (grep empty). |
| 17 | P2 | Component lib docs | **Storybook stories aren't self-documenting**: plan §K (L806-828) lists story files and CSF3 + `tags:["autodocs"]` but does **not** require a per-story `parameters.docs.description.story` string. Existing stories use bare `StoryObj<T>` (grep shows `autodocs` present, no story descriptions). |
| 18 | P1 | Component lib docs | No **merge-tag system usage guide**. The merge-tag picker is referenced (§P1 L886, §P8 L936 "merge-tag mismatch") but the system itself (how `{scope, variable}` is resolved, how `EmailPropsByScope` is introspected, allowed variables per scope) is never documented. This is a primary admin-user-facing feature. |
| 19 | P2 | Component lib docs | No **migration guide** for old `renderXxxEmail` functions. Plan L1325 says "delete `email-templates.ts` AFTER migration" and existing file (`email-templates.ts`, hardcoded hex `#1976d2`/`#2e7d32`) must be replaced — but there is no migration doc mapping old prop shape (`ComplaintResponseEmailData` with `string` dates, L12-18) to new typed props (`ComplaintResponseEmailProps` with `Date`, L224-229). |
| 20 | P1 | API docs | **GraphQL schema is not self-documenting**. No todo requires `description` strings on the new `EmailTemplatePothosObject`, `EmailTemplateInputPothosObject`, enums, queries, or mutations (todo 14). Pothos supports `description` field options; the codebase precedent is not inventoried. GraphQL introspection thus yields empty descriptions → Apollo/Playground shows unannotated schema. |
| 21 | P2 | API docs | No **REST endpoints** are documented (there are none planned for email — all GraphQL). Acceptable, but the plan should explicitly state "no REST surface — GraphQL-only" to close the question. |
| 22 | P2 | API docs | No **OpenAPI/Swagger** spec. Confirmed: no swagger/openapi packages, GraphQL-only stack. Plan should state this explicitly (see #21). |
| 23 | P2 | API docs | **Email provider API** (Resend/SES/Postmark/Mailgun/SMTP) is partially documented inside plan prose (L388-396) but **not extracted into a reusable adapter-authoring guide**. Each adapter's gotchas (Postmark base64-only, Mailgun `inline` top-level, SESv2 10MB cap, `@smithy/fetch-http-handler`) live only in the plan — a future adapter author has to re-read the plan. No `docs/email/adapters.md`. |
| 24 | P0 | Onboarding | **No single-command local bring-up** for the email system. Plan defines seeds (todo 19) and a dispatcher migration (todo 13) but there is no `bun run email:setup` / `bun run email:preview` that combines: seed default templates → start admin UI → mount standalone `react-email dev` preview. A new dev must manually sequence `bun db seed` + `bun dev` + (optional) `react-email dev`. |
| 25 | P1 | Onboarding | No **prerequisites doc** (env keys, provider accounts). `.env.example` exists with `EMAIL_PROVIDER=resend` + commented `RESEND_API_KEY`/`RESEND_FROM_EMAIL` (verified, L176-182) but there is **no doc listing required keys per provider** (Resend, SES, Postmark, Mailgun, SMTP) or how to obtain them (provider accounts, webhooks). |
| 26 | P1 | Onboarding | No **troubleshooting guide**. Pre-existing `docs/auth/REDIRECT_LOOP_FIX.md` style exists for auth; nothing for email (send failures, Resend domain-verification, sandbox mode, webhook signature verification, designJson validation rejections). |
| 27 | P2 | Onboarding | Relationship between plan **todos and actual code** is unclear: every email-related todo is `status: pending` with notes admitting "SWE review v2: was 'completed' but no code exists" (todos 1-12). There is no mapping table "todo N → file path" beyond inline plan references. A new dev cannot see at a glance which files do vs don't exist. |
| 28 | P2 | Inline docs | The `EVENT_TO_SCOPE` mapping (L677-740) is **well-commented inline** (allowlist cross-ref, null-scope rationale, Phase 4 gating) — ✅ this passes. However the **registry pattern** (L215-326) has inline rationale but no `AGENTS.md`-style extraction of the *why* (the #47109 collapse-to-`never` trap) into a standalone doc. The reasoning is buried in plan prose. |
| 29 | P2 | Inline docs | **TODOs/FIXMEs tracking** is ad-hoc: plan uses `// Phase 4`, `// (add SES… env keys)`, `// NOTE:` blocks (L377, L626, L737-739). There is no convention to grep `TODO(email)`/`FIXME(email)` to surface every email-work-in-progress item across files. |
| 30 | P2 | Inline docs | **Decision log** exists *inside* the plan (SWE review v2-v5 inline notes) but is **not extracted to a decisions doc** (e.g. `docs/email/decisions.md`). Each locked decision is captured as plan-review annotations; a maintainer reading code later can't link a comment to its rationale without grepping the plan. |
| 31 | P1 | Dev environment | No **mock email provider**. SWE plan todo 4 lists 5 REAL adapters; there is **no `MockEmailAdapter`** (logs to `console`/file instead of sending). `email-channel.test.ts` exists but the provider registry has a fixed list of real providers. A local dev without Resend keys must set `EMAIL_PROVIDER=resend` and mock at the test layer, not at the channel layer. |
| 32 | P2 | Dev environment | **Previewing emails without sending** is only via the admin iframe (todo 12 `previewHtml`) and optional `@react-email dev` standalone server (plan L139-140, deferred per todo 1). No "dry-run" flag on the dispatcher (the `EMAIL_TEMPLATES_ENABLED` flag is a *migration* gate, not a "log instead of send" switch). |
| 33 | P2 | Dev environment | **Editor in isolation**: plan §test/L853 says `mock.module`-stub `@react-email/editor` because TipTap doesn't render under Happy DOM, and §K story #10 mocks the editor in Storybook. So the editor is **not** mountable in isolation for dev — it's always mocked or in the full admin route. No `editor.dev.tsx` mount point to iterate the editor alone. |
| 34 | P2 | Dev environment | **Hot reloading for React Email components** is implied (`next dev --turbopack`, package.json L6) but not guaranteed: backend `.tsx` email components (plan L211 — first `.tsx` in backend) live under `backend/services/communication/templates/components/`. Turbopack dev targets the frontend app route; the registry's `renderEmailTemplate` runs server-side and a component edit requires a code reload, not HMR. Plan never verifies HMR for these components. |
| 35 | P2 | Build pipeline | **Build order** is implied but not consolidated: types (todo 10) → enums+pgEnums (todo 2) → schema (todo 9) → registry (todo 7) → service (todo 12) → Pothos (todo 14) → `generate:gqlSchema && codegen` (todo 21a) → frontend (todo 16). No single "phase gate checklist" lists this ordering; dependencies are scattered across todo notes. |
| 36 | P2 | Build pipeline | **Circular dependency risk**: the registry `.tsx` imports `getServerTranslations` from `@/shared/locale` (plan L1271) AND `@/shared/locale` modules import nothing from backend — confirmed one-directional (plan L1164). Low risk. But `email-template.service.ts` → `renderEmailTemplate` (registry) → React Email component → `getServerTranslations` → `emailsEn`/`emailsAr` (which the service-extended `EmailsErrorLabels` shapes) creates a cycle if the type file imports from the registry. Plan does not call out this layering boundary. |
| 37 | P1 | Build pipeline | **Tree-shaking for editor bundle**: plan §L855 + todo 20b verify code-splitting via `NEXT_BUNDLE_ANALYZER=enabled bun run build` (analyzer installed 2026-08-02, todo 20b note). GAP: the `EmailEditorWrapper` uses `ssr:false` lazy import (todo 16a/test L850) — but there is **no explicit `next/dynamic` or route-segment `ssr:false`** documented in the plan as the splitting boundary. The analyzer step verifies the *outcome* but not the *technique*. |
| 38 | P3 | Build pipeline | **Production build optimization** (minification/dead-code-elimination) is not addressed — relies on Next.js defaults. Acceptable for a v1; no specific gap unless bundle analyzer finds bloat. |
| 39 | P1 | Plan actionability | Several todos **require referencing external research files** to execute: todo 1 → `reserch_node/15-…`, todo 4 → `reserch/05-provider-registry-pattern.md`, todo 7b → V3-7 wiring, todo 12 → DOMPurify. The plan embeds enough inline code that **most** todos are self-contained, but adapter authors must still open research files for the ~200-LOC adapter details (plan L388 admits "each is realistically ~200 LOC, not ~80"). |
| 40 | P3 | Plan actionability | File paths are **relative** in the plan (e.g. `backend/enum/email/emailTemplates.enum.ts`, plan L171). Consistent and project-root-relative — acceptable, but tooling that consumes the plan would benefit from absolute or repo-anchored paths. |
| 41 | P1 | Plan actionability | **Inter-todo dependencies** are partial: todo 13 explicitly blocks on todo 3a (plan L70 note), but many more implicit deps are not graphed — todo 7 (registry) depends on todo 2 (enums), todo 6 (components), todo 10 (types); todo 12 (service) depends on todos 7/9/10/11; todo 18 (builders populate `templateProps`) depends on todo 13's `CommunicationPayload` extension (plan L531-549). No DAG or dependency column. |
| 42 | P1 | Plan actionability | **No per-phase-gate checklist**. The "Phasing recommendation" (L1352+) is explicitly "not part of plan, just framing." Phases 0-4 are referenced in notes (e.g. "Phase 0 GO/NO-GO"-21b) but there is no definition-of-done list per phase (e.g. "Phase 1 done when: enums exist, registry compiles, `event-to-scope.test.ts` green, seeds run"). |

---

## Detailed Findings per Area

### 1. TypeScript ergonomics
- **Type name consistency**: ✅ Good. `EmailTemplate{Select,Insert,Return,Submit}Type` follows the repo's canonical `{Entity}{Select,Insert,Return,Submit}Type` pattern (verified: `NotificationAlertReturnType`, `AuditLogReturnType`, `UserMeetingConfigReturnType`, etc., all use `*ReturnType`).
- **Generic param name**: `S` (plan L302, 306) is unconventional. Repo's single generic enum util uses `T` (`enum.ts:34` `parseEnumValue<T extends StringEnum>`). Recommending `TScope` would be self-documenting. **Gap #1.**
- **Type ammunition**: Low. `EmailTemplateRegistry` is a single-level mapped type `readonly [S in EmailScope]: EmailTemplateDefinition<EmailPropsByScope[S]>` — no deep nesting. `EmailTemplateProps<S>` is a one-level indexed access. Acceptable.
- **Branded/opaque types**: Repo has **zero** branded/opaque types (grep empty). The `scope as string` cast at plan L314 and `provider as EmailProviderName` at L357 are entry points where a branded `EmailScopeKey` (opaque) would prevent string leakage — a defense-in-depth opportunity the plan skips. **Gap #2.**
- **Type-level test**: Plan L333/1331 requires a `__tests__/email-template.registry.types.test.ts` with `// @ts-expect-error` assertions. But the *message* the compiler emits when a new `EmailScope` member is added without a registry entry is the structural `Property '[EmailScope.X]' is missing in type …` on the `_EMAIL_TEMPLATES` literal — it doesn't say *"register EmailScope.XXX"*. A prescribing helper (`function assertScopeRegistered<S extends EmailScope>(s: S, def: EmailTemplateDefinition<EmailPropsByScope[S]>)`) or a `satisfies`-on-`EmailPropsByScope` check would surface a pointer to the right file. **Gaps #3, #4.**

### 2. Error messages
- **Compiler errors actionable**: Partially. `Readonly<Record<NotificationEventType, EmailScope | null>>` (plan L677) *does* give a pointer-behavior (missing enum value → compile error on the Record), unlike the registry literal (which gives structural missing-property). Plan does not standardize the helper. **Gap #4.**
- **Runtime errors user-friendly**: `Unknown email scope: ${scope}` (L314, L1284) dumps raw enum; no list of valid scopes, no hint to register. Other messages route through i18n (`emailsTranslations.errors.*`, L1172-1180) — good. **Gap #5.**
- **GraphQL error codes machine-readable**: Codes `VERSION_MISMATCH`, `RATE_LIMITED`, `VERSION_RESTORE_CONFLICT`, `SESSION_EXPIRED`, `EMAIL_TEMPLATES_DISABLED` are referenced by UI flows (§P2/§P3/§P7/todo O) but **only `EMAIL_TEMPLATES_DISABLED` is created as a backend throw** (todo O). The others have no todo. Codebase precedent is ad-hoc literal `extensions: { code: "UPPER_SNAPE" }` strings (auth.mutation.ts), with no typed union → no compile-time check that every code the UI reads exists backend-side. **Gap #6.**
- **Zod errors → i18n**: Zod exists (`zod` in package.json, schemas under `backend/lib/*.validation.ts` + frontend `schemas/`). No shared `zodErrorMap`/i18n bridge. Plan §P3 uses RHF+Zod (L895) but the `z.string().email()` error string is raw Zod default, not localized. **Gap #7.**

### 3. Code generation workflow
- **`codegen.ts` edit scheduled**: ❌ No todo. The existing `codegen.ts` already maps `Email`, `StringMap` scalars (verified), so adding enums needs no edit — but this is *undocumented* and a future new scalar would silently map to `unknown`. **Gap #8.**
- **`generate:gqlSchema` → `codegen` sequence**: ✅ Documented inline at L768, L801 and scheduled as todo 21a (explicitly added per SWE v2 note L116). But only as a manual two-command chain. **Gap #9.**
- **Single-command dev loop**: ❌ No `bun run email:dev`/`gql:dev` watching `schema.graphql` and regenerating. Each reference repeats the manual pair. **Gap #9.**
- **Stale types detected**: ❌ No guard test importing a generated enum and asserting equality with the TS enum source. A drift between `EmailScope` (TS) and the generated GraphQL enum (post-schema-edit, pre-codegen) compiles with `unknown`/silent. **Gap #10.**

### 4. Debugging support
- **Debug mode for pipeline**: ❌ `safeRender` logs only on *failure* (L1298). No `EMAIL_DEBUG=1` / `EMAIL_LOG_RENDERED` switch that logs or writes rendered HTML before send. Plan L1305 mentions `pretty` for "debug/preview paths" but never wires it behind a flag. **Gap #11.**
- **Preview-as-user**: Half. `previewEmailTemplate(templateId, sampleProps)` (todo 14, §P6) takes manual JSON, not a recipient user/record fetch. No "render with real payload for userId X" path. **Gap #12.**
- **Single-template isolation**: ❌ No `scripts/render-email.ts --scope=INVOICE_GENERATED` harness and no `bun run test:email --scope=` filter. Test strategy (L1327) lists categories but no per-template CLI affordance. **Gap #13.**
- **GraphQL playground query list**: ❌ `apollo.config.json` exists at repo root but plan never edits it; no committed `.graphql` operations list for manual Playground use. **Gap #14.**
- **Apollo DevTools setup**: ❌ Not documented anywhere (no onboarding doc, no AGENTS reference). **Gap #15.**

### 5. Component library docs
- **EmailEditor component API**: ❌ Plan *states* the `EmailEditorRef` API at L149 but never records it as JSDoc on `EmailEditorWrapper.tsx` or a doc file. No `EmailEditorRef` typed export with JSDoc exists (grep empty). **Gap #16.**
- **Storybook self-doc**: Partial. Plan §K mandates `tags:["autodocs"]` (verified in existing stories) but **not** per-story `parameters.docs.description.story`. **Gap #17.**
- **Merge-tag usage guide**: ❌ Merge-tag picker is referenced (§P1 L886, §P8 L936) but the system (resolve `{scope, variable}`, introspect `EmailPropsByScope`, allowed variables) is undocumented. **Gap #18.**
- **Migration guide for old `renderXxxEmail`**: ❌ Plan L1325 says delete after migration; existing `email-templates.ts` uses `string` dates + hardcoded hex (verified L12-59) vs new typed props with `Date` (plan L224-229). No prop-shape migration map doc. **Gap #19.**

### 6. API documentation
- **GraphQL schema self-documenting**: ❌ No todo requires `description` strings on the new Pothos objects/inputs/enums/queries/mutations (todo 14 doesn't mention descriptions). Existing precedent not inventoried. **Gap #20.**
- **REST endpoints**: None planned (GraphQL-only). Plan should state this explicitly (currently silent). **Gaps #21/#22.**
- **OpenAPI/Swagger**: Not applicable (GraphQL-only); confirm no swagger package (verified empty). **Gap #22.**
- **Email provider API**: Documented only in plan prose (L388-396). No `docs/email/adapters.md` extracting adapter-authoring gotchas. **Gap #23.**

### 7. Onboarding
- **Single-command bring-up**: ❌ No `email:setup`/`email:preview` chaining seed + dev + standalone preview (todo 19 seeds, todo 13 migrates, standalone `react-email dev` deferred at todo 1). **Gap #24 (P0).**
- **Prerequisites doc**: ❌ `.env.example` has `EMAIL_PROVIDER` + commented Resend keys (verified L176-182) but no per-provider key checklist / account-acquisition doc. **Gap #25.**
- **Troubleshooting guide**: ❌ Repo has `docs/auth/REDIRECT_LOOP_FIX.md` precedent; nothing for email (send failures, Resend domain-verify, sandbox, webhook sigs). **Gap #26.**
- **Todo ↔ code relationship**: ❌ All todos `status:pending` with notes "was completed but no code exists" (todos 1-12). No "todo N → file path (exists?)" mapping table. **Gap #27.**

### 8. Inline documentation
- **Complex sections commented**: ✅ `EVENT_TO_SCOPE` map (L677-740) is well-commented (allowlist cross-ref, null-scope rationale, Phase 4 gating). Registry (L215-326) has inline rationale but the *architectural why* (#47109 collapse-to-`never`) stays plan-bound, not in `AGENTS.md`. **Gap #28.**
- **TODOs/FIXMEs tracked**: Ad-hoc `// Phase 4`, `// NOTE:` (L377, L626, L737-739). No `TODO(email)`/`FIXME(email)` convention for a single grep. **Gap #29.**
- **Decision log**: Locked decisions live as SWE-review annotations in the plan, not in `docs/email/decisions.md`. **Gap #30.**

### 9. Development environment
- **Mock email provider**: ❌ Todo 4 lists 5 real adapters; no `MockEmailAdapter`/`InMemoryEmailAdapter` (dry-run to console/file) at the channel layer. `email-channel.test.ts` mocks provider at test scope. **Gap #31.**
- **Preview without sending**: Partial — admin iframe (todo 12 `previewHtml`) + deferred optional `@react-email dev`. `EMAIL_TEMPLATES_ENABLED` is a *migration* gate, not a "log-not-send" dry-run flag. **Gap #32.**
- **Editor in isolation**: ❌ Plan mocks `@react-email/editor` in tests (L853) & Storybook (§K #10) because TipTap won't render under Happy DOM; no `editor.dev.tsx` mount to iterate the editor alone. **Gap #33.**
- **Hot reload for React Email components**: Implied by `next dev --turbopack` (package.json L6) for the *frontend* route, but the registry's server-side `.tsx` components (first backend `.tsx`, plan L211) under `backend/services/communication/templates/components/` are rendered server-side — an edit needs a server reload, not HMR. Plan never verifies HMR for these. **Gap #34.**

### 10. Build pipeline
- **Build order**: Implied (10→2→9→7→12→14→21a→16) but no consolidated phase-gate checklist. **Gap #35.**
- **Circular dependency risk**: Low — `shared → backend` is one-directional (plan L1164). But `email-template.service.ts → registry → component → getServerTranslations → emailsEn/Ar` (which the service-side `EmailsErrorLabels` shapes) could self-cycle if a type file imports the registry. Plan doesn't state the boundary. **Gap #36.**
- **Tree-shaking for editor bundle**: `NEXT_BUNDLE_ANALYZER` installed (todo 20b note) + `ssr:false` lazy import on `EmailEditorWrapper` (todo 16a/test L850), but plan never names the *split technique* (`next/dynamic` with `ssr:false` / route-segment config). Analyzer checks outcome only. **Gap #37.**
- **Production build optimization**: Relies on Next.js defaults; acceptable for v1. **Gap #38 (P3).**

### 11. Plan actionability
- **Self-contained todos**: Mostly — heavy code blocks inline. But adapter todos (todo 4, L388-396) require opening research files for the ~200-LOC detail. **Gap #39.**
- **File paths**: Relative (`backend/enum/email/…`), project-root-anchored — consistent. Absolute would be tool-friendlier. **Gap #40 (P3).**
- **Inter-todo dependencies**: Partial — todo 13↔3a is explicit (L70 note). Many implicit deps (7↔2/6/10; 12↔7/9/10/11; 18↔13's `CommunicationPayload`) are not graphed. **Gap #41.**
- **Per-phase-gate checklist**: ❌ "Phasing recommendation" explicitly "not part of plan" (L1352). No DoD list per phase. **Gap #42.**

---

## Top-5 Actionable Recommendations

1. **Add an email onboarding/troubleshooting doc (`docs/email/README.md` + `docs/email/troubleshooting.md`)** covering: per-provider env-key checklist (Resend/SES/Postmark/Mailgun/SMTP accounts + webhook setup), a single-command `bun run email:setup` script (seed + admin route), sandbox/dry-run mode, Resend domain-verification gotchas, and how to obtain provider accounts. Closes P0 gap #24 and P1 gaps #11/#25/#26.

2. **Introduce a `MockEmailAdapter` and an `EMAIL_LOG_RENDERED=1` debug path.** Add the mock adapter to `EmailProviderRegistry` gated by `EMAIL_PROVIDER=mock` (logs rendered HTML/text/attachments to a file or logger, never sends). Wire `EMAIL_LOG_RENDERED=1` (or reuse `pretty`) inside `safeRender` to log pre-send HTML. Closes P1 gaps #11/#31 and P2 gap #32.

3. **Create a `docs/email/adapters.md` + a typed `EmailErrorCode` union.** Extract the per-adapter gotchas (Postmark base64-only, Mailgun `inline` top-level, SESv2 10MB cap, `@smithy/fetch-http-handler`, nodemailer `encoding` literal-union cast) into a reusable adapter-authoring guide. Define `EmailErrorCode` (typed union consumed by both the Pothos throw sites and the frontend error handlers) so every code the UI reads (`VERSION_MISMATCH`, `RATE_LIMITED`, `VERSION_RESTORE_CONFLICT`, `SESSION_EXPIRED`, `EMAIL_TEMPLATES_DISABLED`) is compile-checked against the union. Closes P1/P2 gaps #6, #23.

4. **Make the registry's error actionable at both type and runtime levels.** (a) Rename the generic `S → TScope` for codebase consistency. (b) Add a prescribing `assertScopeRegistered<TScope extends EmailScope>(...)` helper or a `satisfies EmailPropsByScope` check on `EmailPropsByScope` so the compiler message points to the mapping file. (c) Upgrade the runtime guard to list valid scopes: `Unknown email scope: '${scope}'. Valid scopes: ${Object.values(EmailScope).join(", ")}. Register it in EmailPropsByScope and EMAIL_TEMPLATES.` (d) Add a stale-type guard test importing generated GraphQL enums and `satisfies`-asserting equality with the TS enums. Closes P2/P3 gaps #1, #3, #4, #5, #10.

5. **Add a per-phase Definition-of-Done checklist + a todo↔file mapping table + GraphQL `description` strings.** (a) Insert a DoD table per phase (e.g. "Phase 1 done: enums exist, registry compiles, `event-to-scope.test.ts` green, seeds run, `generate:gqlSchema && codegen` succeeds"). (b) Add a mapping column "todo N → target file(s) → exists? (Y/N)" so the "was completed but no code exists" status confusion (todos 1-12) is resolved at a glance. (c) Require `description` strings on every new Pothos object/input/enum/query/mutation (todo 14 amendment — Repo uses Pothos `description` field option support). Closes P1 gaps #20, #41, #42 and P2 gap #27.

---

*Report complete. 42 gaps identified: 1 P0, 9 P1, 26 P2, 6 P3.*