# Plan 01 — DB Schema & Enums: Tasks

> **Feature**: Certificate Module — Database Schema, Enums, and Relations
> **Plan #**: 01
> **Dependencies**: None (foundation plan)
> **Execution Model**: Sequential per task (each task produces files the next task imports)
> **Quality Model**: Per-file tsgo + biome + lint via `scripts/health/sub-loop.ts`
> **Time Budget**: 2-4 hours per task

---

## Task Dependency Graph

```
T01 (pgEnums) ──→ T02 (categories table) ──→ T03 (templates table)
                                              ├─→ T04 (template_elements table)
                                              ├─→ T05 (template_variables table)
                                              ├─→ T06 (recipient_groups table)
                                              ├─→ T07 (recipient_group_items table)
                                              ├─→ T08 (recipient_group_item_variable_values table)
                                              ├─→ T09 (certificates table)
                                              ├─→ T10 (certificate_verifications table)
                                              └─→ T11 (template_style_presets table)
                                                    │
                                                    ├─→ T12 (relations)
                                                    ├─→ T13 (barrel exports)
                                                    └─→ T14 (push migration)
                                                          │
                                                          └─→ T15 (knowledge propagation)
```

**Execution order**: T01 → T02 → T03 → (T04, T05, T06, T07, T08, T09, T10, T11 in parallel after T03) → T12 → T13 → T14 → T15

---

## T01 — Define All Certificate pgEnums

**Estimated time**: 2 hours
**Depends on**: None (first task in the certificate feature)
**Requirements**: REQ-01-001, REQ-01-010 through REQ-01-020, AC-01, AC-02

### Subtasks

1. **Read applicable AGENTS.md**:
   - `backend/db/schema/AGENTS.md` — Schema layer rules
   - `backend/enum/AGENTS.md` — Enum layer rules
   - `AGENTS.md` root — path alias conventions, Bun runtime note

2. **Read applicable instruction files**:
   - `.github/instructions/backend.instructions.md`

3. **Append 11 certificate pgEnums** to the existing top-level **`backend/db/schema/enums.ts`** registry (DO NOT create a per-domain `backend/db/schema/certificates/enums.ts` file):
   - Register each via the canonical helper `createPgEnumFromEnum("snake_case_name", TsEnum)` imported from `@/backend/utils/db.utils`, where `TsEnum` is imported from `@/backend/enum/certificates` (these TS enums are created in Plan 02 / T01 of that plan; if Plan 02 is not yet complete, use placeholder TS enum imports and reconcile later — the TS enum is the single source of truth for PG values).
   - The 11 pgEnums (snake_case DB name → TS enum source):
     - `certificate_template_status` ← `CertificateTemplateStatus` (draft, published, archived)
     - `certificate_orientation` ← `CertificateOrientation` (landscape, portrait)
     - `certificate_background_type` ← `CertificateBackgroundType` (none, solid_color, image)
     - `certificate_element_type` ← `CertificateElementType` (static_text, data_text, data_date, image, qr_code, shape)
     - `certificate_variable_type` ← `CertificateVariableType` (text, number, date, select)
     - `certificate_recipient_group_status` ← `CertificateRecipientGroupStatus` (pending, ready, generating, completed, failed)
     - `certificate_recipient_item_status` ← `CertificateRecipientItemStatus` (pending, generating, generated, failed, skipped)
     - `certificate_status` ← `CertificateStatus` (draft, pending, issued, revoked, expired)
     - `certificate_generation_status` ← `CertificateGenerationStatus` (queued, rendering, completed, failed)
     - `certificate_verification_method` ← `CertificateVerificationMethod` (qr_code, manual_entry, link)
     - `certificate_verification_result` ← `CertificateVerificationResult` (valid, invalid, revoked, expired)
   - Export naming: each pgEnum const is camelCase matching the existing registry (e.g. `export const certificateStatusEnum = createPgEnumFromEnum("certificate_status", CertificateStatus);`).

4. **Verify** no naming conflicts with existing enums in `backend/db/schema/enums.ts` or `backend/enum/` (e.g. the existing top-level `studentStatusEnum`, `accountStatusEnum`, etc.)

