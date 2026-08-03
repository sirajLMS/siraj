# Plan 01 — DB Schema & Enums: Design

> **Feature**: Certificate Module — Database Schema, Enums, and Relations
> **Plan #**: 01
> **Dependencies**: None (foundation plan)
> **Authoritative Patterns**:
> - `backend/db/schema/AGENTS.md` — Schema layer rules
> - `backend/enum/AGENTS.md` — Enum layer rules
> - `siraj_analysis/01-db-schema-patterns.md` — Siraj schema patterns
> - `siraj_analysis/02-types-enums-permissions.md` — Siraj enum patterns
> - `docs/drizzle/prepared-statements.md` — Index design for prepared statement patterns
> - `docs/drizzle/neon-http-client.md` — `queryDb(tx)` read path and index implications

---

## 1. Architecture Position

```
┌──────────────────────────────────────────────────┐
│                   PostgreSQL                       │
│  ┌──────────────────────────────────────────────┐  │
│  │  certificate_categories                      │  │
│  │  certificate_templates                       │  │
│  │  certificate_template_elements               │  │
│  │  certificate_template_variables              │  │
│  │  certificate_recipient_groups                 │  │
│  │  certificate_recipient_group_items            │  │
│  │  recipient_group_item_variable_values        │  │
│  │  certificates                                 │  │
│  │  certificate_verifications                    │  │
│  │  template_style_presets                       │  │
│  └──────────────────────────────────────────────┘  │
│        ↑                                          │
│  Drizzle ORM (pgTable, pgEnum, relations)         │
│        ↑                                          │
│  backend/db/schema/certificates/                  │
└──────────────────────────────────────────────────┘
        ↑
  Repository Layer (Plan 3)
```

The schema layer is the deepest foundation of the certificate feature. No other layer directly touches the database — all access flows through repositories (Plan 3). This design follows the existing Siraj pattern where schema files define tables, enums, indexes, and relations, with barrel exports for convenient importing.

---

## 2. Design Goals

1. **Pattern Compliance** — Every table, enum, and index follows existing Siraj Drizzle conventions exactly, ensuring the certificate module is indistinguishable from core domain tables.
2. **Query Performance** — Indexes are proactively designed for all known access patterns (by ID, by status, by category, by template, FTS, pagination).
3. **Data Integrity** — Foreign keys, CHECK constraints, and unique indexes guarantee referential and domain integrity at the database level.
4. **Soft Delete Support** — Audit-relevant tables include soft-delete columns; child/junction tables use CASCADE for clean lifecycle management.
5. **i18n from the Ground Up** — Tables include Arabic column variants (`nameAr`, `descriptionAr`, `titleTextAr`) where localized display is needed.
6. **Searchable** — Full-text search GIN indexes on templates and certificates enable efficient search without external search infrastructure.

---

## 3. Key Design Decisions

### Decision 1: Canonical three-tier enum pattern (TS enums in `backend/enum/`, PG enum-colors in top-level `backend/db/schema/enums.ts`, tables in domain subdir)

**Context**: Siraj has a strict, codebase-wide enum convention. Reality-checked against `backend/db/schema/enums.ts`, `backend/utils/db.utils.ts`, `backend/enum/students/student-lifecycle.enum.ts`, and `backend/db/schema/students/students.ts`.

**Verified canonical pattern**:
1. **TypeScript `enum` definitions** live in `backend/enum/<subdir>/<entity>.enum.ts` (e.g. `backend/enum/students/student-lifecycle.enum.ts`). Const objects like `ALLOWED_STATUS_TRANSITIONS` live alongside their enum in the same file.
2. **Drizzle `pgEnum` color values** ALL live in the top-level `backend/db/schema/enums.ts` registry (there is exactly one such file; it imports every TS enum from `@/backend/enum` and registers each via `createPgEnumFromEnum("snake_case_name", Enum)`).
3. **`pgTable` files** in domain subdirs (e.g. `backend/db/schema/students/students.ts`) import the registered pgEnum from `@/backend/db/schema/enums` and consume it as `studentStatusEnum("status").notNull()`.

**Options Considered**:
1. Centralize all certificate pgEnums in top-level `backend/db/schema/enums.ts` + TS enums in `backend/enum/certificates/` — **SELECTED** (canonical codebase pattern; matches all 30+ existing domains).
2. Co-locate pgEnums with table definitions in `backend/db/schema/certificates/enums.ts` — **REJECTED** (diverges from the mandatory top-level `enums.ts` registry; `backend/db/schema/AGENTS.md` §"Shared Top-Level Files" requires `enums.ts` to stay top-level as the single registry imported by every domain file; only `appPermissionEnum` uses raw `pgEnum(...)` because it derives dynamically from `Object.values(AppPermission)`).
3. Use raw `pgEnum("name", ["draft", "published", ...])` literal-value form — **REJECTED** (the canonical helper `createPgEnumFromEnum` from `@/backend/utils/db.utils` derives color values from the TS enum, keeping TS ↔ PG values in sync with a single source of truth; every domain enum uses this helper).

