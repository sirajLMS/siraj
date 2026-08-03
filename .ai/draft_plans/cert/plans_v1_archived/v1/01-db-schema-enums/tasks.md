# Tasks: Certificate DB Schema & Enums (Plan 01)

## Document Information

- **Feature Name**: Certificate Database Schema & Enums
- **Target Directory**: `.ai/draft_plans/cert/plans/01-db-schema-enums`
- **Outcome Directory**: `.ai/draft_plans/cert/plans/01-db-schema-enums/outcome`
- **Version**: 1.0
- **Date**: 2025-01-20
- **Author**: Siraj Development Team
- **Related Documents**:
  - Requirements: `.ai/draft_plans/cert/plans/01-db-schema-enums/requirements.md`
  - Design: `.ai/draft_plans/cert/plans/01-db-schema-enums/design.md`

## Non-Negotiable Execution Protocol for All Tasks

1. **Pre-Execution Outcome Knowledge Read:**  
   Before executing ANY task, the executing agent MUST read ALL existing files in `.ai/draft_plans/cert/plans/01-db-schema-enums/outcome/` to absorb prior research, search results, docs, and pitfalls so analysis is not repeated.

2. **Per-File Quality Verification Loop (Immediate post-edit):**  
   Whenever a file is modified, execute per-file verification (`bun tsgo` + `bun biome:check` + lint queue for target file) BEFORE moving to another file or subtask.
   ```bash
   bun tsgo
   bun biome:check
   curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
     -H "Content-Type: application/json" \
     -d '{"id":"verify","files":["<the-file>"]}'
   ```

3. **Global Health Check (Completion Gate):**  
   Before marking any subtask as complete, run full global checks: `bun tsgo`, `bun biome:check`, and `bun run lint` globally. All MUST exit with **zero errors and zero warnings**.
   ```bash
   bun tsgo
   bun biome:check
   bun run lint
   ```

4. **Post-Execution Outcome File Creation:**  
   Upon completing the task implementation and quality checks, write a new outcome document under `.ai/draft_plans/cert/plans/01-db-schema-enums/outcome/<task-id>-outcome.md` summarizing research, analysis, changes, and carry-over knowledge.

5. **Task Progress Tracking:**  
   The executing agent MUST update the task checkbox `[ ]` -> `[x]` in this `tasks.md` file upon successful completion.

## MANDATORY Subtasks for Every Implementation Task

**EVERY implementation task (X) MUST include these subtasks:**

### Quality Loop Subtask (X.QL)
```markdown
- [ ] X.QL **Quality Loop**: Per-file verification on `<file-path>`
  - Run: `bun tsgo`
  - Run: `bun biome:check`
  - Run: lint queue for target file: `curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint -H "Content-Type: application/json" -d '{"id":"verify","files":["<the-file>"]}'`
  - Fix all errors before proceeding
```

### Instruction Verification Subtask (X.IV)
```markdown
- [ ] X.IV **Instruction Verification**: Validate `<file-path>` against:
  - AGENTS.md paths (see mapping table below)
  - .agents/instructions paths (see mapping table below)
```

### Layer-to-Instructions Mapping (Reference for ALL Tasks)

| Layer | AGENTS.md Files (absolute paths) | .agents/instructions Files (absolute paths) |
|-------|----------------------------------|---------------------------------------------|
| Root | `/home/ahmed/Projects/siraj-cert/AGENTS.md` | — |
| Backend Schema | `/home/ahmed/Projects/siraj-cert/backend/db/schema/AGENTS.md` (if exists), `/home/ahmed/Projects/siraj-cert/backend/AGENTS.md` (if exists) | `/home/ahmed/Projects/siraj-cert/.agents/instructions/backend.instructions.md` (if exists) |
| Backend Enums | `/home/ahmed/Projects/siraj-cert/backend/enum/AGENTS.md`, `/home/ahmed/Projects/siraj-cert/backend/AGENTS.md` (if exists) | `/home/ahmed/Projects/siraj-cert/.agents/instructions/backend.instructions.md` (if exists) |
| Backend DB / Drizzle | `/home/ahmed/Projects/siraj-cert/backend/db/repo/AGENTS.md` (if exists), `/home/ahmed/Projects/siraj-cert/backend/AGENTS.md` (if exists) | `/home/ahmed/Projects/siraj-cert/.agents/instructions/backend.instructions.md` (if exists) |
| Migrations | `/home/ahmed/Projects/siraj-cert/backend/AGENTS.md` (if exists) | `/home/ahmed/Projects/siraj-cert/.agents/instructions/backend.instructions.md` (if exists) |