### Quality Loop

For the modified file:
```bash
bun tsgo
bun biome:check
curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"t01","files":["backend/db/schema/enums.ts"]}'
```

Or equivalently:
```bash
bun run scripts/health/sub-loop.ts backend/db/schema/enums.ts --lifecycle lint
```

### Verification
- All 11 pgEnums appended to `backend/db/schema/enums.ts` with correct value lists (via `createPgEnumFromEnum`)
- `bun tsgo` passes with zero new type errors
- No enum name or value duplicates with existing codebase

---

## T02 — Create certificate_categories Table

**Estimated time**: 2 hours
**Depends on**: T01 (enums exist for status fields)
**Requirements**: REQ-01-030 through REQ-01-035, AC-03, AC-04

### Subtasks

1. **Read applicable AGENTS.md**:
   - `backend/db/schema/AGENTS.md` — table definition rules, soft-delete patterns
   - `backend/db/schema/AGENTS.md` — index conventions

2. **Create** `backend/db/schema/certificates/categories.ts`:
   - Table: `certificate_categories`
   - Columns: `id` (uuid PK), `name`, `nameAr`, `description`, `descriptionAr`, `parentId` (self-referential FK), `sortOrder` (int), `createdAt`, `updatedAt`, `deletedAt` (soft delete)
   - Indexes: idx on `parentId`, unique idx on `name` WHERE `deletedAt IS NULL`
   - Self-referential FK: `parentId` references `certificate_categories.id`
   - Follow the exact `pgTable` convention from existing Siraj schema files

3. **Read** an existing self-referential table for pattern reference (e.g., any hierarchical table in `backend/db/schema/`)

### Quality Loop
```bash
bun run scripts/health/sub-loop.ts backend/db/schema/certificates/categories.ts --lifecycle lint
```

### Verification
- Self-referential FK correctly defined
- Soft-delete column present
- Unique index on name WHERE deletedAt IS NULL
- Arabic columns present (nameAr, descriptionAr)

---

## T03 — Create certificate_templates Table

**Estimated time**: 3 hours
**Depends on**: T02 (categories exist for FK)
**Requirements**: REQ-01-040 through REQ-01-050, AC-05, AC-06

### Subtasks

1. **Read applicable AGENTS.md**:
   - `backend/db/schema/AGENTS.md`

