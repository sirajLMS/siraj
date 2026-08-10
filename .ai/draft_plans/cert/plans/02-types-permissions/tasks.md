# Plan 02 — Types & Permissions: Tasks

> **Feature**: Certificate Module — Types, Enums, and Permissions
> **Plan #**: 02
> **Dependencies**: Plan 1 (DB Schema & Enums) — provides Drizzle table definitions
> **Execution Model**: Parallel subagents per independent task group (see dependency graph for parallelization points)
> **Quality Model**: Per-file progressive verification via `scripts/health/sub-loop.ts --lifecycle codescene` (runs tsgo → biome → lint → codescene in one command, short-circuiting on first failure)
> **Time Budget**: 2-4 hours per task

---

## Task Dependency Graph

```
T01 (enums in backend/enum) ──→ T02 (entity types: Template)
                               ├─→ T03 (entity types: Certificate)
                               ├─→ T04 (entity types: Category)
                               ├─→ T05 (entity types: Element, Variable)
                               ├─→ T06 (entity types: RecipientGroup, Item, ItemVarVal)
                               ├─→ T07 (entity types: Verification, StylePreset)
                               │
                               ├─→ T08 (filter/sort/pagination types)
                               │
                               ├─→ T09 (AppPermission entries)
                               ├─→ T10 (permission group mappings)
                               │
                               ├─→ T11 (barrel exports)
                               ├─→ T12 (i18n error keys)
                               │
                               └─→ T13 (knowledge propagation)
```

**Execution order**: T01 → T02 → (T03, T04, T05, T06, T07 via parallel subagents after T02) → T08 → T09 → T10 → T11 → T12 → T13

---

## Parallel Subagent Strategy

Tasks grouped by wave (each wave runs as parallel subagents):

### Wave 1: T01
- Tasks: T01
- Rationale: Foundation task — all other tasks depend on the 11 certificate TS enums. Must complete before any type or permission work begins.

### Wave 2: T02, T09
- Tasks: T02, T09
- Rationale: Both depend only on T01 (enums exist). T02 creates template type definitions; T09 registers AppPermission entries. No interdependencies between them — safe to run as parallel subagents.

### Wave 3: T03, T04, T05
- Tasks: T03, T04, T05
- Rationale: T03 depends on T02 (CertificateReturnType needs TemplateReturnType). T04 depends on T01+T02 (category types reference TemplateReturnType). T05 depends on T02 (element/variable types reference TemplateReturnType). All three only need T02 complete and have no mutual dependencies — safe to run as parallel subagents.

### Wave 4: T06, T07
- Tasks: T06, T07
- Rationale: T06 depends on T02+T05 (recipient group item variable values reference TemplateVariableReturnType from T05). T07 depends on T03 (verification types reference CertificateReturnType from T03). T06 needs T05 complete; T07 needs T03 complete. Both satisfied after Wave 3. No mutual dependency between T06 and T07 — safe to run as parallel subagents.

### Wave 5: T08, T10, T12
- Tasks: T08, T10, T12
- Rationale: T08 depends on T02–T07 (all entity ReturnTypes exist for filter/sort types). T10 depends on T09 (AppPermission entries exist for group mappings). T12 depends on T01+T09 (enums and permissions exist for i18n key schemas). All dependencies satisfied after Wave 4. No mutual dependencies among T08, T10, T12 — safe to run as parallel subagents.

### Wave 6: T11
- Tasks: T11
- Rationale: Barrel exports depend on T01–T08 (all types and enums must exist). T08 completes in Wave 5, unblocking T11. Runs alone since no other task is ready at this dependency level.

### Final Wave: Knowledge Propagation
- Task: T13
- Rationale: Must run after all other tasks complete — aggregates outcomes from T01–T12 into documentation and knowledge base.

> **Subagent dispatch**: Each task in a wave is dispatched as a separate subagent. The orchestrator waits for all subagents in a wave to complete before starting the next wave.

---

## T01 — Register Certificate Enums in backend/enum/

**Estimated time**: 2 hours
**Depends on**: Plan 1 complete (pgEnums exist in schema)
**Requirements**: REQ-ENUM-001 through REQ-ENUM-012, AC-01, AC-02

### Subtasks

1. **Read applicable AGENTS.md**:
   - `backend/enum/AGENTS.md` — enum registration rules, metadata pattern
   - `backend/AGENTS.md` — root backend rules
   - `shared/AGENTS.md` — shared layer constraints (enums cross-layer)