> **Note:** If an AGENTS.md or instructions file does not exist at the listed path, skip it — the agent should verify only against files that actually exist.

### Drizzle Schema Convention (Reference)
- **Schema changes** (new tables, columns, indexes): `bun run db push` — creates schema automatically
- **Custom SQL migrations** (RLS policies, seed data): `bun db migrate` — for non-Drizzle SQL only

## Implementation Overview

The implementation follows a foundation-first strategy: enums first (no dependencies), then schema tables (depend on enums), then barrel exports and relations (depend on tables), then RLS migration SQL (depends on tables existing in DB), then database push to generate and apply migrations. Each file is verified individually before integration.

### Implementation Strategy
- **Foundation-First**: Create enums → pgEnums → table files → barrels → relations → RLS → migration
- **Per-File Verification**: Every file passes tsgo + biome + lint before moving to the next
- **Minimal Dependencies**: Each datum has no dependencies. Tasks ordered by dependency chain.

### Development Approach
- **Testing Strategy**: No tests in this plan — schema layer tests are in Plan 07
- **Integration Strategy**: Schema integrates with existing `users`, `students`, `storage_file` tables via FK references
- **Deployment Strategy**: `bun run db push` creates tables; `bun db migrate` applies RLS SQL

## Implementation Plan

---

### Task 1: Create TS Enums in `backend/enum/certificates/`

- [ ] 1. **Create TS enum file: `backend/enum/certificates/certificate.enum.ts`**
  - Read all existing files in `.ai/draft_plans/cert/plans/01-db-schema-enums/outcome/`
  - Create directory `backend/enum/certificates/`
  - Create `backend/enum/certificates/certificate.enum.ts` with 6 enums:
    - `CertificateStatus` (DRAFT = "DRAFT", ISSUED = "ISSUED", EXPIRED = "EXPIRED", REVOKED = "REVOKED", ARCHIVED = "ARCHIVED")
    - `TemplateStatus` (DRAFT = "DRAFT", PUBLISHED = "PUBLISHED", ARCHIVED = "ARCHIVED")
    - `TemplateElementType` (TEXT = "TEXT", IMAGE = "IMAGE", QR_CODE = "QR_CODE", SIGNATURE = "SIGNATURE", SHAPE = "SHAPE")
    - `TemplateVariableType` (TEXT = "TEXT", DATE = "DATE", NAME = "NAME", EMAIL = "EMAIL", CUSTOM = "CUSTOM")
    - `CertificateOrientation` (LANDSCAPE = "LANDSCAPE", PORTRAIT = "PORTRAIT")
    - `VerificationStatus` (VALID = "VALID", INVALID = "INVALID", EXPIRED = "EXPIRED", REVOKED = "REVOKED")
  - Follow existing enum naming convention (SCREAMING_SNAKE_CASE, string values match keys)
  - Reference file: `backend/enum/billing/billing.enum.ts`
  - No imports needed (pure enum definitions)
  - _Requirements: Req 10 (Enum Registration)_

- [ ] 1.QL **Quality Loop**: Per-file verification on `backend/enum/certificates/certificate.enum.ts`
  - Run: `bun tsgo`
  - Run: `bun biome:check`
  - Run: lint queue for target file (via curl POST to lint queue server)
  - Fix all errors before proceeding

- [ ] 1.IV **Instruction Verification**: Validate `backend/enum/certificates/certificate.enum.ts` against:
  - AGENTS.md: `/home/ahmed/Projects/siraj-cert/backend/enum/AGENTS.md` — verify file naming, organization, and backend-only rules
  - AGENTS.md: `/home/ahmed/Projects/siraj-cert/AGENTS.md` — verify path alias usage and general conventions
  - Instructions: `/home/ahmed/Projects/siraj-cert/.agents/instructions/backend.instructions.md` (if exists)

- [ ] 1.BARREL **Create enum barrel**: `backend/enum/certificates/index.ts`
  - Create `backend/enum/certificates/index.ts` with: `export * from "./certificate.enum";`
  - Add `export * from "./certificates";` to `backend/enum/index.ts`
  - _Requirements: Req 10 (Enum Registration)_

- [ ] 1.BARREL.QL **Quality Loop**: Per-file verification on `backend/enum/certificates/index.ts` and `backend/enum/index.ts`
  - Run: `bun tsgo`
  - Run: `bun biome:check`
  - Run: lint queue for both files

- [ ] 1.BARREL.IV **Instruction Verification**: Validate barrel files against:
  - AGENTS.md: `/home/ahmed/Projects/siraj-cert/backend/enum/AGENTS.md` — barrel re-export rules

