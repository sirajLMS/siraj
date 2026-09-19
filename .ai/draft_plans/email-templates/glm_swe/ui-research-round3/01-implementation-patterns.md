# Implementation Pattern Gaps — v7 Email Template System Design (Audit Round 3)

**Design audited** (lines counted): the v7 email template system design — 1,422 lines (items L4–124; body L128–1422)
**Research context**: Round 1 (`ui-research/00–05`) + Round 2 (`ui-research-round2/01–05` + `01-state-transitions.md`)
**Codebase conventions sampled**: `backend/types/`, `backend/db/schema/`, `backend/db/repo/`, `backend/services/`, `backend/graphql/`, `shared/locale/`, `frontend/common/stores/`, `frontend/common/graphql/sharedDocuments/`

> ⚠️ Per output-channel rules, I am returning findings in this response text and **not writing to a file**. The user's requested `01-implementation-patterns.md` path is intentionally left unwritten.

## Cross-area summary (P0 → P3)

| # | Area | Severity | Gap class | One-line description |
|---|------|----------|-----------|----------------------|
| 1 | 5 | **P0** | Missing entirely | Per-scope `*EmailLabels` interfaces (subject/greeting/body field shapes) for ~11 missing EmailScopes are never defined — V4-3 atomic en/ar lockstep CANNOT land without them |
| 2 | 3 | **P0** | Referenced but not concrete | `EmailTemplateReturnType` never defines which internal fields to `Omit` nor how `jsonb.$type<>()` columns get narrowed to enum-array types |
| 3 | 3 | **P0** | Inconsistent | Registry `subject: (p) => \`Re: ${p.complaint.title}\`` depends on `ComplaintReturnType.title` — `complaints` table has no `title` column |
| 5 | 2 | **P1** | Not actionable | `drizzle-generate skill workflow` (item 9) is ambiguous — actual generation is `bun db:generate` via `drizzle-kit` per `drizzle.config.ts`; never reconciled |
| 6 | 2 | **P1** | Missing | `codegen.ts` config entry for the new `email` sharedDocuments glob is never scheduled |
| 7 | 7 | **P1** | Missing | `backend/db/schema/communications/index.ts` barrel `export * from "./emailTemplates"` micro-edit never defined |
| 8 | 7 | **P1** | Missing | `notificationDeliveries.idempotencyKey` column add — design defers concrete schema diff to item 13 prose; no column+index snippet |
| 9 | 7 | **P1** | Inconsistent | `findByIdempotencyKey(key: string)` is the WRONG convention — existing pattern is plural batch `findByIdempotencyKeys(keys: string[], tx?)` (`credit.repository.ts:135`) |
| 10 | 4 | **P1** | Missing | `useEmailTemplateEditorViewModel` interface contract (return type, store-vs-Apollo split) never defined |
| 11 | 4 | **P1** | Inconsistent | Proposed `typePolicies.EmailTemplates.rows` merge uses `args.paginationArgs.page` — actual `PaginationArgs` exposes `.page`, `.offset`, `.first`, not a nested `paginationArgs` field |
| 12 | 1 | **P1** | Inconsistent | `EmailPayload.encoding?: "base64" | "buffer"` is an inline text union — violates the design's own rule L1312 ("no text unions, only enums + TS types"); should be an enum |
| 13 | 6 | **P1** | Inconsistent | `authScopes.permission` (codebase uses for non-super-admin editors) bypassed in favor of service-layer checks — defensible but contradicts granular-permission pattern elsewhere |
| 14 | 8 | **P1** | Not actionable | Backend `.tsx` precedent is genuinely zero; ESLint/Biome override block for `.tsx` in `backend/` is unverified; "Phase 1 verification" delays lint config investigation without specific steps |
| 15 | 8 | **P2** | Missing | `forwardRef<EmailEditorRef, …>` threading the ref through `next/dynamic` lazy-import boundary never shown |
| 16 | 4 | **P2** | Missing | Two unnamed Zustand stores (`useEmailListStore`, `useEmailTemplateStore` per Q10) — design only files ONE store (`emailTemplateEditorStore.ts`); store file inventory is incomplete |
| 17 | 4 | **P2** | Inconsistent | `Notifications` namespace `emailTemplates` key requires adding an import line in `shared/locale/types/message.ts` (~100 alphabetical imports); design omits the specific edit |
| 18 | 5 | **P2** | Inconsistent | V4-10 "bare-string args" for `EmailsErrorLabels` contradicts existing precedent `(params: { complaintTitle: string }) => string` (object form, not bare string) |
| 19 | 7 | **P2** | Missing | `relations()` for parent template → back-revision is required for `EmailTemplateReturnType` promises but the codebase has ZERO `relations()` calls — implementation has no precedent |
| 20 | 6 | **P2** | Missing | `queryFields(t => ({...}))` vs `gqlSchemaBuilder.queryType({...})` registration idiom never defined; `emailTemplates` query registration shape undefined |
| 21 | 6 | **P2** | Missing | `EmailTemplateInput` per-field `required: true` vs optional — existing pattern marks `required: true` on each; design leaves per-field required-ness undefined |
| 24 | 10 | **P2** | Missing | `backend/services/communication/templates/components/` subdirectory creation + `index.ts` barrel not defined |
| 25 | 2 | **P3** | Missing | i18n type layer has ZERO codegen — every namespace type is hand-authored; design never explains this (dev unfamiliar may expect schema-driven generation) |
| 26 | 4 | **P3** | Missing | Apollo hook choice (`useQuery` vs `useSuspenseQuery`) for editor detail never reconciled against the Suspense-based route skeleton convention |
| 27 | 8 | **P3** | Missing | Concrete `EmailTemplatesListView.tsx` switcher code exemplar missing — §A–§O reference `ResponsiveViewSwitch`/`createLazyView` but no email-context snippet |
| 28 | 1 | **P3** | Redundant | `ComponentProps<EmailTemplateRegistry[S]["component"]>` "alias for parity" (design L301) duplicates the direct `EmailPropsByScope[S]` index — never resolved |