2. **Read applicable instruction files**:
   - `.github/instructions/backend.instructions.md`

3. **Create** the certificate TS enum files under **`backend/enum/certificates/`** (the subtask title below previously said "Define TypeScript re-exports for all 11 pgEnums from Plan 1's schema" — CORRECTED: `backend/enum/` houses **TypeScript** enums, which are the SOURCE OF TRUTH that `createPgEnumFromEnum` derives PG values from; the PG pgEnums themselves live in `backend/db/schema/enums.ts` per Plan 1). Verified pattern: `backend/enum/students/student-lifecycle.enum.ts` is a bare `export enum X {...}` plus an optional `ALLOWED_*_TRANSITIONS` const — NO inline display-label metadata (display labels live in the i18n layer per T12).
   - Create `backend/enum/certificates/index.ts` as a barrel that `export * from "./certificate.enum"; export * from "./template.enum";` (matching the verified `backend/enum/billing/index.ts` barrel pattern).
   - Define all 11 enumerated types required by Plan 1's pgEnum registry, with members/values EXACTLY matching the snake_case PG values listed in Plan 1's `enums.ts` **(authoritative source: Plan 01 `requirements.md` §3.1 REQ-01-150 — DO NOT invent values; `createPgEnumFromEnum` derives `Object.values(<Enum>)` so TS values MUST equal the PG enum values)**:
      - `CertificateTemplateStatus` → DRAFT="draft", REVIEW="review", PUBLISHED="published", ARCHIVED="archived"
      - `CertificateOrientation` → LANDSCAPE="landscape", PORTRAIT="portrait"
      - `CertificateBackgroundType` → COLOR="color", IMAGE="image", GRADIENT="gradient"
      - `TemplateElementType` → STATIC_TEXT="static_text", DATA_TEXT="data_text", DATA_DATE="data_date", IMAGE="image", QR_CODE="qr_code", SHAPE="shape"
      - `TemplateVariableType` → TEXT="text", NUMBER="number", DATE="date", SELECT="select"
      - `CertificateRecipientGroupStatus` → ACTIVE="active", INACTIVE="inactive", COMPLETED="completed"
      - `CertificateRecipientItemStatus` → PENDING="pending", PROCESSING="processing", ISSUED="issued", FAILED="failed", SKIPPED="skipped"
      - `CertificateStatus` → DRAFT="draft", PENDING="pending", ISSUED="issued", REVOKED="revoked", EXPIRED="expired"
      - `CertificateGenerationStatus` → PENDING="pending", PROCESSING="processing", COMPLETED="completed", FAILED="failed"
      - `CertificateVerificationMethod` → QR_CODE="qr_code", LINK="link", MANUAL="manual"
      - `CertificateVerificationResult` → VALID="valid", INVALID="invalid", REVOKED="revoked", EXPIRED="expired", NOT_FOUND="not_found"
   - Also define a TS-only **union type** (NOT an enum consumed by `createPgEnumFromEnum`): `FontFamily = "Amiri" | "Cairo" | "Tajawal" | "Noto Naskh" | "Inter" | "Roboto" | "System Default"`. The `fontFamily` column on `certificate_templates` is plain `text` (Plan 01 REQ-01-020) — there is NO `font_family` pgEnum to register.
   - Also define a `CertificateStatus`-specific `ALLOWED_STATUS_TRANSITIONS` and a `CertificateTemplateStatus` `ALLOWED_TEMPLATE_STATUS_TRANSITIONS` readonly Record lookup, mirroring `backend/enum/students/student-lifecycle.enum.ts:ALLOWED_STATUS_TRANSITIONS`.
   - Also define a `CertificateStatus`-specific `ALLOWED_STATUS_TRANSITIONS` and a `CertificateTemplateStatus` `ALLOWED_TEMPLATE_STATUS_TRANSITIONS` readonly Record lookup, mirroring `backend/enum/students/student-lifecycle.enum.ts:ALLOWED_STATUS_TRANSITIONS`.
   - DO NOT define any Arabic/English label metadata in these files — display labels are added in T12 via the `shared/locale/` i18n system (`requirements.md` REQ-ENUM-020..022, REQ-I18N-003). The previous instruction "Follow the existing `backend/enum/` pattern for metadata (label, labelAr, description, descriptionAr per enum value)" was incorrect — verified existing `backend/enum/` files contain NO inline label metadata.