- [ ] 1.OUTCOME **Write outcome file**: `.ai/draft_plans/cert/plans/01-db-schema-enums/outcome/1-enums-outcome.md`
  - Document: 6 TS enums created, naming convention used, barrel setup
  - Carry-over: pgEnum names must match `createPgEnumFromEnum("snake_case_name", Enum)` in next task

- [ ] 1.DONE **Update progress**: Mark task 1 and all subtasks as `[x]` in `tasks.md`

---

### Task 2: Register pgEnums in `backend/db/schema/enums.ts`

- [ ] 2. **Register 6 pgEnums in `backend/db/schema/enums.ts`**
  - Read all existing files in `.ai/draft_plans/cert/plans/01-db-schema-enums/outcome/`
  - Add imports at top of `backend/db/schema/enums.ts`:
    ```typescript
    import {
      CertificateStatus,
      TemplateStatus,
      TemplateElementType,
      TemplateVariableType,
      CertificateOrientation,
      VerificationStatus,
    } from "@/backend/enum/certificates/certificate.enum";
    ```
  - Add 6 pgEnum declarations using `createPgEnumFromEnum()`:
    ```typescript
    export const certificateStatusEnum = createPgEnumFromEnum("certificate_status", CertificateStatus);
    export const templateStatusEnum = createPgEnumFromEnum("template_status", TemplateStatus);
    export const templateElementTypeEnum = createPgEnumFromEnum("template_element_type", TemplateElementType);
    export const templateVariableTypeEnum = createPgEnumFromEnum("template_variable_type", TemplateVariableType);
    export const certificateOrientationEnum = createPgEnumFromEnum("certificate_orientation", CertificateOrientation);
    export const verificationStatusEnum = createPgEnumFromEnum("verification_status", VerificationStatus);
    ```
  - Reference file: existing pgEnums in `backend/db/schema/enums.ts` for import pattern
  - _Requirements: Req 10 (Enum Registration)_

- [ ] 2.QL **Quality Loop**: Per-file verification on `backend/db/schema/enums.ts`
  - Run: `bun tsgo`
  - Run: `bun biome:check`
  - Run: lint queue for target file
  - Fix all errors before proceeding

- [ ] 2.IV **Instruction Verification**: Validate `backend/db/schema/enums.ts` against:
  - AGENTS.md: `/home/ahmed/Projects/siraj-cert/AGENTS.md` — verify import path alias usage
  - AGENTS.md: `/home/ahmed/Projects/siraj-cert/backend/enum/AGENTS.md` — verify backend-only enum import

- [ ] 2.OUTCOME **Write outcome file**: `.ai/draft_plans/cert/plans/01-db-schema-enums/outcome/2-pgenums-outcome.md`
  - Document: 6 pgEnums registered, naming convention (snake_case pgEnum names), import path used
  - Carry-over: pgEnum variable names (`certificateStatusEnum`, etc.) are used in table definitions in Task 3

- [ ] 2.DONE **Update progress**: Mark task 2 and all subtasks as `[x]` in `tasks.md`

---

### Task 3: Create Schema Files for Each Table

- [ ] 3. **Create schema files under `backend/db/schema/certificates/`**
  - Read all existing files in `.ai/draft_plans/cert/plans/01-db-schema-enums/outcome/`
  - Create directory `backend/db/schema/certificates/`

- [ ] 3.1 **Create `backend/db/schema/certificates/certificate-categories.ts`**
  - Table: `certificate_categories` (self-referencing categories)
  - Columns: id, name (jsonb LocalizedString), parentId (self FK, ON DELETE SET NULL), sortOrder, createdAt, updatedAt, deletedAt
  - Indexes: `certificate_categories_parent_id_idx`, `certificate_categories_sort_order_idx`
  - RLS comment: `// NOTE: PostgreSQL Row-Level Security (RLS) policies are active on this table.`
  - Reference: `backend/db/schema/billing/billing.ts` for pgTable pattern
  - _Requirements: Req 7 (Template Categories)_

- [ ] 3.1.QL **Quality Loop**: Per-file verification on `backend/db/schema/certificates/certificate-categories.ts`
  - Run: `bun tsgo`
  - Run: `bun biome:check`
  - Run: lint queue for target file

- [ ] 3.1.IV **Instruction Verification**: Validate against:
  - AGENTS.md: `/home/ahmed/Projects/siraj-cert/AGENTS.md` — path aliases, timestamp patterns, logging rules