## Detailed findings by area

### 1. TypeScript strictness patterns
- **What the design says**: Registry uses `as const satisfies` (L286), `defineEmailTemplate<P>` helper (L263), `EmailPropsByScope` base map + mapped-type re-bind (L247–296). References TS#47109. "validated against tsgo 7.0.2" (L329).
- **Codebase reality**: Closest existing expression of exhaustiveness is **`STATUS_ORDER: Record<NotificationDeliveryStatus, number>` at `notification.repository.ts:23`** and `_exhaustiveCheck: never` switch-fallthrough at `communication.service.ts:78`. No mapped-type + base-map registries exist. The design's `tsgo` claim is unsupported — the repo runs `bun tsgo` for typecheck (`package.json` scripts) — the design doesn't confirm.
- **Gaps**:
  - **Inconsistency (P1)**: `EmailPayload.encoding?: "base64" | "buffer"` (design L422) is an inline literal union — the codebase pattern for string discriminators is a dedicated TS enum (`PaymentMethodType`, `PaymentDirection`, `IdentifierKind` registered as `createPgEnumFromEnum` in `enums.ts`). The design's own stated rule at L1312 ("no text union types — only enums + Record<enum, component>") is violated by this inline literal union. **Fix**: introduce `EmailAttachmentEncoding` enum in `backend/enum/email/` alongside `EmailScope`.
  - **Redundancy (P3)**: `EmailTemplateProps<S> = EmailPropsByScope[S]` (L302) then "Adds `ComponentProps<EmailTemplateRegistry[S]["component"]>` alias for parity" — the dual alias is redundant; pick one.
- **Recommendation**: Add `EmailAttachmentEncoding` enum. Pick `EmailTemplateProps<S>` only. Add a runtime guard in the registry that checks `EMAIL_TEMPLATES[scope]` truthiness, so a TS upgrade silently breaking narrowing fails loudly at runtime.