4. **Modify** `backend/enum/index.ts`:
   - Add `export * from "./certificates"`

### Quality Loop

For each file:
```bash
bun run scripts/health/sub-loop.ts backend/enum/certificates/index.ts --lifecycle codescene
bun run scripts/health/sub-loop.ts backend/enum/index.ts --lifecycle codescene
```

### Verification
- All 11 TypeScript enums exported
- No `label/labelAr/description/descriptionAr` fields co-located in the enum files (display labels are added in T12 via `shared/locale/`)
- Per-file quality loop passes with zero type errors

---

## T02 — Create certificate_templates Type Definitions

**Estimated time**: 3 hours
**Depends on**: T01 (enums exist for ReturnType re-application)
> **Parallelizable**: This task runs as a subagent in Wave 2 alongside T09.
**Requirements**: REQ-TYPE-001, REQ-TYPE-002, REQ-TYPE-003, REQ-TYPE-004, AC-03

### Subtasks

1. **Read applicable AGENTS.md**:
   - `backend/types/AGENTS.md` — canonical type naming conventions, ReturnType pattern
   - `backend/AGENTS.md`

2. **Read** one existing type file for pattern reference (e.g., `backend/types/student.types.ts` or similar)

3. **Create** `backend/types/certificates/template.types.ts`:
   - `TemplateSelectType` — `typeof certificateTemplates.$inferSelect`
   - `TemplateInsertType` — `typeof certificateTemplates.$inferInsert`
   - `TemplateReturnType` — Omit: deletedAt, re-apply: CertificateTemplateStatus, CertificateOrientation, CertificateBackgroundType, add: category (resolved CategoryReturnType | null), elements (TemplateElementReturnType[]), variables (TemplateVariableReturnType[])
   - `TemplateSubmitInput` — Omit: id, createdAt, updatedAt, deletedAt, version; keep: name, nameAr, description, descriptionAr, categoryId, orientation, widthPx, heightPx, backgroundType, backgroundColor, backgroundImageStorageId, fontFamily, fontFamilyAr, titleText, titleTextAr, bodyText, bodyTextAr

### Quality Loop
```bash
bun run scripts/health/sub-loop.ts backend/types/certificates/template.types.ts --lifecycle codescene
```

### Verification
- Four canonical types defined (Select, Insert, Return, Submit)
- ReturnType re-applies enum types from T01
- ReturnType omits deletedAt
- SubmitInput omits system fields

---

## T03 — Create certificates Type Definitions

**Estimated time**: 2 hours
**Depends on**: T02 (TemplateReturnType exists for certificate join)
> **Parallelizable**: This task runs as a subagent in Wave 3 alongside T04, T05.
**Requirements**: REQ-TYPE-005 through REQ-TYPE-008, AC-04

### Subtasks

1. **Create** `backend/types/certificates/certificate.types.ts`:
   - `CertificateSelectType` — `typeof certificates.$inferSelect`
   - `CertificateInsertType` — `typeof certificates.$inferInsert`
   - `CertificateReturnType` — Omit: deletedAt, re-apply: CertificateStatus, CertificateGenerationStatus, add: template (TemplateReturnType | null), student (StudentReturnType | null), verifications (CertificateVerificationReturnType[])
   - `CertificateSubmitInput` — Omit: id, createdAt, updatedAt, deletedAt, pdfStorageId, pdfUrl, generatedAt, verificationCode, generationStatus

### Quality Loop
```bash
bun run scripts/health/sub-loop.ts backend/types/certificates/certificate.types.ts --lifecycle codescene
```

---

## T04 — Create certificate_categories Type Definitions

**Estimated time**: 2 hours
**Depends on**: T01 (enums), T02 (TemplateReturnType for category.children)
> **Parallelizable**: This task runs as a subagent in Wave 3 alongside T03, T05.
**Requirements**: REQ-TYPE-009, AC-05

### Subtasks

1. **Create** `backend/types/certificates/category.types.ts`:
   - `CategorySelectType`, `CategoryInsertType`
   - `CategoryReturnType` — Omit: deletedAt, add: parent (CategoryReturnType | null), children (CategoryReturnType[]), templates (TemplateReturnType[])
   - `CategorySubmitInput` — Omit: id, createdAt, updatedAt, deletedAt

### Quality Loop
```bash
bun run scripts/health/sub-loop.ts backend/types/certificates/category.types.ts --lifecycle codescene
```

---

## T05 — Create template_elements & template_variables Type Definitions