- [ ] 3.2 **Create `backend/db/schema/certificates/certificate-templates.ts`**
  - Tables: `certificate_templates`, `template_elements`, `template_variables`, `certificate_template_versions`
  - Imports: pgEnums from `@/backend/db/schema/enums`, `certificateCategories` from `./certificate-categories`, `users` from `@/backend/db/schema/users/users`
  - `certificate_templates`: id, name (jsonb LocalizedString), description, categoryId FK (ON DELETE SET NULL), status (templateStatusEnum), orientation (certificateOrientationEnum), width, height, backgroundColor, fontFamily, createdByUserId FK users, updatedByUserId FK users, createdAt, updatedAt, deletedAt
  - `template_elements`: id, templateId FK (cascade), type (templateElementTypeEnum), name, config (jsonb), positionX, positionY, width, height, rotation, zIndex, createdAt, updatedAt, deletedAt
  - `template_variables`: id, templateId FK (cascade), key, label (jsonb LocalizedString), type (templateVariableTypeEnum), defaultValue, isRequired, sortOrder, createdAt, updatedAt
  - `certificate_template_versions`: id, templateId FK (cascade), version (int), publishedAt, publishedByUserId FK users, status (templateStatusEnum), elementSnapshot (jsonb), createdAt
  - Indexes per design document (FK indexes, unique composite indexes, status indexes)
  - CHECK constraints: `certificate_templates_dimensions_chk` (width > 0, height > 0), `template_elements_position_chk` (positions non-negative)
  - Unique indexes: `template_variables_template_key_unique_idx` on (templateId, key), `certificate_template_versions_template_version_unique_idx` on (templateId, version)
  - RLS comment on tables with deleted_at
  - Reference: `backend/db/schema/billing/billing.ts` for table config pattern with indexes + check
  - _Requirements: Req 1 (Template Management), Req 2 (Element Composition), Req 3 (Variables), Req 8 (Versioning)_

- [ ] 3.2.QL **Quality Loop**: Per-file verification on `backend/db/schema/certificates/certificate-templates.ts`
  - Run: `bun tsgo`
  - Run: `bun biome:check`
  - Run: lint queue for target file

- [ ] 3.2.IV **Instruction Verification**: Validate against:
  - AGENTS.md: `/home/ahmed/Projects/siraj-cert/AGENTS.md` — path aliases, timestamp patterns, FK reference patterns

- [ ] 3.3 **Create `backend/db/schema/certificates/certificate-recipient-groups.ts`**
  - Table: `certificate_recipient_groups`
  - Columns: id, templateId FK (cascade), name, studentIds (text array), createdAt, updatedAt, deletedAt
  - Indexes: `certificate_recipient_groups_template_id_idx`
  - RLS comment
  - Reference: `backend/db/schema/billing/billing.ts` for array column pattern
  - _Requirements: Req 4 (Recipient Groups)_

- [ ] 3.3.QL **Quality Loop**: Per-file verification on `backend/db/schema/certificates/certificate-recipient-groups.ts`
  - Run: `bun tsgo`
  - Run: `bun biome:check`
  - Run: lint queue for target file

- [ ] 3.3.IV **Instruction Verification**: Validate against:
  - AGENTS.md: `/home/ahmed/Projects/siraj-cert/AGENTS.md` — path aliases, timestamp patterns

- [ ] 3.4 **Create `backend/db/schema/certificates/certificates.ts`**
  - Tables: `certificates`, `certificate_verifications`
  - Imports: pgEnums from `@/backend/db/schema/enums`, `certificateTemplates` from `./certificate-templates`, `certificateRecipientGroups` from `./certificate-recipient-groups`, `certificateTemplateVersions` from `./certificate-templates`, `students` from `@/backend/db/schema/students/students`, `users` from `@/backend/db/schema/users/users`
  - `certificates`: id, templateId FK (restrict), studentId FK (restrict), recipientGroupId FK (set null), versionId FK (set null), status (certificateStatusEnum), verificationCode (varchar unique), filePath, issuedAt, expiresAt, revokedAt, revocationReason, idempotencyKey, createdByUserId FK users (set null), createdAt, updatedAt, deletedAt
  - `certificate_verifications`: id, certificateId FK (cascade), verificationCode, verifiedAt, verifiedByUserId FK users (set null), ipAddress, userAgent, createdAt
  - Unique indexes: `certificates_verification_code_unique_idx`, `certificates_idempotency_key_unique_idx`, `certificates_template_student_unique_idx` on (templateId, studentId)
  - FK indexes: template_id, student_id, recipient_group_id, version_id, status, created_at
  - CHECK constraint: `certificates_issued_expires_chk` (issued_at <= expires_at OR expires_at IS NULL)
  - Verification indexes: certificate_id, verification_code, verified_at
  - RLS comment on certificates table (has deleted_at); NO RLS comment on certificate_verifications (no deleted_at)
  - _Requirements: Req 5 (Certificate Issuance), Req 6 (Verification)_