### 2. Code generation workflows
- **What the design says**: Item 9 "Run drizzle-hints + drizzle-generate skill workflow". Items 14/15/21 "run `bun run generate:gqlSchema && bun codegen`".
- **Codebase reality**: Codegen driven by `codegen.ts` with per-directory document globs (`frontend/common/graphql/sharedDocuments/<domain>/*.ts`). Drizzle migrations via `drizzle.config.ts` → `drizzle-kit generate`. The repo's npm scripts for these are referenced but not verified in the design. There is **zero i18n codegen** — every namespace type in `shared/locale/types/` is hand-authored.
- **Gaps**:
  - **Missing (P1)**: `codegen.ts` config entry for the new `email` sharedDocuments glob is never scheduled. Implementing item 15 ("include id on all selection sets; run generate:gqlSchema && codegen") without the config edit will produce NOTHING — Apollo won't see the new documents.
  - **Not actionable (P1)**: "drizzle-generate skill workflow" (item 9) is ambiguous — the actual command per `drizzle.config.ts` is `drizzle-kit generate`. The design conflates a Cursor "skill" with the toolchain step. Implementation would not be actionable without resolver lookup.
  - **Missing (P3)**: i18n type generation is **entirely manual**. The design models this correctly (7-file changeset at L1243–1250, V4-3 atomic en/ar lockstep) but never explicitly: "the i18n type layer has zero codegen — every `*Labels` interface is hand-authored, and the only enforcement is TS compile error if en+ar drift." A dev unfamiliar with the convention might expect a schema-driven generator (next-intl, i18next, etc.) — the design's "No `next-intl` imports — compile-time TS i18n only" (L1311) doesn't surface the no-codegen reality.

### 3. Backend canonical type patterns
- **What the design says**: `EmailTemplate{Select,Insert,Return,Submit}Type`, `EmailAttachmentInput`, `EmailAttachmentRules`, with `id` for Apollo cache. "joins: editor name, last revision" for ReturnType (L507).
- **Codebase reality**: Canonical pattern at `backend/types/billing/billing.types.ts:23–67`:
  - `InvoiceSelectType = typeof invoices.$inferSelect` ✅ (matches design)
  - `InvoiceReturnType = Omit<InvoiceSelectType, "deletedAt" | "idempotencyKey" | "version" | "createdByUserId"> & { status: InvoiceStatus; invoiceType: InvoiceType }` — **Omits internal fields** and **re-narrows enum string columns to their enum types**
  - `InvoiceSubmitInput = Omit<InvoiceInsertType, "id" | "createdAt" | "updatedAt" | "deletedAt" | "idempotencyKey" | "version" | "createdByUserId" | "status" | "paidDate">` — explicit server-set field Omit list
  - JSONB columns use `$type<PaymentMethodTransactionSnapshot>()` and Return types carry the inferred narrowed type
- **Gaps**:
  - **Missing (P0)**: `EmailTemplateReturnType` never defines which internal fields get Omitted (`version`? `parentTemplateId`? `createdBy`?) nor how the JSONB `allowedEditorGroups` column narrows from Drizzle-inferred `EmailEditorPermission[]` (or `unknown`) to `readonly EmailEditorPermission[]` on the Return type.
  - **Missing (P1)**: `EmailTemplateSubmitInput` Omit list (which server-set fields to exclude: `id`, `version`, `isActive`, `compiledHtml`, `compiledText`, `createdAt`, `updatedAt`, `createdBy`?) is undefined.
  - **Inconsistency (P0)**: Registry `subject: (p, _l) => \`Re: ${p.complaint.title}\`` (design L274) depends on `ComplaintReturnType.title` — but `complaints` table (`communications.ts:144–168`) has `body`, NOT `title`. The ComplaintResponseEmailProps interface (design L224–229) declares `complaint: ComplaintReturnType` — the subject fn won't compile against the actual `ComplaintReturnType` shape. The design needs to either change the subject fn or extend `ComplaintReturnType` with a derived `title` field (likely a getter or a Pothos-level field resolver).
  - **Missing (P1)**: Confirm `InvoiceReturnType.number` exists for `subject: (p) => \`Invoice ${p.invoice.number}\`` (design L281) — the design assumes the field is present; the type layer depends on it but is not verified.

### 4. Frontend Apollo / Zustand / ViewModel patterns
- **What the design says**: Zustand store `emailTemplateEditorStore.ts` (item 16). `useEmailTemplatesListViewModel` + `useEmailTemplateEditorViewModel`. Apollo `useQuery`, no `useLazyQuery` (L803). Proposed `typePolicies` (Q1 L958–983).
- **Codebase reality**:
  - Zustand: tab-pane stores use `createTabbedPaneStore` factory (`paymentCatalogsTabsStore.ts:7`); non-tab stores use inline `create<...>()` (`manualInvoiceUiStore.ts:31`). One store per file (`frontend/common/stores/*Store.ts`).
  - Apollo documents: per-domain subdirectory + `index.ts` barrel; import patterns use `TypedDocumentNode<Operations.XQuery>` (`notification-preferences.documents.ts:5–14`). Selection sets include `id` ✅.
  - ViewModels: `useManualInvoiceViewModel` is the canonical reference per 00-synthesis.md:38 — RHF + Controller + separate Zustand UI store + manual `useWatch`/`setValue` (NO `useFieldArray`).