**Estimated time**: 3 hours
**Depends on**: T02 (TemplateReturnType exists)
> **Parallelizable**: This task runs as a subagent in Wave 3 alongside T03, T04.
**Requirements**: REQ-TYPE-010 through REQ-TYPE-015, AC-06

### Subtasks

1. **Create** `backend/types/certificates/templateElement.types.ts`:
   - `TemplateElementSelectType`, `TemplateElementInsertType`
   - `TemplateElementReturnType` — re-apply: CertificateElementType, add: variable (TemplateVariableReturnType | null)
   - `TemplateElementSubmitInput` — Omit: id, createdAt, updatedAt

2. **Create** `backend/types/certificates/templateVariable.types.ts`:
   - `TemplateVariableSelectType`, `TemplateVariableInsertType`
   - `TemplateVariableReturnType` — re-apply: CertificateVariableType
   - `TemplateVariableSubmitInput` — Omit: id, createdAt, updatedAt

3. **Verify** cross-references between Element and Variable ReturnType resolve

### Quality Loop
```bash
bun run scripts/health/sub-loop.ts backend/types/certificates/templateElement.types.ts --lifecycle codescene
bun run scripts/health/sub-loop.ts backend/types/certificates/templateVariable.types.ts --lifecycle codescene
```

---

## T06 — Create Recipient Group, Item, and Item Variable Value Type Definitions

**Estimated time**: 3 hours
**Depends on**: T02 (TemplateReturnType), T05 (TemplateVariableReturnType)
> **Parallelizable**: This task runs as a subagent in Wave 4 alongside T07.
**Requirements**: REQ-TYPE-016 through REQ-TYPE-022, AC-07

### Subtasks

1. **Create** `backend/types/certificates/recipientGroup.types.ts`:
   - `RecipientGroupSelectType`, `RecipientGroupInsertType`
   - `RecipientGroupReturnType` — Omit: deletedAt, re-apply: CertificateRecipientGroupStatus, add: template (TemplateReturnType | null), items (RecipientGroupItemReturnType[])
   - `RecipientGroupSubmitInput` — Omit: id, createdAt, updatedAt, deletedAt, totalRecipients, generatedCount

2. **Create** `backend/types/certificates/recipientGroupItem.types.ts`:
   - `RecipientGroupItemSelectType`, `RecipientGroupItemInsertType`
   - `RecipientGroupItemReturnType` — re-apply: CertificateRecipientItemStatus, add: group (RecipientGroupReturnType | null), student (StudentReturnType | null), certificate (CertificateReturnType | null), variableValues (RecipientGroupItemVariableValueReturnType[])
   - `RecipientGroupItemSubmitInput` — Omit: id, createdAt, updatedAt, status, errorMessage, certificateId

3. **Create** `backend/types/certificates/recipientGroupItemVariableValue.types.ts`:
   - `RecipientGroupItemVariableValueSelectType`, `RecipientGroupItemVariableValueInsertType`
   - `RecipientGroupItemVariableValueReturnType` — add: variable (TemplateVariableReturnType | null)
   - `RecipientGroupItemVariableValueSubmitInput` — Omit: id, createdAt, updatedAt

### Quality Loop
```bash
bun run scripts/health/sub-loop.ts backend/types/certificates/recipientGroup.types.ts --lifecycle codescene
bun run scripts/health/sub-loop.ts backend/types/certificates/recipientGroupItem.types.ts --lifecycle codescene
bun run scripts/health/sub-loop.ts backend/types/certificates/recipientGroupItemVariableValue.types.ts --lifecycle codescene
```

---

## T07 — Create certificate_verifications & template_style_presets Type Definitions

**Estimated time**: 2 hours
**Depends on**: T03 (CertificateReturnType exists)
> **Parallelizable**: This task runs as a subagent in Wave 4 alongside T06.
**Requirements**: REQ-TYPE-023, REQ-TYPE-024, AC-08

### Subtasks

1. **Create** `backend/types/certificates/certificateVerification.types.ts`:
   - `CertificateVerificationSelectType`, `CertificateVerificationInsertType`
   - `CertificateVerificationReturnType` — re-apply: CertificateVerificationMethod, CertificateVerificationResult, add: certificate (CertificateReturnType | null)
   - `CertificateVerificationSubmitInput` — Omit: id, createdAt (append-only log — only method, result, ipAddress, userAgent, certificateId are user-controllable)