- [ ] 3.4.QL **Quality Loop**: Per-file verification on `backend/db/schema/certificates/certificates.ts`
  - Run: `bun tsgo`
  - Run: `bun biome:check`
  - Run: lint queue for target file

- [ ] 3.4.IV **Instruction Verification**: Validate against:
  - AGENTS.md: `/home/ahmed/Projects/siraj-cert/AGENTS.md` — path aliases, timestamp patterns, FK patterns, idempotency key pattern

- [ ] 3.5 **Create `backend/db/schema/certificates/certificate-files.ts`**
  - Table: `certificate_files` (junction mirroring `invoice_files`)
  - Import: `storageFiles` from `@/backend/db/schema/storage/storage`, `certificates` from `./certificates`
  - Columns: id, fileId FK storageFiles (cascade), certificateId FK certificates (cascade), usageType (varchar 100), createdAt (defaultNow — junction tables use defaultNow)
  - Indexes: `certificate_files_file_id_idx`, `certificate_files_certificate_id_idx`
  - Reference: `backend/db/schema/storage/storage.ts` → `invoiceFiles` pattern (lines 97-114)
  - No RLS comment (junction table, no deleted_at)
  - _Requirements: Req 9 (File Attachments)_

- [ ] 3.5.QL **Quality Loop**: Per-file verification on `backend/db/schema/certificates/certificate-files.ts`
  - Run: `bun tsgo`
  - Run: `bun biome:check`
  - Run: lint queue for target file

- [ ] 3.5.IV **Instruction Verification**: Validate against:
  - AGENTS.md: `/home/ahmed/Projects/siraj-cert/AGENTS.md` — path aliases, junction table patterns

- [ ] 3.OUTCOME **Write outcome file**: `.ai/draft_plans/cert/plans/01-db-schema-enums/outcome/3-schema-files-outcome.md`
  - Document: 5 schema files created, table names, column types, index names, CHECK constraints
  - Carry-over: Table variable names and import paths needed for barrel exports and relations

- [ ] 3.DONE **Update progress**: Mark task 3 and all subtasks as `[x]` in `tasks.md`

---

### Task 4: Register in Barrel `schema/index.ts`

- [ ] 4. **Create certificates barrel and register in top-level schema barrel**
  - Read all existing files in `.ai/draft_plans/cert/plans/01-db-schema-enums/outcome/`
  - Create `backend/db/schema/certificates/index.ts`:
    ```typescript
    export * from "./certificate-categories";
    export * from "./certificate-templates";
    export * from "./certificate-recipient-groups";
    export * from "./certificates";
    export * from "./certificate-files";
    ```
  - Add to `backend/db/schema/index.ts`:
    ```typescript
    export * from "./certificates";
    ```
  - Reference: existing `backend/db/schema/index.ts` barrel pattern
  - _Requirements: Req 1-13 (all tables must be exported)_

- [ ] 4.QL **Quality Loop**: Per-file verification on `backend/db/schema/certificates/index.ts` and `backend/db/schema/index.ts`
  - Run: `bun tsgo`
  - Run: `bun biome:check`
  - Run: lint queue for both files

- [ ] 4.IV **Instruction Verification**: Validate barrel files against:
  - AGENTS.md: `/home/ahmed/Projects/siraj-cert/AGENTS.md` — barrel export conventions

- [ ] 4.OUTCOME **Write outcome file**: `.ai/draft_plans/cert/plans/01-db-schema-enums/outcome/4-barrel-outcome.md`
  - Document: barrel file created, export order, top-level barrel updated
  - Carry-over: all table exports are now accessible via `@/backend/db/schema/certificates`

- [ ] 4.DONE **Update progress**: Mark task 4 and all subtasks as `[x]` in `tasks.md`

---

### Task 5: Define Relations in `drizzleRelations.ts`

- [ ] 5. **Add certificate domain relations to `backend/db/drizzleRelations.ts`**
  - Read all existing files in `.ai/draft_plans/cert/plans/01-db-schema-enums/outcome/`
  - Add certificate table imports at top of `backend/db/drizzleRelations.ts` (if needed — the file typically imports from schema barrel)
  - Add relations block for all 9 tables inside the existing `defineRelations(schema, r => ({ ... }))` call
  - Follow the exact relation definitions from design.md "Relations Registration" section
  - Relations to define:
    - `certificateCategories`: one parent (self-ref), many children (self-ref), many templates
    - `certificateTemplates`: one category, one createdByUser, one updatedByUser, many elements, many variables, many versions, many recipientGroups, many certificates, through files
    - `templateElements`: one template
    - `templateVariables`: one template
    - `certificateTemplateVersions`: one template, one publishedByUser
    - `certificateRecipientGroups`: one template, many certificates
    - `certificates`: one template, one recipientGroup, one version, one student, one createdByUser, many verifications, through files
    - `certificateVerifications`: one certificate, one verifiedByUser
    - `certificateFiles`: one file, one certificate
  - Use `r.one.<TableName>({ from: ..., to: ... })` for many-to-one
  - Use `r.many.<TableName>({ from: ..., to: ... })` for one-to-many
  - Use `r.many.<TableName>.through(<junctionRelation>)` for many-through (files)
  - Reference: existing relations in `backend/db/drizzleRelations.ts` (billing, users relations)
  - _Requirements: Req 11 (Relations Registration)_

