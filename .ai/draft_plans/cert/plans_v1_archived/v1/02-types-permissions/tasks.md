# Tasks: Certificate Types & Permissions (Plan 02)

## Document Information

- **Feature Name**: Certificate Type Definitions & Permission Entries
- **Target Directory**: `.ai/draft_plans/cert/plans/02-types-permissions`
- **Version**: 1.0
- **Date**: 2025-01-20
- **Author**: Siraj Development Team
- **Related Documents**:
  - Requirements: `.ai/draft_plans/cert/plans/02-types-permissions/requirements.md`
  - Design: `.ai/draft_plans/cert/plans/02-types-permissions/design.md`
  - Dependency: `.ai/draft_plans/cert/plans/01-db-schema-enums/requirements.md` (Plan 01 — must be complete)

---

## Instruction Files & AGENTS.md Reference

Before starting ANY task, read the applicable instruction files and AGENTS.md files:

### Instruction Files (`.agents/instructions/*.instructions.md`)

| File Pattern | Instruction File |
|---|---|
| `backend/types/**/*.ts` | `backend.instructions.md` |
| `backend/enum/**/*.ts` | `backend.instructions.md` |
| `backend/graphql/**/*.ts` | `backend.instructions.md` |

### AGENTS.md Files

| File Path Prefix | AGENTS.md Files to Read |
|---|---|
| `backend/types/` | `backend/types/AGENTS.md`, `backend/AGENTS.md`, root `AGENTS.md` |
| `backend/enum/` | `backend/enum/AGENTS.md`, `backend/AGENTS.md`, root `AGENTS.md` |
| `backend/graphql/` | `backend/graphql/AGENTS.md`, `backend/AGENTS.md`, root `AGENTS.md` |
| `backend/enum/permissions/` | `backend/enum/permissions/AGENTS.md` (if exists), `backend/enum/AGENTS.md`, `backend/AGENTS.md`, root `AGENTS.md` |

---

## Pre-Flight Checklist

- [ ] Plan 01 (DB Schema & Enums) is complete — all 9 certificate tables exist in `backend/db/schema/certificates/`
- [ ] Plan 01 — all 6 TS enums exist in `backend/enum/certificates/certificate.enum.ts`
- [ ] Plan 01 — `backend/enum/certificates/index.ts` barrel exists
- [ ] Plan 01 — `backend/enum/index.ts` includes `export * from "./certificates";`
- [ ] Read `backend/types/AGENTS.md` — canonical type naming convention
- [ ] Read `backend/enum/AGENTS.md` — enum structure rules
- [ ] Read `backend/enum/permissions/permission.enum.ts` — existing permission pattern
- [ ] Read `backend/graphql/pothos/shared/enum.pothos.ts` — existing Pothos registration pattern
- [ ] Read `backend/types/billing/billing.types.ts` — canonical type pattern reference
- [ ] Read `.agents/instructions/backend.instructions.md` — backend instruction file
- [ ] Verify lint queue server is running: `~/.bun/bin/bun run scripts/lint-queue-server.ts` (background)

---

## Task 1: Create Type Definition Files for Certificate Entities

**Estimated Time**: 2-3 hours  
**_Requirements_**: Requirements 1-7, 12 (Feature 6)  
**Design Reference**: §2.1-2.9

### Subtasks

- [ ] 1.1 Read `backend/types/AGENTS.md` and `backend/types/billing/billing.types.ts` for canonical pattern reference
- [ ] 1.2 Read `backend/db/schema/certificates/` to understand available table exports from Plan 01
- [ ] 1.3 Read `backend/enum/certificates/certificate.enum.ts` to understand available enum exports
- [ ] 1.4 Create `backend/types/certificates/certificate.types.ts` — `CertificateSelectType`, `CertificateInsertType`, `CertificateReturnType`, `CertificateSubmitInput`, `CertificateFilterInput`, `CertificateOrderByInput`
  - _Requirements_: Req 1 (AC 1-8)
  - _Design_: §2.1
- [ ] 1.5 Create `backend/types/certificates/certificate-template.types.ts` — `CertificateTemplateSelectType`, `CertificateTemplateInsertType`, `CertificateTemplateReturnType`, `CertificateTemplateSubmitInput`, `CertificateTemplateFilterInput`, `CertificateTemplateOrderByInput`, `CertificateTemplateVersionReturnType`, `CertificateTemplateVersionCreateInput`
  - _Requirements_: Req 2 (AC 1-5)
  - _Design_: §2.2