2. **Create** `backend/types/certificates/templateStylePreset.types.ts`:
   - `TemplateStylePresetSelectType`, `TemplateStylePresetInsertType`
   - `TemplateStylePresetReturnType` — no Omit (no soft-delete), no enum re-apply
   - `TemplateStylePresetSubmitInput` — Omit: id, createdAt, updatedAt

### Quality Loop
```bash
bun run scripts/health/sub-loop.ts backend/types/certificates/certificateVerification.types.ts --lifecycle codescene
bun run scripts/health/sub-loop.ts backend/types/certificates/templateStylePreset.types.ts --lifecycle codescene
```

---

## T08 — Create Filter, Sort, and Pagination Types

**Estimated time**: 3 hours
**Depends on**: T02 through T07 (entity ReturnTypes exist)
> **Parallelizable**: This task runs as a subagent in Wave 5 alongside T10, T12.
**Requirements**: REQ-TYPE-025 through REQ-TYPE-030, AC-09

### Subtasks

1. **Create** `backend/types/certificates/filters.types.ts`:
   - `CertificateTemplateFilters` — categoryId?, status?, orientation?, backgroundType?, searchQuery? (for FTS)
   - `CertificateFilters` — templateId?, studentId?, status?, generationStatus?, searchQuery?, dateFrom?, dateTo?
   - `CategoryFilters` — parentId?, searchQuery?
   - `RecipientGroupFilters` — templateId?, status?, searchQuery?
   - Each filter type: combination of equality filters, range filters, and FTS searchQuery string
   - Sort types: `CertificateTemplateSort`, `CertificateSort`, `CategorySort`, `RecipientGroupSort` — enum of sort field + direction

2. **Create** `backend/types/certificates/pagination.types.ts`:
   - `CertificatePaginationInput` — standard limit/offset/cursor pattern matching Siraj convention
   - `CertificatePaginationResult<T>` — items[], totalCount, hasNextPage, cursor

### Quality Loop
```bash
bun run scripts/health/sub-loop.ts backend/types/certificates/filters.types.ts --lifecycle codescene
bun run scripts/health/sub-loop.ts backend/types/certificates/pagination.types.ts --lifecycle codescene
```

---

## T09 — Register AppPermission Entries

**Estimated time**: 2 hours
**Depends on**: T01 (enums exist for permission metadata)
> **Parallelizable**: This task runs as a subagent in Wave 2 alongside T02.
**Requirements**: REQ-PERM-001 through REQ-PERM-011, AC-10, AC-11

### Subtasks

1. **Read applicable AGENTS.md**:
   - `backend/enum/AGENTS.md` — AppPermission pattern
   - Read existing `AppPermission` enum in `backend/enum/` for pattern

2. **Modify** the `AppPermission` enum at **`backend/enum/permissions/permission.enum.ts`** — verified location: existing enum spans the file (lines roughly 1–249) and uses dot-path string values (e.g. `BILLING_CREATE_INVOICE = "billing.create_invoice"`). Add the 11 new permission entries following the SAME dot-path convention. Refer to `requirements.md` §4 REQ-PERM-001..011 for the CANONICAL 11 entry keys + values (the short-name list below is a leftover from an earlier draft; if it conflicts with `requirements.md`, trust `requirements.md`).
   - Add 11 new permission entries (canonical dotted form per requirements.md):
      - `CERTIFICATES_VIEW = "certificates.view"`
      - `CERTIFICATES_MANAGE = "certificates.manage"`
      - `CERTIFICATES_REVOKE = "certificates.revoke"`
      - `CERTIFICATES_VERIFY = "certificates.verify"`
      - `CERTIFICATES_GENERATE = "certificates.generate"`
      - `CERTIFICATES_BULK_GENERATE = "certificates.bulk_generate"`
      - `CERTIFICATES_TEMPLATES_MANAGE = "certificates.templates.manage"`
      - `CERTIFICATES_TEMPLATES_VIEW = "certificates.templates.view"`
      - `CERTIFICATES_TEMPLATES_PUBLISH = "certificates.templates.publish"`
      - `CERTIFICATES_CATEGORIES_MANAGE = "certificates.categories.manage"`
      - `CERTIFICATES_RECIPIENT_GROUPS_MANAGE = "certificates.recipient_groups.manage"`
   - Place each new entry near its alphabetically-grouped position to minimize diff churn (mirrors how existing billing/auth entries are grouped).
   - The auto-derivation helper `filterKnownAppPermissions(Object.values(AppPermission))` will pick up the new keys automatically — confirm no exhaustive `switch` over `AppPermission` anywhere breaks the build.