**Decision**: Add 11 certificate pgEnums to the top-level `backend/db/schema/enums.ts` via `createPgEnumFromEnum("snake_case_name", <EnumName>)`, where each `<EnumName>` is a TS enum defined under `backend/enum/certificates/` (created in Plan 02 / T01 of that plan). The pgTable files under `backend/db/schema/certificates/` import their enums from `@/backend/db/schema/enums`, not from a co-located file.

**Rationale**: The `backend/db/schema/AGENTS.md` §"Shared Top-Level Files" and §"Enum Verification" sections and the actual `enums.ts` (45+ registrations, all using `createPgEnumFromEnum` except `appPermissionEnum`) confirm this. Co-locating pgEnums in the domain subdir would break the single-registry invariant and require every cross-domain importer to know the cert subdir. The TS enum ↔ PG enum coordinator contract lives in Plan 02 (TS enum is source of truth; Plan 1 imports it).

### Decision 2: Soft delete on parent tables, CASCADE on child tables

**Context**: Certificate templates have child tables (elements, variables, recipient groups) that should not outlive their parent, but certificates and verification logs must be preserved for audit.

**Options Considered**:
1. Soft delete on all tables — Pros: complete audit trail; Cons: excessive storage, complex queries
2. Soft delete only on parent/domain tables, CASCADE on children — Pros: clean child lifecycle, simple queries; Cons: child data is permanently lost on parent delete

**Decision**: Soft delete on `certificate_categories`, `certificate_templates`, `certificate_recipient_groups`, and `certificates`. CASCADE delete on `certificate_template_elements`, `certificate_template_variables`, `certificate_recipient_group_items`, and `recipient_group_item_variable_values`. No soft delete on `certificate_verifications` (append-only log).

**Rationale**: Child tables (elements, variables) are implementation details of their parent template — if a template is soft-deleted, its children should remain for potential restore, but if a template is hard-deleted, its children have no meaning alone. Certificates and verifications are audit records that must be preserved.

### Decision 3: ON DELETE RESTRICT for certificates → templates and students

**Context**: When a template or student is deleted, what happens to certificates that reference them?

**Options Considered**:
1. ON DELETE CASCADE — Pros: automatic cleanup; Cons: loses audit trail, dangerous
2. ON DELETE SET NULL — Pros: preserves certificate records; Cons: breaks referential integrity
3. ON DELETE RESTRICT — Pros: prevents deletion when certificates exist; Cons: requires manual cleanup

**Decision**: ON DELETE RESTRICT for `certificates.templateId` → `certificate_templates.id` and `certificates.studentId` → `students.id`.

**Rationale**: Certificates are legal/educational records. Preventing deletion of templates and students when certificates exist is the safest approach. The admin must first revoke or transfer certificates before deleting the referenced entity.

### Decision 4: Full-text search via GIN index with generated tsvector

**Context**: Template and certificate search needs to support Arabic and English text search.

**Options Considered**:
1. Use `pg_trgm` extension with GiST index — Pros: fuzzy matching; Cons: less precise for exact word search
2. Use PostgreSQL FTS with `to_tsvector` and GIN index — Pros: full-text ranking, stemming; Cons: Arabic stemming support is limited
3. Use both FTS (GIN) + trigram (GiST) — Pros: best of both; Cons: more storage, two indexes

**Decision**: Use FTS with GIN index for word-based search and trigram GiST for fuzzy name matching. The `pg_trgm` extension should be enabled (if not already) during migration.

**Rationale**: Template search benefits from both exact word matching (FTS) and fuzzy name matching (trigram). Arabic FTS support in PostgreSQL is limited but usable for basic search. The service layer can combine both approaches.

### Decision 5: Verification code as UUID-based unique string

**Context**: Each certificate needs a unique verification code for the public verification page.

**Options Considered**:
1. UUID as verification code — Pros: guaranteed unique, no collision; Cons: long, not human-readable
2. Short alphanumeric code (8-12 chars) — Pros: readable, shareable; Cons: collision risk
3. UUID with a short prefix (e.g., "CERT-XXXX-XXXX") — Pros: readable with namespace; Cons: more complex generation