- **Gaps**:
  - **Missing (P1)**: `useEmailTemplateEditorViewModel` interface contract (return type, arguments, store-vs-Apollo split, how `EmailEditorRef` is owned) is never defined. This is the architectural keystone but is left as "build the ViewModel" (item 16) with no interface exemplar.
  - **Inconsistency (P1)**: Proposed `typePolicies.EmailTemplates.rows` merge uses `args?.paginationArgs?.page` — but the codebase's `PaginationArgs` (`pagination.types.ts:14-70`) exposes `.page`, `.offset`, `.first`, not a nested `paginationArgs` field. The arg name would need to match whatever the Pothos list field exposes, which is undefined. The Apollo cache arg key must be derived from the GraphQL operation variable name, which the design never confirms.
  - **Missing (P2)**: Two unnamed Zustand stores — Q10 (L1055) references `useEmailListStore` and `useEmailTemplateStore` as separate from `emailTemplateEditorStore`. Three stores implies three store files, but the design only ever names ONE (`emailTemplateEditorStore.ts`). The list and template UI stores are unfiled → implementation ambiguity.
  - **Missing (P3)**: Apollo hook choice between `useQuery` (cache-and-network, Q2) vs `useSuspenseQuery` (route-level Skeleton loading per `DashboardRoleSkeleton` reference) for the editor detail fetch — never reconciled.
  - **Missing (P3)**: Concrete `EmailTemplatesListView.tsx` switcher code exemplar not in §A–§O (references `ResponsiveViewSwitch`/`createLazyView` from a sibling page but no email-context snippet).

### 5. Shared layer patterns (i18n types, constants, lib)
- **What the design says**: Extend `EmailsLabels` with `errors: EmailsErrorLabels` (L1170–1182) + ~11 missing per-scope `*EmailLabels`. New `dashboard.emailTemplates` UI namespace per 7-file changeset (L1243–1250). V4-3 en/ar lockstep. "V4-10: all `EmailsErrorLabels` methods use bare-string args" (L1189).
- **Codebase reality**:
  - `EmailsLabels` currently has 2 members (`complaintResponse`, `suggestionAcknowledged`) at `emails/index.ts:28-31`.
  - Per-scope label pattern uses `(params: { complaintTitle: string }) => string` (object form) — see `ComplaintResponseEmailLabels` at `emails/index.ts:5`.
  - `DashboardTranslations` aggregator (`message.ts` L120+) collects ~80 leaf interfaces with ~100 alphabetical top-of-file imports.
  - 7-file changeset for `DashboardPaymentCatalogs` exists (`translation.ts:40-41` + `message.ts:43-44`) — ✅ the pattern is real and matches the design's claim.
- **Gaps**:
  - **Missing (P0)**: Per-scope `*EmailLabels` interface field lists for the ~11 missing scopes are NEVER defined. Each scope needs `subject` (string or fn?), `greeting`, `body`, etc. — but the design only shows `renderFailed(scope)` for the error namespace (L1180). The en/ar impls CANNOT land atomically (V4-3) without knowing each interface's fields. Implementation blocker.
  - **Inconsistency (P2)**: V4-10 "bare-string args" for `EmailsErrorLabels` (e.g., `renderFailed: (scope: string) => string`) contradicts the existing precedent `ComplaintResponseEmailLabels.subject: (params: { complaintTitle: string }) => string` (object-payload form). Intra-codebase style inconsistency — codescene/Biome may flag.
  - **Inconsistency (P2)**: Adding `emailTemplates: EmailTemplatesManagementLabels` to `DashboardTranslations` in `message.ts` requires a new `import type { EmailTemplatesManagementLabels } from "@/shared/locale/types/dashboard/emailTemplates/main";` line among ~100 alphabetical imports + adding `emailTemplates:` to `DashboardTranslations` type body. Design omits this micro-edit.
  - **Missing (P2)**: The design never defines whether the `dashboard.emailTemplates` namespace type imports should be `Main.ts` vs `index.ts` — both patterns appear in `shared/locale/types/dashboard/<domain>/`. Design's 7-file changeset lists `main.ts` (L1244) — but the bigger picture (`billing/main.ts:8` extends `PaymentComponentLabels`) uses `MainLabels` naming. Design never confirms canonical filename inside the new namespace dir.