3. **Metadata**: The existing `backend/enum/permissions/permission.enum.ts` contains NO inline `label/labelAr/description/descriptionAr` metadata. Display metadata for permissions is stored on the `permissions` DB table (`backend/db/schema/permissions/permissions.ts`: `description: jsonb().$type<LocalizedString>()`, `category: jsonb().$type<LocalizedString>()`) and seeded through the permissions seed fixture + the `certificates.permissions.*` i18n namespace (T12). Therefore:
   - DO NOT add inline metadata to the enum file.
   - The Dutch/Arabic/English permission display rows are added via the seed/insert step in T10 (permission-group mappings) and the i18n namespace in T12.
### Quality Loop
```bash
bun run scripts/health/sub-loop.ts backend/enum/permissions/permission.enum.ts --lifecycle codescene
```

### Verification
- 11 new AppPermission entries added
   - NO inline metadata in enum file (metadata is on `permissions` DB table + i18n `certificates.permissions.*` namespace — see T12)

---

## T10 — Define Permission Group Mappings

**Estimated time**: 2 hours
**Depends on**: T09 (AppPermission entries exist)
**Requirements**: REQ-PERM-012 through REQ-PERM-016, AC-12

### Subtasks

1. **Read** existing permission group definitions and mapping patterns

2. **Create or modify** permission group default mapping:
    - `super_admin`: All 11 certificate permissions (`certificates.view`, `certificates.manage`, `certificates.revoke`, `certificates.verify`, `certificates.templates.view`, `certificates.templates.manage`, `certificates.templates.publish`, `certificates.categories.manage`, `certificates.recipient_groups.manage`, `certificates.generate`, `certificates.bulk_generate`)
    - `academy_admin`: All 11 certificate permissions (same set as super_admin)
    - `staff_default`: `certificates.verify`, `certificates.view`, `certificates.templates.view`
    - `teacher_default`: `certificates.verify`, `certificates.view`, `certificates.templates.view`
    - `parent_default`: (none — parents access certs through student-scoped reads, not through cert permissions)
    - `student_default`: (none — own certificates via student-scoped read; public verification uses separate endpoint)
    > **Group-slug authoritative list**: verify the system-group slug names against the existing `permission_groups` seed fixture (canonical hierarchy uses lowercase snake slugs like `super_admin`/`academy_admin`/`staff_default`/`teacher_default`/`parent_default`/`student_default`). The draft `SUPERVISOR`/`STUDENT`/`GUEST` UPPER-case group keys (and the legacy `CERT_*` permission aliases like `CERT_TEMPLATE_MANAGE`, `CERT_STYLE_PRESET_MANAGE`, `CERT_TEMPLATE_EDITOR_ACCESS` — all three have NO matching `AppPermission` entry) were draft leftovers and have been replaced here with the canonical `certificates.*` keys and real slugs.

### Quality Loop
```bash
bun run scripts/health/sub-loop.ts <modified-file> --lifecycle codescene
```

---

## T11 — Create Barrel Exports

**Estimated time**: 1 hour
**Depends on**: T01 through T08 (all types and enums exist)
**Requirements**: REQ-TYPE-031, AC-13

### Subtasks

1. **Create** `backend/types/certificates/index.ts`:
   - Re-export all type files: template.types, certificate.types, category.types, templateElement.types, templateVariable.types, recipientGroup.types, recipientGroupItem.types, recipientGroupItemVariableValue.types, certificateVerification.types, templateStylePreset.types, filters.types, pagination.types

2. **Modify** `backend/types/index.ts`:
   - Add `export * from "./certificates"`

3. **Verify** `import { CertificateTemplateReturnType, CertificateReturnType, CertificateCategoryReturnType } from "@/backend/types"` works (canonical billing-style full-table-name-derived ReturnType names — verified against `backend/types/billing/billing.types.ts` `InvoiceReturnType`).
4. **Verify** `import { CertificateStatus, CertificateTemplateStatus, CertificateOrientation } from "@/backend/enum"` works (the top-level enum barrel propagates certificate enums via `export * from "./certificates"`).

### Quality Loop
```bash
bun run scripts/health/sub-loop.ts backend/types/certificates/index.ts --lifecycle codescene
bun run scripts/health/sub-loop.ts backend/types/index.ts --lifecycle codescene
```