**Decision**: Verification code is a short alphanumeric string (12 characters) generated by the service layer with a unique constraint and retry-on-collision pattern.

**Rationale**: A 12-character alphanumeric code provides sufficient entropy (36^12 possibilities) while being human-readable and shareable. The unique index enforces uniqueness, and the service layer (Plan 4) handles collision retries.

---

## 4. Table Specifications

### 4.1 certificate_categories

**Purpose**: Hierarchical category tree for organizing certificate templates.

**Location**: `backend/db/schema/certificates/categories.ts`

**Relations**:
- Self-referential: `parentId` → `certificate_categories.id` (parent category)
- One-to-many: `certificate_templates` → `certificate_categories` (templates in this category)

**Index Strategy**:
| Index | Columns | Type | Purpose |
|---|---|---|---|
| `cat_slug_unique` | `slug` | UNIQUE | Prevent duplicate slugs |
| `cat_parent_idx` | `parentId` | B-tree | Tree traversal queries |
| `cat_sort_idx` | `sortOrder` | B-tree | Ordered listing |
| `cat_deleted_at_idx` | `deletedAt` | B-tree | Soft-delete filtering |

### 4.2 certificate_templates

**Purpose**: Template definitions with visual properties, status lifecycle, and version chain.

**Location**: `backend/db/schema/certificates/templates.ts`

**Relations**:
- Many-to-one: `categoryId` → `certificate_categories.id`
- Self-referential: `parentId` → `certificate_templates.id` (version chain)
- One-to-many: `certificate_template_elements`, `certificate_template_variables`, `certificate_recipient_groups`, `certificates`

**Index Strategy**:
| Index | Columns | Type | Purpose |
|---|---|---|---|
| `tpl_name_version_unique` | `name, version` | UNIQUE | Prevent duplicate version names |
| `tpl_slug_version_unique` | `slug, version` | UNIQUE | Anchor version chain (`getVersionChain(slug)` — Plan 02/03) |
| `tpl_slug_trgm_idx` | `slug` | GiST (trigram) | Fuzzy slug lookup |
| `tpl_status_idx` | `status` | B-tree | Status filtering |
| `tpl_category_idx` | `categoryId` | B-tree | Category-based listing |
| `tpl_created_by_idx` | `createdBy` | B-tree | User-specific queries |
| `tpl_fts_idx` | `to_tsvector(name, description)` | GIN | Full-text search |
| `tpl_name_trgm_idx` | `name` | GiST (trigram) | Fuzzy name matching |
| `tpl_created_at_id_idx` | `createdAt, id` | Composite B-tree | Cursor pagination |

### 4.3 certificate_template_elements

**Purpose**: Visual elements placed on a template canvas.

**Location**: `backend/db/schema/certificates/templateElements.ts`

**Relations**:
- Many-to-one: `templateId` → `certificate_templates.id` (CASCADE)
- Many-to-one: `variableId` → `certificate_template_variables.id` (SET NULL)

**Index Strategy**:
| Index | Columns | Type | Purpose |
|---|---|---|---|
| `elem_template_idx` | `templateId` | B-tree | Template-to-element queries |
| `elem_template_z_idx` | `templateId, zIndex` | Composite B-tree | Rendering order |
| `elem_variable_idx` | `variableId` | B-tree | Variable-to-element lookups |

**CHECK Constraints**:
- `x >= 0`, `y >= 0`, `width > 0`, `height > 0`

### 4.4 certificate_template_variables

**Purpose**: Variable definitions for template interpolation.

**Location**: `backend/db/schema/certificates/templateVariables.ts`

**Relations**:
- Many-to-one: `templateId` → `certificate_templates.id` (CASCADE)

**Index Strategy**:
| Index | Columns | Type | Purpose |
|---|---|---|---|
| `var_template_name_unique` | `templateId, name` | UNIQUE | Prevent duplicate variable names |
| `var_template_idx` | `templateId` | B-tree | Template-to-variable queries |

### 4.5 certificate_recipient_groups

**Purpose**: Groups of students assigned to a template for batch certificate generation.

**Location**: `backend/db/schema/certificates/recipientGroups.ts`

**Relations**:
- Many-to-one: `templateId` → `certificate_templates.id` (CASCADE)
- One-to-many: `certificate_recipient_group_items`

**Index Strategy**:
| Index | Columns | Type | Purpose |
|---|---|---|---|
| `rg_template_idx` | `templateId` | B-tree | Template-to-group queries |
| `rg_status_idx` | `status` | B-tree | Status filtering |
| `rg_deleted_at_idx` | `deletedAt` | B-tree | Soft-delete filtering |