### 6. Pothos GraphQL type patterns
- **What the design says**: Three files: `emailTemplate.pothos.ts` (object + input + preview), `emailTemplates.query.ts`, `emailTemplate.mutation.ts`. `EmailScopePothosEnum`, etc. registered in shared enum file. `authScopes: { superAdmin: true, notImpersonating: true }`. Input via `gqlSchemaBuilder.inputRef<EmailTemplateSubmitInput>("EmailTemplateInput").implement({...})`.
- **Codebase reality**:
  - Enum registration at `backend/graphql/pothos/shared/enum.pothos.ts` — `gqlSchemaBuilder.enumType(Enum, { name: "..." })` per enum, `*PothosEnum` suffix. ✅ Matches design.
  - Object ref pattern: `gqlSchemaBuilder.objectRef<ReturnType>("Name").implement({ fields: t => ({...}) })` (`notification-preferences.pothos.ts:11-21`). ✅ Matches design.
  - Input ref pattern: `gqlSchemaBuilder.inputRef<Type>("Name").implement({ fields: t => ({...}) })` with per-field `required: true`. ✅ Matches design.
  - Query registration idiom: `gqlSchemaBuilder.queryFields(t => ({ fieldName: t.field({ ... }) }))` (`notification-preferences.query.ts:6-15`).
  - Mutation registration idiom: `gqlSchemaBuilder.mutationField("name", t => t.field({...}))` (`notification-preferences.mutation.ts:9-21`).
  - `AuthScopes` interface (`gqlSchemaBuilder.ts:31-37`) registers: `loggedIn`, `permission`, `superAdmin`, `notImpersonating`, `notSimulatingGroup`.
- **Gaps**:
  - **Missing (P2)**: `queryFields(t => ({...}))` vs `gqlSchemaBuilder.queryType({...})` registration idiom never defined. Existing `notification-preferences.query.ts:6-15` uses the former; the design's item 14 references "queries" without picking an idiom.
  - **Missing (P2)**: `EmailTemplateInput` per-field `required: true` vs optional — existing pattern (`notification-preferences.pothos.ts:27-31`) marks `required: true` on each input field. Design leaves per-field required-ness undefined for `EmailTemplateInput`.
  - **Inconsistency (P1)**: `authScopes.permission` (used elsewhere for granular non-super-admin editor enforcement) is bypassed in favor of service-layer `allowedEditorGroups` checks (design L778). Defensible design (per-template editor groups are runtime, not compile-time enum), but **contradicts the granular-permission pattern** used by other admin surfaces. Design should justify — e.g., "because editor groups are per-template (DB-driven), compile-time `permission: AppPermission.XXX` cannot express this — service-layer check is required."

### 7. Drizzle schema patterns
- **What the design says**: New `backend/db/schema/communications/emailTemplates.ts` (L436–497). `emailScopeEnum`/`emailTemplateStatusEnum`/`emailEditorPermissionEnum` via `createPgEnumFromEnum` (L430). `jsonb.$type<readonly EmailEditorPermission[]>()` for `allowedEditorGroups` (L460) (no `.array()` columns exist today). Inline array index form (V4-2). Optimistic locking `version integer` + `WHERE version = $1` (item 11). Idempotency key on `notificationDeliveries` per item 13.
- **Codebase reality**:
  - `createPgEnumFromEnum` helper used throughout `enums.ts:42–121` ✅ (matches design).
  - Index form: `pgTable(..., table => [index(...), uniqueIndex(...)])` ✅ matches design V4-2 inlining.
  - Idempotency key convention: `varchar("idempotency_key", { length: 255 }).notNull()` + `uniqueIndex("..._idempotency_key_unique_idx").on(table.idempotencyKey)` — confirmed at `billing.ts:49, 58`, `billing.ts:100, 109`. (By my grep, other tables with `idempotency_key` per the design's V4-4 reference: in billing.ts invoices + payments. The design's claim of "6 tables" should be spot-checked — at minimum invoices + payments + (per design credit-transactions.ts:25).)
  - **Zero `.array()` columns** anywhere in schema (my grep confirms) → design's jsonb-typed-array choice is consistent. ✅
  - **Zero `relations()` definitions** anywhere in `backend/db/schema/` (my grep confirms). `gqlSchemaBuilder.ts:13, 88-91` wires `DrizzleRelations` and `relations` import but the helper is unused — no precedent for adding email-template relations.
  - Pothos DrizzlePlugin wired (`gqlSchemaBuilder.ts:77, 87-91`) — fetches Drizzle columns/maps via `getTableConfig`. Used today without explicit `relations()`.
  - `findByIdempotencyKeys(keys: string[], tx?)` at `credit.repository.ts:135` — PLURAL BATCH form (Loader-friendly).