---

## T12 — Create i18n Error Key Schemas

**Estimated time**: 2 hours
**Depends on**: T01 (enums exist), T09 (permissions exist)
**Requirements**: REQ-I18N-001, REQ-I18N-002, AC-14, AC-15

### Subtasks

1. **Read applicable AGENTS.md**:
   - `shared/AGENTS.md` — i18n compile-time TypeScript system rules

2. **Create the per-domain sub-directory layout** (verified reality: the codebase organizes locale layers by domain sub-directory — `shared/locale/{types,namespaces,en,ar}/{auth,common,dashboard,emails,errors,notifications,...}/`; the flat-file scheme `shared/locale/certificates.permissions.ts` does NOT exist anywhere in the codebase). Maps to design §2.11 namespaces exactly:
   - **Type schema**: `shared/locale/types/certificates/permissions.ts` (one function type per permission display key) + `shared/locale/types/certificates/enums.ts` (one key per value across all 11 enums).
   - **Namespace registration**: `shared/locale/namespaces/certificates/permissions.ts` and `shared/locale/namespaces/certificates/enums.ts` (register the loader config via `defineNamespace(id, config)` per `shared/locale/AGENTS.md`).
   - Keys (permissions schema): `unauthorized` `() => string`, `insufficientPermission` `(permission: string) => string`, `moduleDisabled` `() => string`. Pluralized: `categoriesRequired` `(count: number) => string` (English `one`/`other`; Arabic all 6 CLDR forms).
   - Keys (enums schema): one function key per `(Enum,value)` pair (e.g. `certificateStatusDraft () => string`, `templateStatusReview () => string`, …) covering all 11 enums × their value counts (design §4.1 enum table).

3. **Create** `shared/locale/en/certificates/permissions.ts` and `shared/locale/en/certificates/enums.ts` — English implementations matching the type schemas (pluralization `one`/`other`).

4. **Create** `shared/locale/ar/certificates/permissions.ts` and `shared/locale/ar/certificates/enums.ts` — Arabic implementations with all six CLDR plural forms (`zero`/`one`/`two`/`few`/`many`/`other`) for pluralized keys per Arabic plural rules.

5. **Backend repo errors**: do NOT create a `certificates.errors` per-type file here. Backend repositories accept the single aggregate `tErrors: ErrorsLabels` from `getServerTranslations(locale)` (`shared/locale/server-graphql.ts:3`) — extending that aggregate (`shared/locale/types/errors/index.ts`) with a `certificates: CertificateErrors` sub-interface is **Plan 03's** responsibility. The `certificates.errors.*` namespaces scoped here are for **frontend/service-layer message display**, NOT for backend repo parameter binding.

### Quality Loop
```bash
bun run scripts/health/sub-loop.ts shared/locale/types/certificates/permissions.ts --lifecycle codescene
bun run scripts/health/sub-loop.ts shared/locale/types/certificates/enums.ts --lifecycle codescene
bun run scripts/health/sub-loop.ts shared/locale/namespaces/certificates/permissions.ts --lifecycle codescene
bun run scripts/health/sub-loop.ts shared/locale/namespaces/certificates/enums.ts --lifecycle codescene
bun run scripts/health/sub-loop.ts shared/locale/en/certificates/permissions.ts --lifecycle codescene
bun run scripts/health/sub-loop.ts shared/locale/en/certificates/enums.ts --lifecycle codescene
bun run scripts/health/sub-loop.ts shared/locale/ar/certificates/permissions.ts --lifecycle codescene
bun run scripts/health/sub-loop.ts shared/locale/ar/certificates/enums.ts --lifecycle codescene
```


## T13 — Knowledge Propagation & Documentation

**Estimated time**: 2 hours
**Depends on**: T01 through T12 complete
**Requirements**: Feature 6 (Outcome Knowledge Base)

### Subtasks

1. **Read all outcome files** in `.ai/plans/cert-types-permissions/outcome/`

2. **Create** `docs/backend/certificate-type-system.md`:
   - Document the entity type quad pattern (Select/Insert/Return/Submit)
   - Document the ReturnType re-apply enum pattern
   - Document the permission catalog and group mappings
   - Document the filter/sort/pagination type conventions

3. **Update** `backend/types/AGENTS.md`:
   - Add section on certificate type definitions sub-directory
   - Reference `docs/backend/certificate-type-system.md`