- [ ] 5.QL **Quality Loop**: Per-file verification on `backend/db/drizzleRelations.ts`
  - Run: `bun tsgo`
  - Run: `bun biome:check`
  - Run: lint queue for target file

- [ ] 5.IV **Instruction Verification**: Validate `backend/db/drizzleRelations.ts` against:
  - AGENTS.md: `/home/ahmed/Projects/siraj-cert/AGENTS.md` — path aliases, relation API usage

- [ ] 5.OUTCOME **Write outcome file**: `.ai/draft_plans/cert/plans/01-db-schema-enums/outcome/5-relations-outcome.md`
  - Document: all 9 table relations registered, through-relations for files, self-ref for categories
  - Carry-over: relation names must match what service layer expects (Plan 03)

- [ ] 5.DONE **Update progress**: Mark task 5 and all subtasks as `[x]` in `tasks.md`

---

### Task 6: Create RLS Policies Migration

- [ ] 6. **Create RLS policies migration SQL file**
  - Read all existing files in `.ai/draft_plans/cert/plans/01-db-schema-enums/outcome/`
  - Create `backend/db/migration/certificates_rls_policies.sql`
  - Apply the standard 4-policy soft-delete pattern to 5 tables with `deleted_at`:
    - `certificates`
    - `certificate_templates`
    - `template_elements`
    - `certificate_recipient_groups`
    - `certificate_categories`
  - For each table, include:
    ```sql
    ALTER TABLE "<table>" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "<table>" FORCE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS <table>_select_policy ON "<table>";
    CREATE POLICY <table>_select_policy ON "<table>" FOR SELECT USING (deleted_at IS NULL);
    DROP POLICY IF EXISTS <table>_insert_policy ON "<table>";
    CREATE POLICY <table>_insert_policy ON "<table>" FOR INSERT WITH CHECK (deleted_at IS NULL);
    DROP POLICY IF EXISTS <table>_update_policy ON "<table>";
    CREATE POLICY <table>_update_policy ON "<table>" FOR UPDATE USING (deleted_at IS NULL) WITH CHECK (
      deleted_at IS NULL OR (deleted_at IS NOT NULL AND current_setting('app.soft_delete', true) = 'true')
    );
    DROP POLICY IF EXISTS <table>_soft_delete_policy ON "<table>";
    DROP POLICY IF EXISTS <table>_delete_policy ON "<table>";
    CREATE POLICY <table>_delete_policy ON "<table>" FOR DELETE USING (false);
    ```
  - Add comment for tables WITHOUT RLS:
    - `template_variables` (no deleted_at, cascade-deleted)
    - `certificate_template_versions` (no deleted_at, cascade-deleted)
    - `certificate_verifications` (append-only audit, public INSERT)
    - `certificate_files` (junction table, cascade-deleted)
  - Reference: `backend/db/migration/soft_delete_rls_policies.sql` and `backend/db/migration/books_rls_policies.sql`
  - _Requirements: Req 12 (RLS Policies)_

- [ ] 6.QL **Quality Loop**: Per-file verification on `backend/db/migration/certificates_rls_policies.sql`
  - Run: `bun biome:check` (SQL files are not type-checked by tsgo)
  - Run: lint queue for target file
  - Note: tsgo is not applicable to .sql files — skip tsgo for this file

- [ ] 6.IV **Instruction Verification**: Validate `backend/db/migration/certificates_rls_policies.sql` against:
  - AGENTS.md: `/home/ahmed/Projects/siraj-cert/AGENTS.md` — migration patterns, RLS conventions
  - Reference: `backend/db/migration/soft_delete_rls_policies.sql` for exact pattern match

- [ ] 6.OUTCOME **Write outcome file**: `.ai/draft_plans/cert/plans/01-db-schema-enums/outcome/6-rls-outcome.md`
  - Document: 5 tables with RLS policies, 4 tables without RLS (and why), idempotent SQL pattern used
  - Carry-over: RLS migration runs via `bun db migrate` AFTER `bun run db push` creates tables