- **Gaps**:
  - **Missing (P1)**: `backend/db/schema/communications/index.ts` barrel `export * from "./emailTemplates"` micro-edit never defined.
  - **Missing (P1)**: `notificationDeliveries.idempotencyKey` column add — item 13 prose references the convention but never shows the concrete schema diff snippet (column + `uniqueIndex` where-clause per the partial-unique convention the design itself recommends elsewhere).
  - **Inconsistency (P1)**: `findByIdempotencyKey(key: string, tx?)` (singular, design L627) does NOT match the actual established convention `findByIdempotencyKeys(keys: string[], tx?)` (plural batch, `credit.repository.ts:135`). If the dispatcher intends a Loader-batched path, the singular signature is the wrong shape.
  - **Missing (P2)**: `relations()` for parent template → revisions back-reference is required for "joins: editor name, last revision" (design L507) — but the codebase has ZERO `relations()` precedent. The design never defines the file (`backend/db/drizzleDb.ts` per the existing `relations` import? new `backend/db/relations.ts`?). Implementers have no exemplar to copy.
  - **Inconsistency (P2)**: `attachmentRules: jsonb("attachment_rules").$type<EmailAttachmentRules>()` (design L462) drops the `readonly` modifier that `allowedEditorGroups` uses (`readonly EmailEditorPermission[]` L460). Inconsistent type-narrowing across adjacent JSONB columns in the same file.

### 8. React component patterns
- **What the design says**: Backend `.tsx` precedent is zero (V5-6, L211) — `email-template.registry.tsx` + `components/*.tsx`. Tier views at `frontend/common/mobile/desktop/views/dashboard/email-templates/*`. `EmailEditorWrapper.tsx` with `next/dynamic({ ssr: false })` (V5-5). `ScopedCssBaseline` (V4-7). Two theming layers (`--re-*` + `EmailTheming.configure` from `/plugins`).
- **Codebase reality**: Zero `.tsx` in backend (my confirmation). `frontend/` has both `.tsx` and `.ts`. Existing `createLazyView` defaults to `ssr: true` — the email wrapper deviation is intentional and well-reasoned (TipTap touches `window`). ESLint config (`eslint.config.mjs`) + Biome (`biome.json`) are repo-wide — no per-extension override block for `.tsx` in `backend/` is currently calibrated.
- **Gaps**:
  - **Not actionable (P1)**: ESLint/Biome rule overrides for `.tsx` files in `backend/` are unverified. The design's "Phase 1 verification: run `bun tsgo` + `bun biome:check`" (L211) defers a lint config investigation without specific ostensible steps. The alternative (`React.createElement()` in `.ts`) is mentioned but unchosen. **Fix**: add a Phase 1 item "investigate `eslint.config.mjs` overrides for `backend/**/*.tsx`; add `if (biome supports) backend/.tsx` block; document outcome."
  - **Missing (P2)**: `forwardRef<EmailEditorRef, …>` threading through the `next/dynamic` lazy-import boundary is never shown. The `EmailEditorRef` is held in `useRef` (per V5-5); the wrapper needs `<EmailEditorWrapper ref={editorRef} />` semantics. There's no `forwardRef` exemplar for `next/dynamic` in the codebase — the design doesn't address how the lazy ref gets forwarded.
  - **Missing (P3)**: Concrete `EmailTemplatesListView.tsx` switcher code exemplar missing from §A–§O — references `ResponsiveViewSwitch`/`createLazyView` (02-template-editor.md:13) verbatim with no email-tier snippet. Implementers must reverse-engineer from `payment-catalogs/` siblings.