### 4.6 certificate_recipient_group_items

**Purpose**: Student entries within a recipient group.

**Location**: `backend/db/schema/certificates/recipientGroupItems.ts`

**Relations**:
- Many-to-one: `groupId` → `certificate_recipient_groups.id` (CASCADE)
- Many-to-one: `studentId` → `students.id` (CASCADE)
- Many-to-one: `certificateId` → `certificates.id` (SET NULL)

**Index Strategy**:
| Index | Columns | Type | Purpose |
|---|---|---|---|
| `rgi_group_student_unique` | `groupId, studentId` | UNIQUE | Prevent duplicates |
| `rgi_group_idx` | `groupId` | B-tree | Group-to-item queries |
| `rgi_student_idx` | `studentId` | B-tree | Student-to-group queries |

### 4.7 recipient_group_item_variable_values

**Purpose**: Per-recipient variable value overrides.

**Location**: `backend/db/schema/certificates/recipientGroupItemVariableValues.ts`

**Relations**:
- Many-to-one: `groupItemId` → `certificate_recipient_group_items.id` (CASCADE)
- Many-to-one: `variableId` → `certificate_template_variables.id` (CASCADE)

**Index Strategy**:
| Index | Columns | Type | Purpose |
|---|---|---|---|
| `rgivv_item_variable_unique` | `groupItemId, variableId` | UNIQUE | Prevent duplicates |
| `rgivv_item_idx` | `groupItemId` | B-tree | Item-to-value queries |

### 4.8 certificates

**Purpose**: Generated certificates with status lifecycle, verification code, and PDF reference.

**Location**: `backend/db/schema/certificates/certificates.ts`

**Relations**:
- Many-to-one: `templateId` → `certificate_templates.id` (RESTRICT)
- Many-to-one: `studentId` → `students.id` (RESTRICT)
- Many-to-one: `recipientGroupId` → `certificate_recipient_groups.id` (SET NULL)
- One-to-many: `certificate_verifications`

**Index Strategy**:
| Index | Columns | Type | Purpose |
|---|---|---|---|
| `cert_verification_code_unique` | `verificationCode` | UNIQUE | Verification code lookup |
| `cert_idempotency_key_unique` | `idempotencyKey` | UNIQUE (NULLS NOT DISTINCT) | Batch-generation idempotency (Plan 03 REQ-CERT-001) |
| `cert_template_idx` | `templateId` | B-tree | Template-to-certificate |
| `cert_student_idx` | `studentId` | B-tree | Student-to-certificate |
| `cert_status_idx` | `status` | B-tree | Status filtering |
| `cert_created_at_id_idx` | `createdAt, id` | Composite B-tree | Cursor pagination |
| `cert_fts_idx` | `to_tsvector(verificationCode)` | GIN | Full-text search |
| `cert_deleted_at_idx` | `deletedAt` | B-tree | Soft-delete filtering |

**CHECK Constraints**:
- If `status = 'revoked'` then `revokedBy` is not null
- If `status = 'revoked'` then `revokedReason` is not null
- If `status = 'issued'` then `issuedAt` is not null

### 4.9 certificate_verifications

**Purpose**: Verification log entries for public certificate verification.

**Location**: `backend/db/schema/certificates/verifications.ts`

**Relations**:
- Many-to-one: `certificateId` → `certificates.id` (CASCADE)

**Index Strategy**:
| Index | Columns | Type | Purpose |
|---|---|---|---|
| `ver_cert_idx` | `certificateId` | B-tree | Certificate-to-verifications |
| `ver_verified_at_idx` | `verifiedAt` | B-tree | Time-range queries |
| `ver_result_idx` | `verificationResult` | B-tree | Result filtering |

### 4.10 template_style_presets

**Purpose**: Reusable style presets for templates.

**Location**: `backend/db/schema/certificates/stylePresets.ts`

**Relations**:
- Many-to-one: `createdBy` → `users.id`

**Index Strategy**:
| Index | Columns | Type | Purpose |
|---|---|---|---|
| `sp_active_idx` | `isActive` | B-tree | Active preset listing |

---

## 5. pgEnum Specifications

### 5.1 Enum Definitions

All Drizzle pgEnums are registered in the top-level `backend/db/schema/enums.ts` registry via `createPgEnumFromEnum("certificate_<domain>", <Enum>)`, where each `<Enum>` is the TS enum defined in `backend/enum/certificates/certificate.enum.ts` (Plan 02). The pgTable files in `backend/db/schema/certificates/` import these pgEnums from `@/backend/db/schema/enums`. The barrel `backend/db/schema/certificates/index.ts` only re-exports `pgTable` definitions (not enums).