- [ ] 1.6 Create `backend/types/certificates/template-element.types.ts` — `TemplateElementSelectType`, `TemplateElementInsertType`, `TemplateElementReturnType`, `TemplateElementSubmitInput`, sub-element types for static_text, data_text, data_date, image, qr_code, `TemplateElementDetailReturnType` union
  - _Requirements_: Req 3 (AC 1-6)
  - _Design_: §2.3
- [ ] 1.7 Create `backend/types/certificates/template-variable.types.ts` — `TemplateVariableSelectType`, `TemplateVariableInsertType`, `TemplateVariableReturnType`, `TemplateVariableSubmitInput`, sub-variable types for text/number/date/select, `RecipientGroupItemVariableValueReturnType`
  - _Requirements_: Req 4 (AC 1-5)
  - _Design_: §2.4
- [ ] 1.8 Create `backend/types/certificates/certificate-recipient-group.types.ts` — `CertificateRecipientGroupSelectType`, `CertificateRecipientGroupInsertType`, `CertificateRecipientGroupReturnType`, `CertificateRecipientGroupSubmitInput`, `RecipientGroupItemSelectType`, `RecipientGroupItemInsertType`, `RecipientGroupItemReturnType`
  - _Requirements_: Req 5 (AC 1-5)
  - _Design_: §2.5
- [ ] 1.9 Create `backend/types/certificates/certificate-verification.types.ts` — `CertificateVerificationSelectType`, `CertificateVerificationInsertType`, `CertificateVerificationReturnType`, `CertificateVerificationSubmitInput`, `PublicVerificationResult`
  - _Requirements_: Req 6 (AC 1-5)
  - _Design_: §2.6
- [ ] 1.10 Create `backend/types/certificates/certificate-category.types.ts` — `CertificateCategorySelectType`, `CertificateCategoryInsertType`, `CertificateCategoryReturnType`, `CertificateCategorySubmitInput`
  - _Requirements_: Req 7 (AC 1-4)
  - _Design_: §2.7
- [ ] 1.11 Create `backend/types/certificates/certificate-outcome.types.ts` — `LearningOutcomeSelectType`, `LearningOutcomeInsertType`, `LearningOutcomeReturnType`, `LearningOutcomeSubmitInput`, `ProgressTrackingSelectType`, `ProgressTrackingInsertType`, `ProgressTrackingReturnType`, `ProgressTrackingSubmitInput`
  - _Requirements_: Req 12 (AC 1-6) — Feature 6
  - _Design_: §2.8
  - **NOTE**: If `ProgressStatus` enum does not exist in `backend/enum/certificates/certificate.enum.ts` from Plan 01, add it (values: `NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`, `OVERDUE`) and register the pgEnum in `backend/db/schema/enums.ts`

### Per-File Quality Loop (after each file creation)

**For EACH file created in subtasks 1.4-1.11**, run the verification loop:

```bash
# 1. Type check the new file
~/.bun/bin/bun tsgo

# 2. Biome format/lint the new file
~/.bun/bin/bun biome:check

# 3. ESLint via queue client for file-scoped lint
LINT_QUEUE_PORT=$(grep -oP 'LINT_QUEUE_PORT = \K\d+' scripts/lint-queue-config.ts)
curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"task1-verify","files":["backend/types/certificates/<file-name>.ts"]}'
```

**OR** use the sub-loop script:

```bash
~/.bun/bin/bun run scripts/health/sub-loop.ts backend/types/certificates/<file-name>.ts --lifecycle lint
```

### Cross-File Verification

After all 8 type files are created:

```bash
# Full type check — verify no circular dependency errors
~/.bun/bin/bun tsgo

# Full biome check
~/.bun/bin/bun biome:check

# Full lint
~/.bun/bin/bun run lint
```

### Instruction Verification

- [ ] Read `backend/types/AGENTS.md` — verify canonical naming is followed
- [ ] Read `.agents/instructions/backend.instructions.md` — verify backend conventions
- [ ] Verify all types use `@/backend/db/schema` and `@/backend/enum` imports (never relative)
- [ ] Verify all types use `import type` for type-only imports
- [ ] Verify `ReturnType` types `Omit` internal fields and re-apply enums
- [ ] Verify `SubmitInput` types omit system-generated fields

### Task 1 Completion Criteria