- [ ] 6.DONE **Update progress**: Mark task 6 and all subtasks as `[x]` in `tasks.md`

---

### Task 7: Run `bun run db push` to Generate Migration

- [ ] 7. **Push schema to database and verify migration**
  - Read all existing files in `.ai/draft_plans/cert/plans/01-db-schema-enums/outcome/`
  - Ensure all schema files, enums, barrel exports are in place (Tasks 1-5 complete)
  - Run: `bun run db push` (this generates Drizzle migration SQL and applies it to the database)
  - Verify the push completes without errors
  - Check that generated migration SQL includes:
    - CREATE TABLE for all 9 tables
    - CREATE TYPE for all 6 pgEnums
    - CREATE INDEX for all indexes
    - CHECK constraints
  - After successful push, run: `bun db migrate` to apply RLS policies
  - Verify both migrations complete successfully
  - _Requirements: All requirements (tables, enums, indexes, constraints, RLS)_

- [ ] 7.QL **Quality Loop**: Global verification after migration
  - Run: `bun tsgo` (verify no type errors introduced)
  - Run: `bun biome:check` (verify no formatting issues)
  - Run: `bun run lint` (verify no lint errors)
  - All must exit with zero errors and zero warnings

- [ ] 7.IV **Instruction Verification**: Validate migration approach against:
  - AGENTS.md: `/home/ahmed/Projects/siraj-cert/AGENTS.md` — "Database" section, `bun run db push` usage
  - Drizzle convention: push for schema, migrate for custom SQL

- [ ] 7.OUTCOME **Write outcome file**: `.ai/draft_plans/cert/plans/01-db-schema-enums/outcome/7-migration-outcome.md`
  - Document: push output, migration file generated, RLS migration applied, any issues encountered
  - Carry-over: migration file path, table creation order, dependency chain

- [ ] 7.DONE **Update progress**: Mark task 7 and all subtasks as `[x]` in `tasks.md`

---

### Task 8: Verify with `bun tsgo` + Quality Loop Per File

- [ ] 8. **Global quality gate verification**
  - Read all existing files in `.ai/draft_plans/cert/plans/01-db-schema-enums/outcome/`
  - Start lint queue server if not running:
    ```bash
    ~/.bun/bin/bun run scripts/lint-queue-server.ts &
    ```

- [ ] 8.1 **Run `bun tsgo` globally**
  - Run: `bun tsgo`
  - Verify: zero errors, zero warnings
  - If errors: fix in the specific schema/enum file, re-run until clean
  - _Requirements: Req 0 (Outcome Protocol — AC 5)_

- [ ] 8.2 **Run `bun biome:check` globally**
  - Run: `bun biome:check`
  - Verify: zero errors, zero warnings
  - If errors: fix formatting/lint in the specific file, re-run until clean
  - _Requirements: Req 0 (Outcome Protocol — AC 5)_

- [ ] 8.3 **Run `bun run lint` globally**
  - Run: `bun run lint`
  - Verify: zero errors, zero warnings
  - If errors: fix in the specific file, re-run until clean
  - _Requirements: Req 0 (Outcome Protocol — AC 5)_

- [ ] 8.4 **Verify per-file for all new files**
  - Run lint queue for each new file individually:
    - `backend/enum/certificates/certificate.enum.ts`
    - `backend/enum/certificates/index.ts`
    - `backend/db/schema/enums.ts`
    - `backend/db/schema/certificates/certificate-categories.ts`
    - `backend/db/schema/certificates/certificate-templates.ts`
    - `backend/db/schema/certificates/certificate-recipient-groups.ts`
    - `backend/db/schema/certificates/certificates.ts`
    - `backend/db/schema/certificates/certificate-files.ts`
    - `backend/db/schema/certificates/index.ts`
    - `backend/db/schema/index.ts`
    - `backend/db/drizzleRelations.ts`
  - Verify each file passes individually

- [ ] 8.IV **Instruction Verification**: Validate ALL new files against:
  - AGENTS.md: `/home/ahmed/Projects/siraj-cert/AGENTS.md`
  - AGENTS.md: `/home/ahmed/Projects/siraj-cert/backend/enum/AGENTS.md` (for enum files)
  - Instructions: `/home/ahmed/Projects/siraj-cert/.agents/instructions/backend.instructions.md` (if exists)

- [ ] 8.OUTCOME **Write outcome file**: `.ai/draft_plans/cert/plans/01-db-schema-enums/outcome/8-verification-outcome.md`
  - Document: all quality gates passed, tsgo/biome/lint results, per-file verification results
  - Carry-over: any remaining warnings or notes for follow-up plans