| Enum | Values | Description |
|---|---|---|
| `certificateTemplateStatusEnum` | draft, review, published, archived | Template lifecycle status |
| `certificateOrientationEnum` | landscape, portrait | Template orientation |
| `certificateBackgroundTypeEnum` | color, image, gradient | Background rendering type |
| `certificateElementTypeEnum` | static_text, data_text, data_date, image, qr_code, shape | Element polymorphic type |
| `certificateVariableTypeEnum` | text, number, date, select | Variable data type |
| `certificateRecipientGroupStatusEnum` | active, inactive, completed | Recipient group lifecycle |
| `certificateRecipientItemStatusEnum` | pending, processing, issued, failed, skipped | Per-recipient generation status |
| `certificateStatusEnum` | draft, pending, issued, revoked, expired | Certificate lifecycle |
| `certificateGenerationStatusEnum` | pending, processing, completed, failed | PDF generation status |
| `certificateVerificationMethodEnum` | qr_code, link, manual | How verification was accessed |
| `certificateVerificationResultEnum` | valid, invalid, revoked, expired, not_found | Verification outcome |

### 5.2 Enum Naming Convention

All certificate enums use `certificate_` prefix in the database (snake_case) and are registered via `createPgEnumFromEnum("certificate_<domain>", Enum)` in the top-level `backend/db/schema/enums.ts`. In TypeScript, the enum names live under `backend/enum/certificates/` (e.g. `CertificateStatus`, `CertificateTemplateStatus`) and the Drizzle pgEnum exports use camelCase (e.g. `certificateStatusEnum`, `certificateTemplateStatusEnum`) — matching the Siraj pattern (`studentStatusEnum`, `accountStatusEnum`).

---

## 6. Relations Specification

### 6.1 Relations File

All certificate relations SHALL be appended to the root `backend/db/drizzleRelations.ts` (verified: this single top-level file is the established relations registry — there is no per-domain `relations.ts` convention in the existing codebase). They use the **Drizzle 1.0 RC `defineRelations(schema, r => ({ ... }))` API** (the graph-based API exported as `relations` from `backend/db/drizzleRelations.ts`), NOT the legacy per-table `relations()` factory. Each relation pair is expressed as `r.one.<TableName>({ from, to })` / `r.many.<TableName>({ from, to })`; self-referential and inverse pairs use explicit `{ from, to }` field references. Verified against `backend/db/drizzleRelations.ts:1-4` (`import { defineRelations }` + `export const relations = defineRelations(...)`).

### 6.2 Relation Map

| From Table | Relation | To Table | Cardinality | Via |
|---|---|---|---|---|
| `certificate_categories` | parentCategory | `certificate_categories` | one | `parentId` |
| `certificate_categories` | childCategories | `certificate_categories` | many | `parentId` (inverse) |
| `certificate_categories` | templates | `certificate_templates` | many | `categoryId` |
| `certificate_templates` | category | `certificate_categories` | one | `categoryId` |
| `certificate_templates` | parentTemplate | `certificate_templates` | one | `parentId` |
| `certificate_templates` | childVersions | `certificate_templates` | many | `parentId` (inverse) |
| `certificate_templates` | elements | `certificate_template_elements` | many | `templateId` |
| `certificate_templates` | variables | `certificate_template_variables` | many | `templateId` |
| `certificate_templates` | recipientGroups | `certificate_recipient_groups` | many | `templateId` |
| `certificate_templates` | certificates | `certificates` | many | `templateId` |
| `certificate_template_elements` | template | `certificate_templates` | one | `templateId` |
| `certificate_template_elements` | variable | `certificate_template_variables` | one | `variableId` |
| `certificate_template_variables` | template | `certificate_templates` | one | `templateId` |
| `certificate_template_variables` | elementLinks | `certificate_template_elements` | many | `variableId` (inverse) |
| `certificate_recipient_groups` | template | `certificate_templates` | one | `templateId` |
| `certificate_recipient_groups` | items | `certificate_recipient_group_items` | many | `groupId` |
| `certificate_recipient_group_items` | group | `certificate_recipient_groups` | one | `groupId` |
| `certificate_recipient_group_items` | student | `students` | one | `studentId` |
| `certificate_recipient_group_items` | certificate | `certificates` | one | `certificateId` |
| `certificate_recipient_group_items` | variableValues | `recipient_group_item_variable_values` | many | `groupItemId` |
| `recipient_group_item_variable_values` | groupItem | `certificate_recipient_group_items` | one | `groupItemId` |
| `recipient_group_item_variable_values` | variable | `certificate_template_variables` | one | `variableId` |
| `certificates` | template | `certificate_templates` | one | `templateId` |
| `certificates` | student | `students` | one | `studentId` |
| `certificates` | recipientGroup | `certificate_recipient_groups` | one | `recipientGroupId` |
| `certificates` | verifications | `certificate_verifications` | many | `certificateId` |
| `certificate_verifications` | certificate | `certificates` | one | `certificateId` |