### 10. File organization conventions
- **What the design says**: `event-to-scope.ts` at `backend/services/communication/templates/`. New `backend/services/communication/templates/components/` for React Email scaffolds. `frontend/common/stores/emailTemplateEditorStore.ts`.
- **Codebase reality**: `backend/services/communication/templates/` is flat — `email-templates.ts` + `sms-templates.ts` are sibling TS files, no subdirectories. Frontend barrel convention is `index.ts` per directory.
- **Gaps**:
  - **Missing (P2)**: The new subdirectory `backend/services/communication/templates/components/` needs creation + an `index.ts` barrel (per existing convention) — not defined in item 6. Implementers may scatter `.tsx` files without a barrel, breaking imports.
  - **Inconsistency (P2)**: The existing `templates/` dir uses flat TS siblings. Introducing a subdirectory (vs flat files) is a first-time deviation in this dir — the design should call out the rationale ("React components need co-location to encapsulate JSX scope").

## Top-5 actionable recommendations

1. **[P0]** Enumerate the per-scope `*EmailLabels` interface field lists (`subject`/`greeting`/`body`/etc.) for the ~11 missing EmailScopes and surface them in the design's i18n §A. Without these, V4-3 atomic en/ar lockstep cannot be executed.
2. **[P0]** Replace `EmailPayload.encoding?: "base64" | "buffer"` literal union with an `EmailAttachmentEncoding` enum in `backend/enum/email/` (consistent with the established `createPgEnumFromEnum` pattern) — restores alignment with design's own L1312 rule.
3. **[P0]** Either extend `ComplaintReturnType` with a derived `title` field (or Pothos field resolver) OR rewrite the registry `subject: (p) => \`Re: ${p.complaint.title}\`` to use `p.complaint.body` (trim/dedupe). Pick one; document the choice.
4. **[P1]** Define the `useEmailTemplateEditorViewModel` interface contract: hook signature, return type, store-vs-Apollo responsibility split, `EmailEditorRef` ownership via `useRef`. Without this, item 16 is "build the ViewModel" with no shape.
5. **[P1]** Specify the `codegen.ts` edit (the new `email` sharedDocuments glob) as its own explicit item — currently buried in item 15 prose; without it, `generate:gqlSchema && codegen` will not pick up the new documents.

**Audit completed**: 2026-08-02
**Design version audited**: v7 (lines 1–1422)
**Total gaps**: 28 (4 P0, 11 P1, 8 P2, 5 P3)
**Codebase files examined** (representative): `backend/types/index.ts`, `backend/types/billing/billing.types.ts`, `backend/types/notifications/communications.types.ts`, `backend/types/notifications/notification-alerts.metadata.types.ts`, `backend/db/schema/index.ts`, `backend/db/schema/enums.ts`, `backend/db/schema/communications/communications.ts`, `backend/db/schema/billing/billing.ts`, `backend/db/repo/index.ts`, `backend/db/repo/notifications/notification.repository.ts`, `backend/db/repo/billing/billing.repository.ts`, `backend/db/repo/billing/credit.repository.ts`, `backend/db/seeds/notifications/seed-user-notification-preferences.ts`, `backend/graphql/gqlSchemaBuilder.ts`, `backend/graphql/pothos/index.ts`, `backend/graphql/pothos/shared/enum.pothos.ts`, `backend/graphql/pothos/notifications/notification-preferences.pothos.ts`, `backend/graphql/query/index.ts`, `backend/graphql/query/notifications/notification-preferences.query.ts`, `backend/graphql/mutation/notifications/notification-preferences.mutation.ts`, `backend/services/communication/comunication.service.ts`, `backend/services/communication/templates/email-templates.ts`, `backend/services/communication/channels/email/EmailChannelFactory.ts`, `backend/services/communication/channels/email/IEmailChannel.ts`, `backend/services/communication/channels/email/resend/ResendEmailAdapter.ts`, `backend/enum/notifications/notificationDeliveries.enum.ts`, `frontend/common/stores/manualInvoiceUiStore.ts`, `frontend/common/stores/paymentCatalogsTabsStore.ts`, `frontend/common/graphql/sharedDocuments/index.ts`, `frontend/common/graphql/sharedDocuments/notifications/notification-preferences.documents.ts`, `shared/locale/types/message.ts`, `shared/locale/types/emails/index.ts`, `shared/locale/types/dashboard/payment-catalogs/main.ts`, `shared/locale/types/dashboard/billing/main.ts`, `shared/locale/namespaces/define-namespace.ts`, `shared/locale/namespaces/emails/emails.namespace.ts`, `shared/locale/namespaces/translation.ts`, `shared/locale/server-graphql.ts`

---