- [ ] All 8 type files created under `backend/types/certificates/`
- [ ] `bun tsgo` passes with zero errors
- [ ] `bun biome:check` passes with zero errors for all type files
- [ ] `bun run lint` passes with zero errors for all type files
- [ ] No circular dependency warnings from TypeScript
- [ ] Write outcome file: `.ai/draft_plans/cert/plans/02-types-permissions/outcome/task1-outcome.md`
- [ ] Mark all subtask checkboxes `[x]` in this `tasks.md`

---

## Task 2: Add AppPermission Entries for Certificates

**Estimated Time**: 1-2 hours  
**_Requirements_**: Requirement 8 (AC 1-5), Requirement 9 (AC 1-5)  
**Design Reference**: §3.1, §3.2

### Subtasks

- [ ] 2.1 Read `backend/enum/permissions/permission.enum.ts` to understand the exact placement and format
- [ ] 2.2 Read `backend/enum/permissions/AGENTS.md` (if exists) and `backend/enum/AGENTS.md` for enum rules
- [ ] 2.3 Add 11 `CERTIFICATES_*` entries to the `AppPermission` enum in `backend/enum/permissions/permission.enum.ts`, placed after the existing permissions with a section comment:
  ```typescript
  // ─── Certificate permissions ─────────────────────────────
  CERTIFICATES_LIST           = "certificates.list",
  CERTIFICATES_CREATE          = "certificates.create",
  CERTIFICATES_EDIT            = "certificates.edit",
  CERTIFICATES_DELETE          = "certificates.delete",
  CERTIFICATES_VIEW_OWN        = "certificates.view_own",
  CERTIFICATES_VIEW_OTHER      = "certificates.view_other",
  CERTIFICATES_GENERATE        = "certificates.generate",
  CERTIFICATES_REVOKE          = "certificates.revoke",
  CERTIFICATES_VERIFY          = "certificates.verify",
  CERTIFICATES_MANAGE_TEMPLATE = "certificates.manage_template",
  CERTIFICATES_DOWNLOAD        = "certificates.download",
  ```
  - _Requirements_: Req 8 (AC 1-5)