---

## 7. File Organization

### 7.1 Directory Structure

```
backend/db/schema/certificates/
├── index.ts                          # Barrel re-exports (tables only — pgEnums are registered in top-level backend/db/schema/enums.ts)
├── categories.ts                     # certificate_categories table
├── templates.ts                      # certificate_templates table
├── templateElements.ts              # certificate_template_elements table
├── templateVariables.ts             # certificate_template_variables table
├── recipientGroups.ts              # certificate_recipient_groups table
├── recipientGroupItems.ts           # certificate_recipient_group_items table
├── recipientGroupItemVariableValues.ts  # recipient_group_item_variable_values table
├── certificates.ts                  # certificates table
├── verifications.ts                  # certificate_verifications table
└── stylePresets.ts                   # template_style_presets table  (no relations.ts — relations live in root drizzleRelations.ts)
```

### 7.2 Barrel Export

`backend/db/schema/certificates/index.ts` re-exports **table definitions only** (pgEnums live in the top-level `backend/db/schema/enums.ts` registry; relations live in the top-level `backend/db/drizzleRelations.ts` registry).

`backend/db/schema/index.ts` adds `export * from "./certificates";` to re-export the certificates table barrel (mirrors existing sub-directory exports like `export * from "./students";`).

---

## 8. i18n Design

### 8.1 Namespace Structure

Translation keys for schema-level concerns live under `certificates.schema` with sub-domains:
- `certificates.schema.errors` — Validation error messages
- `certificates.schema.enums` — Enum display names
- `certificates.schema.messages` — Count-based messages

### 8.2 Locale Files

| Locale | File |
|---|---|
| English | `shared/locale/en/certificates-schema.ts` |
| Arabic | `shared/locale/ar/certificates-schema.ts` |

### 8.3 Type Schema

The locale type schema defines the shape of translation functions, including pluralization signatures for count-based messages.

---

## 9. Migration Strategy

### 9.1 Drizzle Push (Primary)

Schema changes are applied via `bun run db push` which generates the migration automatically. This is the standard Siraj approach for Drizzle-managed schema.

### 9.2 Extension Dependencies

IF `pg_trgm` extension is not already enabled, a custom SQL migration (`bun db migrate`) SHALL be created to enable it before the trigram GiST indexes can be created.

### 9.3 Migration Safety