2. **Create** `backend/db/schema/certificates/templates.ts`:
   - Table: `certificate_templates`
   - Columns: `id` (uuid PK), `name`, `nameAr`, `description`, `descriptionAr`, `categoryId` (FK→categories), `parentId` (self-ref for version chain), `version` (int), `status` (pgEnum certificate_template_status), `orientation` (pgEnum), `widthPx`, `heightPx`, `backgroundType` (pgEnum), `backgroundColor`, `backgroundImageStorageId`, `fontFamily`, `fontFamilyAr`, `titleText`, `titleTextAr`, `bodyText`, `bodyTextAr`, `createdAt`, `updatedAt`, `deletedAt`
   - Indexes: idx on `categoryId`, idx on `status`, idx on `parentId`, GIN index for FTS on (name, nameAr, description, descriptionAr), composite unique idx on (parentId, version)
   - FK: `categoryId` REFERENCES `certificate_categories.id` with SET NULL on delete (so deleting a category doesn't cascade to templates)
   - FTS: using `tsvector` generated column or GIN on expression

3. **Verify** FTS index follows PostgreSQL GIN pattern with `websearch_to_tsquery` compatibility

### Quality Loop
```bash
bun run scripts/health/sub-loop.ts backend/db/schema/certificates/templates.ts --lifecycle lint
```

### Verification
- FTS GIN index on name/nameAr/description/descriptionAr
- Version chain self-referential FK defined
- Status pgEnum referenced correctly
- Soft-delete column present

---

## T04 — Create certificate_template_elements Table

**Estimated time**: 2 hours
**Depends on**: T03 (templates table exists for FK)
**Requirements**: REQ-01-060 through REQ-01-068, AC-07

### Subtasks

1. **Read** `backend/db/schema/AGENTS.md`

2. **Create** `backend/db/schema/certificates/templateElements.ts`:
   - Table: `certificate_template_elements`
   - Columns: `id` (uuid PK), `templateId` (FK→templates), `type` (pgEnum certificate_element_type), `label`, `content`, `x` (int), `y` (int), `width` (int), `height` (int), `rotation` (int), `zIndex` (int), `fontSize`, `fontWeight`, `color`, `fontFamily`, `textAlign`, `imageUrl`, `shapeType`, `variableId` (FK→template_variables, nullable), `createdAt`, `updatedAt`
   - Indexes: idx on `templateId`, composite idx on (`templateId`, `zIndex`)
   - FK: `templateId` REFERENCES `certificate_templates.id` ON DELETE CASCADE
   - FK: `variableId` REFERENCES `certificate_template_variables.id` ON DELETE SET NULL
   - Note: Polymorphic type handled via `type` pgEnum — no separate tables per element type

3. **Verify** CASCADE on templateId is correct (deleting a template deletes its elements)

### Quality Loop
```bash
bun run scripts/health/sub-loop.ts backend/db/schema/certificates/templateElements.ts --lifecycle lint
```

### Verification
- CASCADE delete from templates
- Polymorphic type via pgEnum
- Position fields (x, y, width, height, rotation, zIndex) all present
- variableId FK nullable for static elements

---

## T05 — Create certificate_template_variables Table

**Estimated time**: 2 hours
**Depends on**: T03 (templates table exists for FK)
**Requirements**: REQ-01-070 through REQ-01-078, AC-08

### Subtasks

1. **Create** `backend/db/schema/certificates/templateVariables.ts`:
   - Table: `certificate_template_variables`
   - Columns: `id` (uuid PK), `templateId` (FK→templates), `name`, `nameAr`, `key` (machine key), `type` (pgEnum certificate_variable_type), `defaultValue`, `required` (boolean), `selectOptions` (jsonb for type='select'), `description`, `createdAt`, `updatedAt`
   - Indexes: idx on `templateId`, unique idx on (`templateId`, `key`)
   - FK: `templateId` REFERENCES `certificate_templates.id` ON DELETE CASCADE

2. **Verify** unique constraint on (templateId, key) prevents duplicate variable keys per template

### Quality Loop
```bash
bun run scripts/health/sub-loop.ts backend/db/schema/certificates/templateVariables.ts --lifecycle lint
```

### Verification
- Unique idx on (templateId, key)
- selectOptions jsonb for select-type variables
- CASCADE delete from templates
- `required` boolean flag present

---

## T06 — Create certificate_recipient_groups Table

**Estimated time**: 2 hours
**Depends on**: T03 (templates table exists for FK)
**Requirements**: REQ-01-080 through REQ-01-086, AC-09

### Subtasks

1. **Create** `backend/db/schema/certificates/recipientGroups.ts`:
   - Table: `certificate_recipient_groups`
   - Columns: `id` (uuid PK), `templateId` (FK→templates), `name`, `nameAr`, `description`, `status` (pgEnum certificate_recipient_group_status), `totalRecipients` (int), `generatedCount` (int), `createdAt`, `updatedAt`, `deletedAt`
   - Indexes: idx on `templateId`, idx on `status`
   - FK: `templateId` REFERENCES `certificate_templates.id` ON DELETE CASCADE
   - Soft-delete column present

2. **Verify** status pgEnum referenced correctly

### Quality Loop
```bash
bun run scripts/health/sub-loop.ts backend/db/schema/certificates/recipientGroups.ts --lifecycle lint
```

### Verification
- CASCADE delete from templates
- Soft-delete column present
- Status pgEnum referenced correctly

---

## T07 — Create certificate_recipient_group_items Table

**Estimated time**: 2 hours
**Depends on**: T06 (recipient_groups table exists for FK)
**Requirements**: REQ-01-090 through REQ-01-096, AC-10

### Subtasks

1. **Create** `backend/db/schema/certificates/recipientGroupItems.ts`:
   - Table: `certificate_recipient_group_items`
   - Columns: `id` (uuid PK), `groupId` (FK→recipient_groups), `studentId` (FK→students), `status` (pgEnum certificate_recipient_item_status), `errorMessage`, `certificateId` (FK→certificates, nullable), ` createdAt`, `updatedAt`
   - Indexes: idx on `groupId`, idx on `studentId`, unique idx on (`groupId`, `studentId`)
   - FK: `groupId` REFERENCES `certificate_recipient_groups.id` ON DELETE CASCADE
   - FK: `studentId` REFERENCES `students.id` ON DELETE CASCADE
   - FK: `certificateId` REFERENCES `certificates.id` ON DELETE SET NULL

2. **Verify** unique constraint on (groupId, studentId) prevents duplicate students in a group

### Quality Loop
```bash
bun run scripts/health/sub-loop.ts backend/db/schema/certificates/recipientGroupItems.ts --lifecycle lint
```

### Verification
- Unique idx on (groupId, studentId)
- CASCADE delete from recipient_groups
- certificateId nullable (set only after generation)

---

## T08 — Create recipient_group_item_variable_values Table

**Estimated time**: 2 hours
**Depends on**: T05 (template_variables exists), T07 (recipient_group_items exists)
**Requirements**: REQ-01-100 through REQ-01-105, AC-11

### Subtasks

1. **Create** `backend/db/schema/certificates/recipientGroupItemVariableValues.ts`:
   - Table: `recipient_group_item_variable_values`
   - Columns: `id` (uuid PK), `itemId` (FK→recipient_group_items), `variableId` (FK→template_variables), `value` (text), `createdAt`, `updatedAt`
   - Indexes: idx on `itemId`, unique idx on (`itemId`, `variableId`)
   - FK: `itemId` REFERENCES `certificate_recipient_group_items.id` ON DELETE CASCADE
   - FK: `variableId` REFERENCES `certificate_template_variables.id` ON DELETE CASCADE

2. **Verify** unique constraint on (itemId, variableId) ensures one value per variable per recipient

### Quality Loop
```bash
bun run scripts/health/sub-loop.ts backend/db/schema/certificates/recipientGroupItemVariableValues.ts --lifecycle lint
```

### Verification
- Unique idx on (itemId, variableId)
- CASCADE delete from both parent tables
- Value column typed as text (all variable values stored as text, parsed by type)

---

## T09 — Create certificates Table

**Estimated time**: 3 hours
**Depends on**: T03 (templates table exists for FK)
**Requirements**: REQ-01-110 through REQ-01-125, AC-12, AC-13

### Subtasks

1. **Create** `backend/db/schema/certificates/certificates.ts`:
   - Table: `certificates`
   - Columns: `id` (uuid PK), `templateId` (FK→templates), `studentId` (FK→students), `templateVersion` (int, snapshot at generation time), `status` (pgEnum certificate_status), `generationStatus` (pgEnum certificate_generation_status), `verificationCode` (text, unique), `pdfStorageId` (text, nullable), `pdfUrl` (text, nullable), `metadata` (jsonb), `generatedAt` (timestamp, nullable), `revokedAt` (timestamp, nullable), `revokedReason`, `expireDate` (timestamp, nullable), `createdAt`, `updatedAt`, `deletedAt`
   - Indexes: idx on `templateId`, idx on `studentId`, idx on `status`, unique idx on `verificationCode`, GIN index for FTS on (template snapshot fields), idx on `expireDate`
   - FK: `templateId` REFERENCES `certificate_templates.id` ON DELETE RESTRICT (don't allow deleting a template that has certificates)
   - FK: `studentId` REFERENCES `students.id` ON DELETE RESTRICT

2. **Verify** RESTRICT on templateId ensures certificates are never orphaned
3. **Verify** verificationCode unique index is not partial (all certs must have unique codes)

### Quality Loop
```bash
bun run scripts/health/sub-loop.ts backend/db/schema/certificates/certificates.ts --lifecycle lint
```

### Verification
- RESTRICT delete from templates and students
- Unique idx on verificationCode
- FTS GIN index present
- Soft-delete column present
- metadata jsonb for extensible data

---

## T10 — Create certificate_verifications Table

**Estimated time**: 2 hours
**Depends on**: T09 (certificates table exists for FK)
**Requirements**: REQ-01-130 through REQ-01-136, AC-14

### Subtasks

1. **Create** `backend/db/schema/certificates/certificateVerifications.ts`:
   - Table: `certificate_verifications`
   - Columns: `id` (uuid PK), `certificateId` (FK→certificates), `method` (pgEnum certificate_verification_method), `result` (pgEnum certificate_verification_result), `ipAddress` (inet), `userAgent` (text), `verifiedAt` (timestamp, default now()), `createdAt`
   - Indexes: idx on `certificateId`, idx on `result`, idx on `verifiedAt`
   - FK: `certificateId` REFERENCES `certificates.id` ON DELETE CASCADE
   - Note: This is an append-only log table — NO `deletedAt` column, NO `updatedAt` column
   - Note: `verifiedAt` defaults to `now()` — each verification is timestamped

2. **Verify** append-only nature — no soft delete, no update column

### Quality Loop
```bash
bun run scripts/health/sub-loop.ts backend/db/schema/certificates/certificateVerifications.ts --lifecycle lint
```

### Verification
- Append-only: no deletedAt, no updatedAt
- CASCADE delete from certificates
- inet type for ipAddress (PostgreSQL native type)

---

## T11 — Create template_style_presets Table

**Estimated time**: 2 hours
**Depends on**: T03 (templates table exists for FK)
**Requirements**: REQ-01-140 through REQ-01-145, AC-15

### Subtasks

1. **Create** `backend/db/schema/certificates/templateStylePresets.ts`:
   - Table: `template_style_presets`
   - Columns: `id` (uuid PK), `name`, `nameAr`, `fontFamily`, `fontFamilyAr`, `primaryColor`, `secondaryColor`, `backgroundColor`, `fontSize`, `fontWeight`, `textAlign`, `isSystem` (boolean, default false), `createdAt`, `updatedAt`
   - Indexes: idx on `isSystem`
   - No FKs (standalone config table)

2. **Verify** isSystem flag allows distinguishing built-in vs user-created presets

### Quality Loop
```bash
bun run scripts/health/sub-loop.ts backend/db/schema/certificates/templateStylePresets.ts --lifecycle lint
```

### Verification
- isSystem boolean flag present
- Arabic name column present (nameAr)
- No FK dependencies (standalone config)

---

## T12 — Define All Relations in drizzleRelations.ts

**Estimated time**: 3 hours
**Depends on**: T02 through T11 (all tables exist)
**Requirements**: REQ-01-003, REQ-01-150 through REQ-01-160, AC-16

### Subtasks

1. **Read** existing `backend/db/schema/drizzleRelations.ts` for pattern reference
2. **Modify** `backend/db/schema/drizzleRelations.ts`:
   - Add relations for all 10 certificate tables:
     - `certificateCategories` — many templates, self-referential parent/children
     - `certificateTemplates` — one category, many elements, many variables, many recipientGroups, many certificates, self-referential parent (version chain)
     - `certificateTemplateElements` — one template, optional variable
     - `certificateTemplateVariables` — one template, many element references, many itemVariableValues
     - `certificateRecipientGroups` — one template, many items
     - `certificateRecipientGroupItems` — one group, one student, one certificate, many variableValues
     - `recipientGroupItemVariableValues` — one item, one variable
     - `certificates` — one template, one student, many verifications
     - `certificateVerifications` — one certificate
     - `templateStylePresets` — no relations (standalone)

3. **Verify** all relation names follow existing Siraj naming conventions
4. **Verify** one/many relations correctly mapped

### Quality Loop
```bash
bun run scripts/health/sub-loop.ts backend/db/schema/drizzleRelations.ts --lifecycle lint
```

### Verification
- All 10 tables have relations defined
- Self-referential relations (categories, templates) correctly mapped
- `bun tsgo` passes with zero new type errors

---

## T13 — Create Barrel Exports

**Estimated time**: 1 hour
**Depends on**: T01 through T12 (all tables and enums exist)
**Requirements**: REQ-01-002, AC-17

### Subtasks

1. **Create** `backend/db/schema/certificates/index.ts`:
   - Re-export all table definitions: `certificateCategories`, `certificateTemplates`, `certificateTemplateElements`, `certificateTemplateVariables`, `certificateRecipientGroups`, `certificateRecipientGroupItems`, `recipientGroupItemVariableValues`, `certificates`, `certificateVerifications`, `templateStylePresets`
   - Re-export all pgEnums from `enums.ts`

2. **Modify** `backend/db/schema/index.ts`:
   - Add `export * from "./certificates"` to the existing barrel

3. **Verify** all exports resolve correctly

### Quality Loop
```bash
bun run scripts/health/sub-loop.ts backend/db/schema/certificates/index.ts --lifecycle lint
bun run scripts/health/sub-loop.ts backend/db/schema/index.ts --lifecycle lint
```

### Verification
- `import { certificateCategories } from "@/backend/db/schema"` works
- All 10 tables + 11 enums exported
- No circular import issues

---

## T14 — Generate and Apply Migration

**Estimated time**: 1 hour
**Depends on**: T01 through T13 (all schema files complete)
**Requirements**: REQ-01-005, AC-18

### Subtasks

1. **Run** `bun run db push` to generate and apply the migration:
   - This uses Drizzle push (not migrate) per Siraj convention for schema changes
   - Verify migration applies cleanly in development database

2. **Verify** all tables created in database:
   - Use `bun run db:studio` or direct SQL query to verify table structure
   - Check indexes, constraints, and FKs are present

3. **Verify** no existing data is affected (migration is additive only — new tables)

### Quality Loop
```bash
# Verify tsgo still passes after migration
bun tsgo
```

### Verification
- `bun run db push` completes successfully
- All 10 tables exist with correct columns, types, indexes, constraints
- No existing Siraj data affected (additive migration)

---

## T15 — Knowledge Propagation & Documentation

**Estimated time**: 2 hours
**Depends on**: T01 through T14 (all tasks complete)
**Requirements**: Feature 6 (Outcome Knowledge Base)

### Subtasks

1. **Read all outcome files** in `.ai/plans/cert-db-schema-enums/outcome/` to synthesize learnings

2. **Create canonical reference doc** `docs/drizzle/certificate-schema.md`:
   - Document the table structure, index strategies, FTS configuration
   - Document the soft-delete pattern used for cert tables
   - Document the self-referential FK pattern for categories and template version chain
   - Document the append-only pattern for verifications
   - Include rules and conventions for future cert schema modifications

3. **Update** `backend/db/schema/AGENTS.md`:
   - Add section on certificate sub-directory structure
   - Reference `docs/drizzle/certificate-schema.md`

4. **Update** root `AGENTS.md` Important References section with `docs/drizzle/certificate-schema.md`

5. **Run global quality check**:
   ```bash
   bun tsgo
   bun biome:check
   bun run lint
   ```

6. **Write outcome file**: `.ai/plans/cert-db-schema-enums/outcome/T15-knowledge-propagation-outcome.md`

7. **Update progress**: Mark task T15 as `[x]` in `tasks.md`

---

## Acceptance Criteria Mapping

| AC | Task |
|---|---|
| AC-01: All 11 pgEnums defined | T01 |
| AC-02: No enum name conflicts | T01, T14 |
| AC-03: Categories table with self-ref FK | T02 |
| AC-04: Categories soft-delete + unique idx | T02 |
| AC-05: Templates table with all fields | T03 |
| AC-06: Templates FTS GIN index | T03 |
| AC-07: Elements table with CASCADE | T04 |
| AC-08: Variables table with unique key | T05 |
| AC-09: Recipient groups with status | T06 |
| AC-10: Group items with unique student | T07 |
| AC-11: Item variable values unique per pair | T08 |
| AC-12: Certificates with RESTRICT delete | T09 |
| AC-13: Certificates FTS + verification code unique | T09 |
| AC-14: Verifications append-only | T10 |
| AC-15: Style presets standalone | T11 |
| AC-16: All relations defined | T12 |
| AC-17: Barrel exports work | T13 |
| AC-18: Migration applies cleanly | T14 |

---

## Reality Check Notes

> Added by codebase-reality verification pass on 2026-08-02. Verified against the actual state of `/home/ahmed/Projects/siraj-cert/`.

### Corrections applied to tasks.md
1. **T01 step 3** — original "Create `backend/db/schema/certificates/enums.ts`" + raw `pgEnum("name", [...])` pattern was corrected to "Append 11 certificate pgEnums to the **top-level** `backend/db/schema/enums.ts` registry" via the canonical `createPgEnumFromEnum("snake_case_name", Enum)` helper from `@/backend/utils/db.utils`. Verified reality: `backend/db/schema/enums.ts` is the SINGLE top-level registry (~45 entries); `backend/db/schema/AGENTS.md` mandates it stay top-level; there is NO per-domain `enums.ts` convention.
2. **T01 step 3** — added explicit list of the 11 pgEnum const export names (camelCase, matching the existing registry pattern: `certificateStatusEnum`, `templateElementTypeEnum`, etc.) and the TS enum source for each, plus a forward-dependency note that the TS enums live in Plan 02's `backend/enum/certificates/` (so Plan 1 imports them; Plan 1 executes on a placeholder if Plan 02 hasn't landed, then reconciles).
3. **T01 verification target** — `backend/db/schema/certificates/enums.ts` → top-level `backend/db/schema/enums.ts`.
4. **T01 step 4 verification target** — updated the path check to verify no naming conflicts with the existing entries in `backend/db/schema/enums.ts`.
5. **T01 quality-loop file** — updated `backend/db/schema/certificates/enums.ts` → `backend/db/schema/enums.ts` in both the direct `curl -d` lint-queue list and the `bun run scripts/health/sub-loop.ts ...` call.
6. **T01 verification bullets** — updated the wording: "All 11 pgEnums appended to `backend/db/schema/enums.ts` … via `createPgEnumFromEnum`".

### Caveats / things to keep an eye on during execution
- The forward dependency Plan 1 → Plan 2's TS enums means the pgEnum const export names in T01 step 3 are derived FROM the Plan-2 enum names. Confirm with Plan 02 design.md §4 that the TS enum class names match ({`CertificateTemplateStatus`, `CertificateOrientation`, `CertificateBackgroundType`, `CertificateElementType`, `CertificateVariableType`, `CertificateRecipientGroupStatus`, `CertificateRecipientItemStatus`, `CertificateStatus`, `CertificateGenerationStatus`, `CertificateVerificationMethod`, `CertificateVerificationResult`}).
- Confirm the canonical helper signature: `createPgEnumFromEnum(name: string, tsEnum: object)`. Verified import path `@/backend/utils/db.utils` (`backend/utils/db.utils.ts:3`).
- The `appPermissionEnum` carve-out (raw `pgEnum` because the AppPermission values are dot-paths) does NOT apply to cert enums — cert enums are simple snake_case-keyed string values, so `createPgEnumFromEnum` is the right tool for all 11.

### Verified reference files
- `backend/db/schema/enums.ts` — top-level registry pattern (45+ entries).
- `backend/db/schema/AGENTS.md` §"Shared Top-Level Files" — mandate that `enums.ts` stays top-level.
- `backend/utils/db.utils.ts` — `createPgEnumFromEnum` helper.
- `backend/db/schema/students/students.ts` — example domain file consuming a pgEnum from the top-level registry (`studentStatusEnum("status").notNull()`).
- `backend/enum/students/student-lifecycle.enum.ts` — TS enum + `ALLOWED_STATUS_TRANSITIONS` pattern (the contract Plan 1 depends on Plan 2 producing for cert).