- [ ] 8.DONE **Update progress**: Mark task 8 and all subtasks as `[x]` in `tasks.md`

---

### Task 9: Knowledge Propagation (Update AGENTS.md, docs)

- [ ] 9. **Knowledge propagation & documentation**
  - Read all existing files in `.ai/draft_plans/cert/plans/01-db-schema-enums/outcome/` to synthesize all learnings
  - _Requirements: Req 0 (Outcome Protocol — AC 2)_

- [ ] 9.1 **Create canonical reference doc under `docs/`**
  - Create `docs/drizzle/certificate-schema.md` (or `docs/backend/` if no drizzle subdir)
  - Consolidate: certificate schema patterns, RLS policies, enum two-tier setup, junction table pattern, idempotency key usage
  - Structure: Why section → Pattern section → Rules/Conventions → What NOT to Do → Related Documents
  - _Requirements: Knowledge propagation rules from spec-driven-development skill_

- [ ] 9.2 **Update layer AGENTS.md files**
  - Update `/home/ahmed/Projects/siraj-cert/backend/enum/AGENTS.md`:
    - Add `certificates/` to the layout section
    - Add certificate enum reference to the "Adding New Enums" section
  - Check if `/home/ahmed/Projects/siraj-cert/backend/db/schema/AGENTS.md` exists:
    - If yes: add certificate schema patterns section
    - If no: verify against root `AGENTS.md` instead
  - Update root `/home/ahmed/Projects/siraj-cert/AGENTS.md`:
    - Add `docs/drizzle/certificate-schema.md` to "Important References" section
    - Add certificate tables to the "File Organization > Backend" section if applicable

- [ ] 9.3 **Update instruction files (if applicable)**
  - Check if `/home/ahmed/Projects/siraj-cert/.agents/instructions/backend.instructions.md` exists
  - If yes: add reference to `docs/drizzle/certificate-schema.md` in Required Reading section for schema files

- [ ] 9.4 **Update skills (if applicable)**
  - Check if `.agents/skills/drizzle/SKILL.md` exists
  - If yes: add "Certificate Schema" section with key patterns and reference to the new doc

- [ ] 9.QL **Quality Loop**: Global quality gate after all doc updates
  - Run: `bun tsgo` (zero errors)
  - Run: `bun biome:check` (zero errors)
  - Run: `bun run lint` (zero errors)
  - Verify no markdown/AGENTS.md files cause lint issues

- [ ] 9.IV **Instruction Verification**: Validate all updated docs/instructions/AGENTS.md against:
  - Root AGENTS.md conventions
  - Spec-driven-development skill knowledge propagation rules

- [ ] 9.OUTCOME **Write outcome file**: `.ai/draft_plans/cert/plans/01-db-schema-enums/outcome/9-knowledge-propagation-outcome.md`
  - Document: doc created, AGENTS.md files updated, instruction/skill files updated (or noted as not existing)
  - Carry-over: patterns discovered, gotchas for future certificate plans (Plans 02-07)

- [ ] 9.DONE **Update progress**: Mark task 9 and all subtasks as `[x]` in `tasks.md`

---

## Summary

| Task | Description | Estimated Time | Dependencies |
|------|-------------|----------------|-------------|
| 1 | Create TS enums in `backend/enum/certificates/` | 1-2 hours | None |
| 2 | Register pgEnums in `schema/enums.ts` | 1 hour | Task 1 |
| 3 | Create schema files for each table | 3-4 hours | Task 2 |
| 4 | Register in barrel `schema/index.ts` | 1 hour | Task 3 |
| 5 | Define relations in `drizzleRelations.ts` | 2-3 hours | Tasks 3, 4 |
| 6 | Create RLS policies migration | 1-2 hours | Task 3 |
| 7 | Run `bun run db push` to generate migration | 1 hour | Tasks 1-6 |
| 8 | Verify with `bun tsgo` + quality loop per file | 1-2 hours | Task 7 |
| 9 | Knowledge propagation (update AGENTS.md, docs) | 2-3 hours | Task 8 |

**Total estimated time**: 13-22 hours across 9 tasks.

---

## Task Completion Checklist

- [ ] Task 1: TS enums created
- [ ] Task 2: pgEnums registered
- [ ] Task 3: All 9 schema table files created
- [ ] Task 4: Barrel exports registered
- [ ] Task 5: Relations defined in drizzleRelations.ts
- [ ] Task 6: RLS policies SQL written
- [ ] Task 7: Database push migration completed
- [ ] Task 8: Quality gates all passed
- [ ] Task 9: Knowledge propagated to docs and AGENTS.md