- All tables are new (no existing data migration needed)
- Indexes can be created concurrently (specify `CONCURRENTLY` if needed for large tables, though new tables don't require it)
- Foreign key constraints are safe to add on empty tables

---

## 10. Error Handling Strategy

Schema-level errors are handled at the database constraint level:
- Unique constraint violations return error codes that the repository layer (Plan 3) catches and translates using the i18n keys defined in requirements.md
- CHECK constraint violations return error codes that the service layer (Plan 4) catches
- Foreign key violations return error codes that the repository layer catches

The schema itself does not produce user-facing errors — it enforces integrity, and higher layers translate violations to localized messages.

---

## 11. Outcome & Knowledge Transfer Protocol

- **Before Execution**: Read all files in `.ai/plans/cert-01-db-schema-enums/outcome/`
- **After Execution**: Write outcome files for each task
- **Knowledge Propagation**: After all tasks complete, create `docs/drizzle/certificate-schema.md` with schema patterns, index strategies, and migration notes. Update `backend/db/schema/AGENTS.md` with certificate schema references.

---

## 12. UX/Navigation Specification

This plan does not introduce any UI routes or navigation items. It is a pure backend data layer plan.

| Route | N/A |
|---|---|
| Sidebar | N/A |
| Roles | N/A |
| Mobile/Desktop | N/A |
| Permissions | N/A |

---

## Reality Check Notes

> Added by codebase-reality verification pass on 2026-08-02. Verified against the actual state of `/home/ahmed/Projects/siraj-cert/`.

### Verified correct (no changes needed)
- **Domain subdirectory layout** — `backend/db/schema/certificates/` is the correct convention (mirrors existing `students/`, `teachers/`, `billing/`, etc.). ✓
- **File naming** — `<entity>.ts` per table (e.g. `categories.ts`, `templates.ts`) matches `backend/db/schema/teachers/teacher-banking.ts` pattern. ✓
- **Top-level barrel wiring** — adding `export * from "./certificates";` to `backend/db/schema/index.ts` matches the existing 14 sub-directory exports. ✓
- **Import alias `@/backend/db/schema`** — confirmed via `backend/db/schema/agents.md` §"Import Convention" and existing files (`students.ts` line 17: `import { ... } from "@/backend/db/schema/enums"`). ✓
- **Soft-delete column convention** (`deletedAt` timestamp) — confirmed (e.g. `permissions.ts`, `soft-delete.repository.ts` `SOFT_DELETE_TABLES`). ✓
- **Cursor pagination index pattern** `index("..._pagination_idx").on(createdAt, id)` — confirmed verbatim in `students.ts:88`. ✓
- **Authored `AGENTS.md` references** — `backend/db/schema/AGENTS.md` and `backend/enum/AGENTS.md` both exist and were consulted. ✓
- **`scripts/health/sub-loop.ts`** — confirmed to exist. ✓

### Corrections applied
1. **pgEnum registry location** — Original Decision 1 proposed co-locating pgEnums in a per-domain `backend/db/schema/certificates/enums.ts`. **Corrected**: omitted; all pgEnums are appended to the top-level `backend/db/schema/enums.ts` registry. Verified pattern in `backend/db/schema/enums.ts` (45+ registrations) and mandated by `backend/db/schema/AGENTS.md` §"Shared Top-Level Files" (states `enums.ts` stays top-level as the single registry imported by every domain file).
2. **pgEnum registration helper** — originals used raw `pgEnum("name", [...])`. **Corrected** to `createPgEnumFromEnum("name", Enum)` from `@/backend/utils/db.utils`. Verified the helper exists at `backend/utils/db.utils.ts:3` and that every domain enum except the dynamic `appPermissionEnum` uses it (TS enum is source of truth for PG values).
3. **TS enum ↔ PG enum split** — added explicit coordinator contract: TS enums live under `backend/enum/certificates/<entity>.enum.ts` (created in Plan 02); Plan 1's `enums.ts` imports them. Verified split pattern via `backend/enum/students/student-lifecycle.enum.ts` (TS) ↔ `backend/db/schema/enums.ts:54` (PG via helper) ↔ `backend/db/schema/students/students.ts:62` (table consuming `studentStatusEnum`).
4. **Relations file** — Design §6.1 originally offered "relations in `relations.ts` (or appended to root `drizzleRelations.ts`)". **Corrected**: appended only to root `backend/db/drizzleRelations.ts` — verified that this single top-level file is the established relations registry (no per-domain `relations.ts` exists anywhere in the codebase).
5. **§7.1 directory listing** — removed the bogus per-domain `enums.ts` entry from the cert subdir tree.
6. **§7.2 barrel description** — corrected to state the cert subdir barrel re-exports **table definitions only** (pgEnums stay in the top-level registry).
7. **§5.1/§5.2** — corrected enum location and naming convention to reflect the actual `createPgEnumFromEnum` + camelCase export pattern.

### Caveats / things to keep an eye on during execution
- The PG enum migration for the 11 new enums must be coordinated with Plan 02's TS enum definitions. Plan 1 executes first per the dependency graph, so Plan 1 must reference the TS enums from Plan 2 (forward dependency) — acceptable via placeholder imports that are reconciled when Plan 2 lands. The plan is now explicit about this.
- `pg_trgm` extension enablement (if not present) and the GIN/GiST FTS indexes should be created via `bun db push` per `AGENTS.md` (the codebase disables `db reset` and `db cleanGenerate`).

---

## SWE Expert Review Notes

### Issues found and fixed (this pass)

1. **[CRITICAL — Relations API]** §6.1 stated relations use "the Drizzle `relations()` function" (the legacy per-table factory) — contradicted verified reality: `backend/db/drizzleRelations.ts:1-4` uses the Drizzle 1.0 RC `defineRelations(schema, r => ({ ... }))` graph API exported as `relations`. **Fixed**: §6.1 rewritten to specify `defineRelations` + `r.one.<Table>({ from, to })` / `r.many.<Table>({ from, to })`. REQ-01-003 carried the same bug — fixed to reference `defineRelations`.
2. **[CRITICAL — Nonexistent file]** §7.1 directory tree listed a per-domain `relations.ts` ("Drizzle relations for certificate tables"). No such file convention exists anywhere in the codebase (single root `drizzleRelations.ts` is the registry). **Fixed**: removed that line; the cert subdir now ends at `stylePresets.ts` with an inline note that relations live in the root file.
3. **[HIGH — Cross-plan column gap]** Plan 02/03 `getVersionChain(slug)` and "catch (slug, version) conflict" referenced a `slug` column that Plan 01's `certificate_templates` schema did NOT define (it only had `name, version`). **Fixed**: added `slug text NOT NULL` column to `certificate_templates` (REQ-01-020), added `tpl_slug_version_unique` index + `tpl_slug_trgm_idx` GiST trigram index in §4.2. `getVersionChain` and the conflict check now have a column to operate on.
4. **[HIGH — Cross-plan column gap]** Plan 03 REQ-CERT-001 needs `idempotencyKey` for batch-generation retry dedup, but Plan 01's `certificates` schema had no such column. **Fixed**: added `idempotencyKey text NULL` to `certificates` (REQ-01-110) and `cert_idempotency_key_unique` index (NULLS NOT DISTINCT) in §4.8. NULLs allowed so pending retries are unaffected; collisions on the key short-circuit duplicate generation.

### Reality-check mismatches corrected
- §6.1 "relations()" → "defineRelations(schema, r => ({...}))"; the relations registry is the single root file, not a per-domain file. Verified at `backend/db/drizzleRelations.ts:1-4`.
- `pg_trgm` extension is ALREADY enabled in `1-extensions.sql` — the existing caveat incorrectly implies it must be added; corrected below.

### Architectural concerns (remaining, flagged for human review)
- **Verification code generation strategy is deferred to Plan 4 (issue/generation layer), not Plan 1.** Plan 1 only guarantees uniqueness via `cert_verification_code_unique`. Security review must confirm Plan 4 uses a cryptographically random generator with enough entropy (≥16 chars from a 62-symbol alphabet ≈ 95 bits) AND a `ON CONFLICT DO NOTHING`/retry loop to handle the unavoidable birthday collisions at scale (millions of certs). The UNIQUE constraint is the safety net, not the source of randomness.
- **FTS config is `'simple'`**, not an Arabic-aware config. `certificates.recipientName` (Plan 03 design §7.1) does NOT exist in this schema — recipient name is join-derived from `students`. REQ-01-116 was already hedged ("student-derived name fields"). Plan 03 must either (a) FTS only on `verificationCode` (exact-match-ish) which exists, or (b) generate a denormalized `recipientName` snapshot column if search by recipient name is a real requirement. **Decision needed**: is "search certificates by recipient name" a v1 requirement? If yes, Plan 1 should add a `recipientName text` snapshot column to `certificates` (filled at issue time from the student join, frozen for the cert's lifetime) — this also avoids N+1 and join cost on every verification lookup. **Flagged**: add `recipientName text NULL` to `certificates` if recipient-name search is v1.
- **Timestamp precision**: requirements/design use `timestamp` without specifying `{ withTimezone: true, precision: 3 }`. Verified Siraj canonical timestamp is `timestamp("...", { withTimezone: true, precision: 3 }).notNull()` (no `defaultNow`; repo sets `createdAt`/`updatedAt`). All cert `createdAt`/`updatedAt` MUST follow this exact form; `deletedAt` is the nullable timestamptz(3) variant. The "default `now()`" wording in the requirements column tables must be dropped during execution (repo-owned, not DB-default). **Flagged for execution-time enforcement.**
- **Soft-delete scope asymmetry**: `certificate_categories`, `certificate_templates`, `certificate_recipient_groups`, `certificates` are soft-deletable; child tables cascade. But `certificate_verifications` is append-only (correct — audit log). Plan 03 must add all 4 cert soft-delete tables to both `SOFT_DELETE_TABLES` map AND the `Types.SoftDeletableTableName` union type (verified: `SoftDeleteRepository.softDelete` at `soft-delete.repository.ts:69` keys off `SoftDeletableTableName`; the map and the type union must stay in sync or TS compilation fails).
- **(name, version) vs (slug, version)**: two UNIQUE constraints on `certificate_templates` that overlap semantically — ensure the app layer treats `slug` as the canonical identity for the version family and `name` as the human label (which may be localized/renamed). Otherwise both uniques fight each other for "what identifies a template family". **Flagged**: confirm with Plan 02 that the type layer's `SubmitInput` excludes `slug` (system-generated) and includes `name`.

### Remaining risks flagged for human review
1. **Entropy of verification codes** belongs to Plan 4 — confirm before sign-off.
2. **`recipientName` denormalization decision** — confirm whether v1 needs it (affects Plan 1 + Plan 3 FTS).
3. **11 enums forward-depend on Plan 02's TS enums** — Plan 1 executes first; ensure placeholder/forward-reference strategy is documented in the migration task (T14).