- [ ] 2.4 Verify that `filterKnownAppPermissions` helper still works (it derives from `Object.values(AppPermission)` — no changes required, just verify)
- [ ] 2.5 Document the permission group assignments (seed data respect — actual seed implementation is Plan 06):
  - super_admin: ALL 11 (via `isSuperAdmin` flag — no explicit seed)
  - academy_admin: 10 (all except `MANAGE_TEMPLATE`)
  - teacher_default: `LIST`, `GENERATE`, `VIEW_OWN`
  - student_default: `VIEW_OWN`
  - parent_default: `VIEW_OWN` (children's certificates)
  - staff_default: `LIST`, `VIEW_OTHER`, `VERIFY`, `DOWNLOAD`
  - supervisor_default: `LIST`, `VIEW_OTHER`, `VERIFY`, `DOWNLOAD`
  - _Requirements_: Req 9 (AC 1-5)
- [ ] 2.6 If DB `appPermissionEnum` pgEnum needs sync: run `bun run db push` to generate ALTER TYPE for the new permission values (coordinate with Plan 01/06 if DB push is not in scope)

### Per-File Quality Loop

```bash
# File-scoped verification
LINT_QUEUE_PORT=$(grep -oP 'LINT_QUEUE_PORT = \K\d+' scripts/lint-queue-config.ts)
curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"task2-verify","files":["backend/enum/permissions/permission.enum.ts"]}'

# OR sub-loop
~/.bun/bin/bun run scripts/health/sub-loop.ts backend/enum/permissions/permission.enum.ts --lifecycle lint
```

### Cross-File Verification

```bash
# Verify the permission enum compiles with all new entries
~/.bun/bin/bun tsgo

# Verify biome
~/.bun/bin/bun biome:check

# Verify lint
~/.bun/bin/bun run lint
```

### Instruction Verification

- [ ] Read `backend/enum/AGENTS.md` — verify enum naming and structure rules
- [ ] Read `backend/enum/permissions/AGENTS.md` (if exists) — verify permission-specific rules
- [ ] Read `.agents/instructions/backend.instructions.md` — verify backend conventions
- [ ] Verify all permission values use 2-segment dot-path convention (`certificates.<action>`)
- [ ] Verify section comment format matches existing style
- [ ] Verify no typos in enum key names (e.g., `CERTIFICATES_MANAGE_TEMPLATE` not `CERTIFICATES_MANAGE_TEMPLATES`)

### Task 2 Completion Criteria

- [ ] 11 `AppPermission` entries added to `backend/enum/permissions/permission.enum.ts`
- [ ] Permission group assignments documented in this file (actual seed deferred to Plan 06)
- [ ] `bun tsgo` passes with zero errors
- [ ] `bun biome:check` passes with zero errors
- [ ] `bun run lint` passes with zero errors
- [ ] Write outcome file: `.ai/draft_plans/cert/plans/02-types-permissions/outcome/task2-outcome.md`
- [ ] Mark all subtask checkboxes `[x]` in this `tasks.md`

---

## Task 3: Register Pothos Enums for Certificate Domain

**Estimated Time**: 1-2 hours  
**_Requirements_**: Requirement 10 (AC 1-5)  
**Design Reference**: §4.1, §4.2

### Subtasks

- [ ] 3.1 Read `backend/graphql/pothos/shared/enum.pothos.ts` to understand the exact registration pattern and import structure
- [ ] 3.2 Read `backend/graphql/pothos/shared/AGENTS.md` and `backend/graphql/AGENTS.md` for Pothos rules
- [ ] 3.3 Read `backend/enum/certificates/certificate.enum.ts` to verify enum names match the Pothos registration
- [ ] 3.4 Add certificate enum imports to `backend/graphql/pothos/shared/enum.pothos.ts`:
  ```typescript
  import {
    CertificateStatus,
    TemplateStatus,
    TemplateElementType,
    TemplateVariableType,
    CertificateOrientation,
    VerificationStatus,
  } from "@/backend/enum/certificates";
  // If ProgressStatus was added in Task 1:
  // ProgressStatus,
  ```
- [ ] 3.5 Add 6 (or 7 if ProgressStatus) Pothos enum registrations:
  ```typescript
  // ─── Certificate enums ──────────────────────────────────────
  gqlSchemaBuilder.enumType(CertificateStatus, { name: "CertificateStatus" });
  gqlSchemaBuilder.enumType(
    TemplateStatus,
    { name: "TemplateStatus" },
  );
  gqlSchemaBuilder.enumType(TemplateElementType, { name: "TemplateElementType" });
  gqlSchemaBuilder.enumType(TemplateVariableType, { name: "TemplateVariableType" });
  gqlSchemaBuilder.enumType(CertificateOrientation, { name: "CertificateOrientation" });
  gqlSchemaBuilder.enumType(VerificationStatus, { name: "VerificationStatus" });
  // If ProgressStatus was added:
  // gqlSchemaBuilder.enumType(ProgressStatus, { name: "ProgressStatus" });
  ```
  - _Requirements_: Req 10 (AC 1-5)
  - _Design_: §4.1
- [ ] 3.6 Run `bun run generate:gqlSchema` to verify the GraphQL schema generates successfully with new enums
- [ ] 3.7 Run `bun codegen` to verify TypeScript types are generated from the updated schema
- [ ] 3.8 Verify the generated GraphQL schema includes the new enum types (check `frontend/common/graphql/generated/` or the schema output file)

### Per-File Quality Loop

```bash
# File-scoped verification
LINT_QUEUE_PORT=$(grep -oP 'LINT_QUEUE_PORT = \K\d+' scripts/lint-queue-config.ts)
curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"task3-verify","files":["backend/graphql/pothos/shared/enum.pothos.ts"]}'

# OR sub-loop
~/.bun/bin/bun run scripts/health/sub-loop.ts backend/graphql/pothos/shared/enum.pothos.ts --lifecycle lint
```

### Cross-File Verification

```bash
# GraphQL schema generation
~/.bun/bin/bun run generate:gqlSchema

# Codegen
~/.bun/bin/bun codegen

# Type check
~/.bun/bin/bun tsgo

# Biome
~/.bun/bin/bun biome:check

# Lint
~/.bun/bin/bun run lint
```

### Instruction Verification

- [ ] Read `backend/graphql/AGENTS.md` — verify Pothos enum registration rules
- [ ] Read `backend/graphql/pothos/shared/AGENTS.md` (if exists) — verify shared Pothos rules
- [ ] Read `.agents/instructions/backend.instructions.md` — verify backend conventions
- [ ] Verify enums are imported from `@/backend/enum/certificates` (not from DB schema)
- [ ] Verify `gqlSchemaBuilder.enumType(Enum, { name })` pattern — no hardcoded value arrays
- [ ] Verify enum `name` property matches the TS enum name exactly
- [ ] Verify the generated GraphQL schema file includes all 6 (or 7) new enum types

### Task 3 Completion Criteria

- [ ] 6 (or 7 if ProgressStatus) Pothos enum registrations added to `backend/graphql/pothos/shared/enum.pothos.ts`
- [ ] `bun run generate:gqlSchema` succeeds
- [ ] `bun codegen` succeeds
- [ ] Generated GraphQL schema includes new enum types
- [ ] `bun tsgo` passes with zero errors
- [ ] `bun biome:check` passes with zero errors
- [ ] `bun run lint` passes with zero errors
- [ ] Write outcome file: `.ai/draft_plans/cert/plans/02-types-permissions/outcome/task3-outcome.md`
- [ ] Mark all subtask checkboxes `[x]` in this `tasks.md`

---

## Task 4: Create Barrel Exports and Wire into Parent Index Files

**Estimated Time**: 1 hour  
**_Requirements_**: Requirement 11 (AC 1-5)  
**Design Reference**: §2.9, §5.1, §5.2

### Subtasks

- [ ] 4.1 Read `backend/types/index.ts` to understand the existing barrel pattern and alphabetical placement
- [ ] 4.2 Create `backend/types/certificates/index.ts`:
  ```typescript
  export * from "./certificate.types";
  export * from "./certificate-template.types";
  export * from "./template-element.types";
  export * from "./template-variable.types";
  export * from "./certificate-recipient-group.types";
  export * from "./certificate-verification.types";
  export * from "./certificate-category.types";
  export * from "./certificate-outcome.types";
  ```
  - _Requirements_: Req 11 (AC 1)
  - _Design_: §2.9
- [ ] 4.3 Add `export * from "./certificates";` to `backend/types/index.ts` in alphabetical order (after "billing", before the next alphabetically-sorted entry)
  - _Requirements_: Req 11 (AC 2)
  - _Design_: §5.1
- [ ] 4.4 Verify that `backend/enum/certificates/index.ts` exists (from Plan 01) — if not, create it
  - _Requirements_: Req 11 (AC 3)
  - _Design_: §5.2
- [ ] 4.5 Verify that `backend/enum/index.ts` includes `export * from "./certificates";` (from Plan 01) — if not, add it
  - _Requirements_: Req 11 (AC 3)
  - _Design_: §5.2
- [ ] 4.6 Verify resolution: run `bun tsgo` and confirm that `import { CertificateReturnType } from "@/backend/types"` resolves correctly
  - _Requirements_: Req 11 (AC 4)

### Per-File Quality Loop

```bash
# Verify the barrel files
LINT_QUEUE_PORT=$(grep -oP 'LINT_QUEUE_PORT = \K\d+' scripts/lint-queue-config.ts)
curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"task4-verify","files":["backend/types/certificates/index.ts","backend/types/index.ts"]}'
```

### Cross-File Verification

```bash
# Full type check — verify barrel resolution
~/.bun/bin/bun tsgo

# Biome
~/.bun/bin/bun biome:check

# Lint
~/.bun/bin/bun run lint
```

### Instruction Verification

- [ ] Read `backend/types/AGENTS.md` — verify barrel pattern
- [ ] Read `backend/enum/AGENTS.md` — verify enum barrel pattern
- [ ] Read `.agents/instructions/backend.instructions.md` — verify backend conventions
- [ ] Verify barrel exports are in `export * from "./<file>"` format (no `export type` — `export *` handles both)
- [ ] Verify no circular dependencies — type files import from `@/backend/db/schema` and `@/backend/enum`, never from `@/backend/types`
- [ ] Verify alphabetical placement in parent `index.ts`

### Task 4 Completion Criteria

- [ ] `backend/types/certificates/index.ts` barrel created with all 8 type file exports
- [ ] `backend/types/index.ts` modified with `export * from "./certificates";`
- [ ] `backend/enum/certificates/index.ts` verified/created
- [ ] `backend/enum/index.ts` verified to include `export * from "./certificates";`
- [ ] `bun tsgo` resolves `import { CertificateReturnType } from "@/backend/types"` correctly
- [ ] `bun tsgo` passes with zero errors
- [ ] `bun biome:check` passes with zero errors
- [ ] `bun run lint` passes with zero errors
- [ ] Write outcome file: `.ai/draft_plans/cert/plans/02-types-permissions/outcome/task4-outcome.md`
- [ ] Mark all subtask checkboxes `[x]` in this `tasks.md`

---

## Task 5: Quality Loop — Full Verification (tsgo + biome + lint + codegen)

**Estimated Time**: 1-2 hours  
**_Requirements_**: Requirement 0 (AC 4-5), all requirements (cross-cutting verification)  
**Design Reference**: §10.1, §10.2, §10.3

### Subtasks

- [ ] 5.1 Run full `bun tsgo` — verify zero TypeScript compilation errors across all new/modified files
  ```bash
  ~/.bun/bin/bun tsgo
  ```
  - If errors: fix type issues (missing imports, incorrect Omit fields, enum re-application)
- [ ] 5.2 Run full `bun biome:check` — verify zero formatting/lint issues
  ```bash
  ~/.bun/bin/bun biome:check
  ```
  - If errors: run `~/.bun/bin/bun biome:check --write` to auto-fix formatting
- [ ] 5.3 Run full `bun run lint` — verify zero ESLint violations
  ```bash
  # Ensure lint queue server is running
  ~/.bun/bin/bun run scripts/lint-queue-server.ts &
  sleep 2
  ~/.bun/bin/bun run lint
  ```
  - If errors: fix import path issues (must use `@/backend/db/schema`, not relative), check `no-console` rule, fix any other violations
- [ ] 5.4 Run `bun run generate:gqlSchema` — verify GraphQL schema generates with all certificate enums
  ```bash
  ~/.bun/bin/bun run generate:gqlSchema
  ```
- [ ] 5.5 Run `bun codegen` — verify TypeScript types are generated
  ```bash
  ~/.bun/bin/bun codegen
  ```
- [ ] 5.6 Verify all new files pass the sub-loop individually:
  ```bash
  for file in \
    backend/types/certificates/certificate.types.ts \
    backend/types/certificates/certificate-template.types.ts \
    backend/types/certificates/template-element.types.ts \
    backend/types/certificates/template-variable.types.ts \
    backend/types/certificates/certificate-recipient-group.types.ts \
    backend/types/certificates/certificate-verification.types.ts \
    backend/types/certificates/certificate-category.types.ts \
    backend/types/certificates/certificate-outcome.types.ts \
    backend/types/certificates/index.ts \
    backend/enum/permissions/permission.enum.ts \
    backend/graphql/pothos/shared/enum.pothos.ts \
    backend/types/index.ts; do
    echo "=== Verifying: $file ==="
    ~/.bun/bin/bun run scripts/health/sub-loop.ts "$file" --lifecycle lint
  done
  ```
- [ ] 5.7 Verify no regression in existing functionality — existing tests still pass (if any certificate-related tests exist from Plan 01):
  ```bash
  # Only if Plan 01 tests exist — otherwise skip
  ~/.bun/bin/bun run test:services
  ```

### Instruction Verification

- [ ] Read root `AGENTS.md` Quality Workflow section — verify quality gate expectations
- [ ] Read `backend/types/AGENTS.md` — verify type-specific quality rules
- [ ] Read `backend/enum/AGENTS.md` — verify enum-specific quality rules
- [ ] Read `backend/graphql/AGENTS.md` — verify GraphQL-specific quality rules
- [ ] Read `.agents/instructions/backend.instructions.md` — verify all backend conventions are met
- [ ] Verify the verification loop is progressive: tsgo → biome → lint → codegen (no skipping)

### Task 5 Completion Criteria

- [ ] `bun tsgo` passes with zero errors globally
- [ ] `bun biome:check` passes with zero errors globally
- [ ] `bun run lint` passes with zero errors globally
- [ ] `bun run generate:gqlSchema` succeeds
- [ ] `bun codegen` succeeds
- [ ] All 11 modified/created files pass sub-loop verification individually
- [ ] No regression in existing functionality
- [ ] Write outcome file: `.ai/draft_plans/cert/plans/02-types-permissions/outcome/task5-outcome.md`
- [ ] Mark all subtask checkboxes `[x]` in this `tasks.md`

---

## Task 6: Knowledge Propagation — Update Documentation & AGENTS.md References

**Estimated Time**: 1-2 hours  
**_Requirements_**: Requirement 0 (AC 2), cross-cutting knowledge transfer  
**Design Reference**: §8 (Outcome & Knowledge Transfer Protocol)

### Subtasks

- [ ] 6.1 Write the plan outcome document:
  - Create `.ai/draft_plans/cert/plans/02-types-permissions/outcome/task6-outcome.md`
  - Document: files created, files modified, key patterns used, type reference graph, permission group assignments, Pothos enum registrations, verification results
- [ ] 6.2 Update `backend/types/AGENTS.md` (if it has a module inventory section) to include the new `certificates/` type directory:
  - Add `backend/types/certificates/` to the type module listing (if applicable)
  - Document the entities covered: Certificate, Template, TemplateElement, TemplateVariable, RecipientGroup, Verification, Category, LearningOutcome, ProgressTracking
- [ ] 6.3 Update `backend/enum/AGENTS.md` (if it has a module inventory section) to include the certificate permissions:
  - Document `AppPermission.CERTIFICATES_*` entries (11 entries)
  - Document the permission group assignment table
  - Note that public verification does not require authentication
- [ ] 6.4 Verify the root `AGENTS.md` file does not need updating (it is a general project doc — no certificate-specific sections needed at this stage)
- [ ] 6.5 Document the **canonical type contract** for downstream plans in the outcome file:
  - Plan 03 (Repositories) — which types to use for repository method signatures
  - Plan 04 (Services/GraphQL) — which types to use for service method signatures and Pothos object types
  - Plan 05 (Frontend) — how to use codegen-generated types
  - Plan 06 (Seeds) — permission group assignment seed data
- [ ] 6.6 Document the **Pothos enum registration ledger** in the outcome file:
  - 6 (or 7) enums registered
  - GraphQL enum names: `CertificateStatus`, `TemplateStatus`, `TemplateElementType`, `TemplateVariableType`, `CertificateOrientation`, `VerificationStatus` (and `ProgressStatus` if added)
  - Import path: `@/backend/enum/certificates`
- [ ] 6.7 Document the **ProgressStatus supplementary enum** decision:
  - If `ProgressStatus` was added (not in original Plan 01), document that it was added as a supplement in this plan
  - pgEnum registration: `createPgEnumFromEnum("progress_status", ProgressStatus)` in `backend/db/schema/enums.ts`
  - Pothos registration: `gqlSchemaBuilder.enumType(ProgressStatus, { name: "ProgressStatus" })`
- [ ] 6.8 Create a **knowledge carry-forward checklist** in the outcome file for subsequent plans:

  ```
  ✅ Canonical naming: {Entity}SelectType / {Entity}InsertType / {Entity}ReturnType / {Entity}SubmitInput
  ✅ Omit pattern: ReturnType omits deletedAt, idempotencyKey, version, createdByUserId + re-applies enums
  ✅ Import convention: @/backend/db/schema and @/backend/enum (never relative or @/backend/types barrel)
  ✅ Permission dot-path: 2-segment convention (certificates.<action>)
  ✅ Pothos registration: gqlSchemaBuilder.enumType(Enum, { name }) — no hardcoded arrays
  ✅ Public vs. Authenticated: PublicVerificationResult strips PII
  ✅ Feature 6 types: LearningOutcome and ProgressTracking types exported from @/backend/types
  ```

### Quality Loop

```bash
# Documentation files don't need lint/tsgo but verify no broken links/references
~/.bun/bin/bun tsgo   # Ensure no TS errors from AGENTS.md code examples
~/.bun/bin/bun biome:check  # Ensure formatting is correct
```

### Instruction Verification

- [ ] Read root `AGENTS.md` AI Agent Communication Rules — verify no summary markdown files are created in the repository root
- [ ] Read `backend/types/AGENTS.md` — verify the type inventory section exists and update it
- [ ] Read `backend/enum/AGENTS.md` — verify the enum inventory section exists and update it
- [ ] Verify outcome files are placed in `.ai/draft_plans/cert/plans/02-types-permissions/outcome/` (session workspace, not repo root)
- [ ] Verify no AGENTS.md files are created — only existing ones are updated (where applicable)

### Task 6 Completion Criteria

- [ ] Outcome document written to `.ai/draft_plans/cert/plans/02-types-permissions/outcome/task6-outcome.md`
- [ ] `backend/types/AGENTS.md` updated with certificate type module inventory (if applicable)
- [ ] `backend/enum/AGENTS.md` updated with certificate permission documentation (if applicable)
- [ ] Knowledge carry-forward checklist documented in outcome file
- [ ] Pothos enum registration ledger documented in outcome file
- [ ] ProgressStatus supplementary enum decision documented (if added)
- [ ] Canonical type contract for downstream plans documented in outcome file
- [ ] `bun tsgo` still passes (no breakage from doc updates)
- [ ] `bun biome:check` still passes
- [ ] Mark all subtask checkboxes `[x]` in this `tasks.md`

---

## Final Acceptance Checklist

After all 6 tasks are complete, verify the entire plan:

### Type Files
- [ ] `backend/types/certificates/certificate.types.ts` — Certificate types ✅
- [ ] `backend/types/certificates/certificate-template.types.ts` — Template types ✅
- [ ] `backend/types/certificates/template-element.types.ts` — Element types ✅
- [ ] `backend/types/certificates/template-variable.types.ts` — Variable types ✅
- [ ] `backend/types/certificates/certificate-recipient-group.types.ts` — Recipient group types ✅
- [ ] `backend/types/certificates/certificate-verification.types.ts` — Verification types ✅
- [ ] `backend/types/certificates/certificate-category.types.ts` — Category types ✅
- [ ] `backend/types/certificates/certificate-outcome.types.ts` — Feature 6 types ✅
- [ ] `backend/types/certificates/index.ts` — Barrel export ✅
- [ ] `backend/types/index.ts` — Modified with `export * from "./certificates";` ✅

### Permission Entries
- [ ] 11 `AppPermission.CERTIFICATES_*` entries in `backend/enum/permissions/permission.enum.ts` ✅
- [ ] Permission group assignments documented (seed deferred to Plan 06) ✅

### Pothos Enum Registration
- [ ] 6 (or 7) certificate enums registered in `backend/graphql/pothos/shared/enum.pothos.ts` ✅
- [ ] `bun run generate:gqlSchema` succeeds ✅
- [ ] `bun codegen` succeeds ✅

### Quality Gates
- [ ] `bun tsgo` — zero errors ✅
- [ ] `bun biome:check` — zero errors ✅
- [ ] `bun run lint` — zero errors ✅

### Outcome Artifacts
- [ ] `.ai/draft_plans/cert/plans/02-types-permissions/outcome/task1-outcome.md` ✅
- [ ] `.ai/draft_plans/cert/plans/02-types-permissions/outcome/task2-outcome.md` ✅
- [ ] `.ai/draft_plans/cert/plans/02-types-permissions/outcome/task3-outcome.md` ✅
- [ ] `.ai/draft_plans/cert/plans/02-types-permissions/outcome/task4-outcome.md` ✅
- [ ] `.ai/draft_plans/cert/plans/02-types-permissions/outcome/task5-outcome.md` ✅
- [ ] `.ai/draft_plans/cert/plans/02-types-permissions/outcome/task6-outcome.md` ✅

### Feature 6 (Outcome Knowledge Base)
- [ ] `LearningOutcomeSelectType`, `LearningOutcomeInsertType`, `LearningOutcomeReturnType`, `LearningOutcomeSubmitInput` ✅
- [ ] `ProgressTrackingSelectType`, `ProgressTrackingInsertType`, `ProgressTrackingReturnType`, `ProgressTrackingSubmitInput` ✅
- [ ] `ProgressStatus` enum exists (from Plan 01 or added as supplement) ✅
- [ ] Feature 6 types exported from `@/backend/types` ✅

### Downstream Readiness
- [ ] Plan 03 (Repositories) can import all certificate types from `@/backend/types` ✅
- [ ] Plan 04 (Services/GraphQL) can use `AppPermission.CERTIFICATES_*` for auth scopes ✅
- [ ] Plan 04 (GraphQL) can use registered Pothos enums in object types ✅
- [ ] Plan 06 (Seeds) can reference permission group assignments ✅

---

## Requirements Traceability Matrix

| Requirement | Task(s) | Status |
|---|---|---|
| Req 0: Execution Outcome Protocol | All tasks (outcome files) | ⬜ |
| Req 1: Certificate Type Defs | Task 1 (subtask 1.4) | ⬜ |
| Req 2: Template Type Defs | Task 1 (subtask 1.5) | ⬜ |
| Req 3: Template Element Type Defs | Task 1 (subtask 1.6) | ⬜ |
| Req 4: Template Variable Type Defs | Task 1 (subtask 1.7) | ⬜ |
| Req 5: Recipient Group Type Defs | Task 1 (subtask 1.8) | ⬜ |
| Req 6: Verification Type Defs | Task 1 (subtask 1.9) | ⬜ |
| Req 7: Category Type Defs | Task 1 (subtask 1.10) | ⬜ |
| Req 8: Permission Entries | Task 2 (subtasks 2.3-2.4) | ⬜ |
| Req 9: Permission Group Assignments | Task 2 (subtask 2.5) | ⬜ |
| Req 10: Pothos Enum Registration | Task 3 (subtasks 3.4-3.8) | ⬜ |
| Req 11: Barrel Exports | Task 4 (subtasks 4.2-4.6) | ⬜ |
| Req 12: Feature 6 Types | Task 1 (subtask 1.11) | ⬜ |

**Legend**: ⬜ Pending | 🔄 In Progress | ✅ Complete