4. **Update** `backend/enum/AGENTS.md`:
   - Add section on certificate permission entries and enum metadata

5. **Update** root `AGENTS.md` Important References section

6. **Run global quality check**:
   ```bash
   bun tsgo
   bun biome:check
   bun run lint
   ```

7. **Write outcome file**: `.ai/plans/cert-types-permissions/outcome/T13-knowledge-propagation-outcome.md`

8. **Update progress**: Mark task T13 as `[x]` in `tasks.md`

---

## Reality Check Notes

> Added by codebase-reality verification pass on 2026-08-02. Verified against the actual state of `/home/ahmed/Projects/siraj-cert/`.

### Corrections applied to tasks.md
1. **T01 step 3** — corrected the invalid instruction to "follow the existing `backend/enum/` pattern for metadata (label, labelAr, description, descriptionAr per enum value)". Verified existing `backend/enum/` TS enum files (`backend/enum/students/student-lifecycle.enum.ts`, `backend/enum/billing/billing.enum.ts`) contain **NO** inline display-label metadata — only the bare enum plus optional `ALLOWED_*_TRANSITIONS`. Display labels are added in T12 via `shared/locale/`.
2. **T01 step 3** — clarified the source-of-truth direction: `backend/enum/` TS enums are the SOURCE-OF-TRUTH that Plan 01's `createPgEnumFromEnum("snake_case_name", Enum)` derives PG values from (the plan previously implied "re-exporting pgEnums from Plan 1's schema", which would invert the dependency direction).
3. **T01 step 3** — supplied the exact 11 enum members' string values to be EXACTLY aligned with the snake_case PG values Plan 01 registers in `backend/db/schema/enums.ts`.
4. **T09 step 2** — corrected the `AppPermission` enum location: `backend/enum/permissions/permission.enum.ts` (NOT a flat `backend/enum/permissions.ts`). Used `requirements.md` §4 REQ-PERM-001..011 dotted keys (`certificates.templates.manage`, etc.) as canonical; flagged the older short-form `CERT_TEMPLATE_MANAGE` list as a draft leftover to be reconciled against `requirements.md`.
5. **T09 step 3** — removed the "add inline label/labelAr/description/descriptionAr metadata to the enum" instruction; verified the existing `permission.enum.ts` contains NO inline metadata — display metadata is on the `permissions` DB table (`description`/`category` JSONB) + `certificates.permissions.*` i18n namespace (T12).
6. **T09 quality loop** — corrected `backend/enum/permissions.ts` → `backend/enum/permissions/permission.enum.ts`.
7. **T11 step 3** — corrected the verification import: `CertificateTemplateReturnType` (full-table-name-derived, matching billing's `InvoiceReturnType`) in place of the ambiguous short hand `TemplateReturnType`. Added step 4 to also verify the `@/backend/enum` barrel propagates certificate TS enums.

### Cross-plan inconsistencies flagged (downstream of design.md notes)
- Enum list mismatch between Plan 01 (11 pgEnums) and Plan 02 (`requirements.md` §3.1 REQ-ENUM-002 lists 8, with name differences `TemplateStatus` vs `CertificateTemplateStatus`, `VerificationResult` vs `CertificateVerificationResult`, and value-set differences `CertificateGenerationStatus` PENDING/IN_PROGRESS vs Plan 01's QUEUED/RENDERING). T01 step 3 has been pinned to Plan 01's exact 11-enum list to keep the type layer factual; if `requirements.md` §3.1 is the desired taxonomy, then Plan 01's `enums.ts` registry entries must be renamed/re-valued to match. Resolve BEFORE executing T01.
- `FontFamily`, `CertificateResolution`, `TemplateElementSource` are listed in `design.md` §4 but have NO pgEnum or TS-enum counterpart in Plan 01. The T01 step 3 list deliberately omits them; if they're required for `reApplyEnums` in §3.1/§3.2 / §3.3, the corresponding pgEnums must be added to Plan 01's `enums.ts` first.

### Verified reference files
- `backend/enum/students/student-lifecycle.enum.ts` — bare enum + `ALLOWED_STATUS_TRANSITIONS` pattern (no metadata).
- `backend/enum/permissions/permission.enum.ts` — `AppPermission` location + dot-path values + auto-derivation via `filterKnownAppPermissions`.
- `backend/db/schema/permissions/permissions.ts` — `permissions` table with `description` + `category` JSONB columns.
- `backend/types/billing/billing.types.ts` — canonical ReturnType naming.
