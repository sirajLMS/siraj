# Design: Certificate DB Schema & Enums (Plan 01)

## Document Information

- **Feature Name**: Certificate Database Schema & Enums
- **Target Directory**: `.ai/draft_plans/cert/plans/01-db-schema-enums`
- **Outcome Directory**: `.ai/draft_plans/cert/plans/01-db-schema-enums/outcome`
- **Version**: 1.0
- **Date**: 2025-01-20
- **Author**: Siraj Development Team
- **Reviewers**: Backend team lead, Database administrator
- **Related Documents**:
  - Requirements: `.ai/draft_plans/cert/plans/01-db-schema-enums/requirements.md`
  - Analysis: `.ai/draft_plans/cert/siraj_analysis/01-db-schema-patterns.md`
  - Analysis: `.ai/draft_plans/cert/cgvs_analysis/02-database-schema.md`
  - Analysis: `.ai/draft_plans/cert/cgvs_analysis/01-generation-logic.md`

## Overview

This design defines the complete database schema layer for the certificate feature. It creates 9 PostgreSQL tables, 6 enum types, centralized relations, RLS policies, CHECK constraints, and indexes — all following established Siraj patterns observed in the billing, storage, and scheduling schema modules.

The schema is organized under `backend/db/schema/certificates/` with a barrel export, mirroring the existing `billing/`, `storage/`, and `communications/` domain directories. TS enums live in `backend/enum/certificates/certificate.enum.ts` and pgEnums are registered in the shared `schema/enums.ts` file.

### Design Goals

- **Type Safety**: Two-tier enum system (TS enum + pgEnum) ensures compile-time and database-level type enforcement
- **Data Integrity**: CHECK constraints, unique indexes, and foreign keys enforce business rules at the DB level
- **Security**: RLS soft-delete policies consistent with existing Siraj tables
- **Query Performance**: Btree indexes on all FK columns, status columns, and unique indexes on verification code and idempotency key
- **Extensibility**: jsonb config columns on elements and version snapshots allow flexible schema evolution without migrations

### Key Design Decisions

- **UUID PKs over serial**: Consistent with all Siraj tables — `uuid("id").defaultRandom().primaryKey()`
- **No `defaultNow()` on main entity timestamps**: Repository layer sets timestamps explicitly (Siraj convention). Junction tables use `defaultNow()` for `created_at`.
- **`student_ids text[]` array over junction table**: Recipient groups use a PostgreSQL array for lightweight student grouping. Student existence is validated at the service layer, not via FK constraints. This avoids a heavy `certificate_recipient_group_students` junction table for a simple batch membership list.
- **`element_snapshot` jsonb over normalized version elements**: Template versions store a point-in-time jsonb snapshot of all elements rather than a complex version-elements junction. This is simpler and avoids cascade complexity.
- **Self-referencing categories with `ON DELETE SET NULL`**: Category hierarchy uses `parent_id` self-reference. Deleting a parent sets children's `parent_id` to NULL rather than cascading, preserving data.
- **`ON DELETE RESTRICT` on certificates→templates**: Prevents hard-deleting a template that has issued certificates. Soft-delete is still available.
- **Shared `TemplateStatus` enum for templates and versions**: Both `certificate_templates.status` and `certificate_template_versions.status` use the same `template_status` pgEnum to avoid enum proliferation.
- **Verification table is RLS-exempt**: `certificate_verifications` allows public INSERT (for unauthenticated verification lookups). No `deleted_at` column — it's an append-only audit table.

---

## UX/Navigation Specification (REQUIRED)

> **Note**: This plan is schema-only. No UI routes, sidebar entries, or frontend components are created. The navigation specification is provided here for context and will be refined in Plan 05 (Frontend Views).

### Future Routes & URLs (Deferred to Plans 05+)

| Route | Purpose | Permission Required | Roles with Access |
|-------|---------|---------------------|-------------------|
| `/certificates` | Certificate list & management | `CERTIFICATE_VIEW` | SUPER_ADMIN, ACADEMY_ADMIN, STAFF |
| `/certificates/templates` | Template builder & list | `TEMPLATE_MANAGE` | SUPER_ADMIN, ACADEMY_ADMIN |
| `/certificates/templates/[id]` | Template detail/editor | `TEMPLATE_MANAGE` | SUPER_ADMIN, ACADEMY_ADMIN |
| `/certificates/verify` | Public verification page | (public, no auth) | ALL (unauthenticated) |
| `/certificates/verify/[code]` | Direct verification by code | (public, no auth) | ALL (unauthenticated) |
| `/certificates/[id]` | Certificate detail view | `CERTIFICATE_VIEW` | SUPER_ADMIN, ACADEMY_ADMIN, STAFF |
| `/certificates/recipient-groups` | Recipient group management | `CERTIFICATE_MANAGE` | SUPER_ADMIN, ACADEMY_ADMIN |

### Sidebar Navigation Integration (Future)

- **Group**: "Certificates (grp_certificates)"
- **Parent Item**: Top-level "Certificates" group in the sidebar
- **Children**: Templates, Recipient Groups, Issued Certificates (in this order)
- **Mobile Bottom Nav**: Not included in bottom nav (admin-only feature)

### Role-Based Access Matrix (Future)

| Role | Routes Accessible | Permissions Granted |
|------|-------------------|---------------------|
| SUPER_ADMIN | All certificate routes | All certificate permissions |
| ACADEMY_ADMIN | All certificate routes | All certificate permissions |
| SUPERVISOR | `/certificates`, `/certificates/[id]` | `CERTIFICATE_VIEW` (read-only) |
| TEACHER | None | N/A (certificates are admin-managed) |
| PARENT | `/certificates/verify` only | Public verification only |
| STUDENT | `/certificates/verify` only | Public verification only |
| STAFF | `/certificates`, `/certificates/[id]` | `CERTIFICATE_VIEW` |

### Per-Audience Rendering (Future)

| Audience | Prominent Content / Differences |
|----------|----------------------------------|
| Student | No certificate management access — public verification only |
| Parent | No certificate management access — public verification only |
| Teacher | No certificate management access — public verification only |
| Supervisor | Read-only certificate list and detail |
| Admin/Staff | Full CRUD: template builder, recipient groups, certificate issuance |

### Mobile vs Desktop Variants (Future)

| Aspect | Desktop | Mobile |
|--------|---------|--------|
| Template editor | Full drag-and-drop canvas with element palette | Simplified list-based editor (no drag-drop) |
| Certificate list | DataGrid with filters, bulk actions | Card list with basic filtering |
| Verification page | Full-width certificate preview | Scaled certificate preview |

### Permission Mapping (Future)

| Component/Route | Required Permission | Source |
|-----------------|---------------------|--------|
| CertificateList | `CERTIFICATE_VIEW` | `requirePermissionForPage` |
| TemplateList | `TEMPLATE_MANAGE` | `requirePermissionForPage` |
| CertificateDetail | `CERTIFICATE_VIEW` | `requirePermissionForPage` |
| PublicVerification | (public, no permission) | Open route |

---

## Architecture

### System Context

The certificate schema module is a new domain within the existing Siraj PostgreSQL database. It depends on:
- `users` table (for `created_by_user_id`, `updated_by_user_id`, `verified_by_user_id`)
- `students` table (for `student_id` on certificates and `student_ids` array on recipient groups)
- `storage_file` table (for file attachment junctions via `certificate_files`)

```
┌──────────────────────────────────────────────────┐
│              PostgreSQL Database                  │
│                                                   │
│  ┌──────────┐  ┌──────────────────────┐          │
│  │  users   │──│  certificates         │          │
│  └──────────┘  │  (created_by_user_id) │          │
│                └──────────┬───────────┘          │
│  ┌──────────┐  ┌──────────┴───────────┐          │
│  │ students │──│  certificate_files   │──storage │
│  └──────────┘  └──────────────────────┘  file    │
│                                                   │
│  ┌──────────────────────┐  ┌──────────────────┐   │
│  │ certificate_templates│──│ certificate_     │   │
│  │  ├── elements        │  │ categories       │   │
│  │  ├── variables       │  └──────────────────┘   │
│  │  └── versions        │                         │
│  ├── recipient_groups   │  ┌──────────────────┐   │
│  └── certificates       │  │ certificate_      │   │
│                          │  │ verifications     │   │
│                          │  └──────────────────┘   │
└──────────────────────────────────────────────────┘
```

### High-Level Architecture

```
backend/
├── db/
│   ├── schema/
│   │   ├── certificates/
│   │   │   ├── certificates.ts          (tables: certificates, certificate_verifications)
│   │   │   ├── certificate-templates.ts  (tables: certificate_templates, template_elements, template_variables, certificate_template_versions)
│   │   │   ├── certificate-categories.ts (table: certificate_categories)
│   │   │   ├── certificate-recipient-groups.ts (table: certificate_recipient_groups)
│   │   │   ├── certificate-files.ts       (table: certificate_files -- junction)
│   │   │   └── index.ts                  (barrel: export * from all)
│   │   ├── enums.ts                      (add 6 pgEnums)
│   │   └── index.ts                      (add: export * from "./certificates")
│   ├── drizzleRelations.ts              (add certificate domain relations)
│   └── migration/
│       └── certificates_rls_policies.sql  (new RLS migration)
├── enum/
│   └── certificates/
│       ├── certificate.enum.ts           (6 TS enums)
│       └── index.ts                     (barrel: export * from "./certificate.enum")
```

### Technology Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| ORM | Drizzle ORM | Existing project standard; type-safe PostgreSQL ORM |
| Migrations | Drizzle Kit (`drizzle-kit push`) | Generates schema migrations from table definitions |
| Custom SQL | PostgreSQL DDL (RLS policies) | Drizzle does not manage RLS policies; hand-written SQL required |
| Enums | Two-tier (TS enum + pgEnum) | Compile-time type safety + database-level constraint |
| Relations | `defineRelations()` centralized API | Siraj's established pattern for Drizzle relation queries |

---

## Components and Interfaces

### Component 1: TS Enums (`backend/enum/certificates/certificate.enum.ts`)

**Purpose**: Define 6 TypeScript enums for the certificate domain that are used in schema, types, services, and GraphQL layers (backend-only).

**Responsibilities**:
- Export `CertificateStatus` enum (DRAFT, ISSUED, EXPIRED, REVOKED, ARCHIVED)
- Export `TemplateStatus` enum (DRAFT, PUBLISHED, ARCHIVED)
- Export `TemplateElementType` enum (TEXT, IMAGE, QR_CODE, SIGNATURE, SHAPE)
- Export `TemplateVariableType` enum (TEXT, DATE, NAME, EMAIL, CUSTOM)
- Export `CertificateOrientation` enum (LANDSCAPE, PORTRAIT)
- Export `VerificationStatus` enum (VALID, INVALID, EXPIRED, REVOKED)

**Implementation Notes**:
- All enum values use SCREAMING_SNAKE_CASE with string values matching keys (e.g., `DRAFT = "DRAFT"`)
- File follows `backend/enum/<subdir>/<entity>.enum.ts` convention per `backend/enum/AGENTS.md`
- Barrels: `backend/enum/certificates/index.ts` re-exports, `backend/enum/index.ts` adds `export * from "./certificates"`

### Component 2: pgEnums (`backend/db/schema/enums.ts`)

**Purpose**: Register 6 PostgreSQL enum types using the `createPgEnumFromEnum()` helper.

**Implementation Notes**:
- Import TS enums from `@/backend/enum/certificates/certificate.enum`
- Import `createPgEnumFromEnum` from `@/backend/utils/db.utils`
- Pattern: `export const certificateStatusEnum = createPgEnumFromEnum("certificate_status", CertificateStatus);`
- pgEnum names use snake_case (PostgreSQL convention): `certificate_status`, `template_status`, `template_element_type`, `template_variable_type`, `certificate_orientation`, `verification_status`

### Component 3: Schema Table Files

Each table is defined using `pgTable()` with columns, FK references, and a table config array containing indexes and CHECK constraints.

#### Table: `certificates`

**Database Name**: `certificates`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | `.defaultRandom().primaryKey()` |
| `template_id` | `uuid` | `.notNull().references(() => certificateTemplates.id, { onDelete: "restrict" })` |
| `student_id` | `uuid` | `.notNull().references(() => students.id, { onDelete: "restrict" })` |
| `recipient_group_id` | `uuid` | `.references(() => certificateRecipientGroups.id, { onDelete: "set null" })` |
| `version_id` | `uuid` | `.references(() => certificateTemplateVersions.id, { onDelete: "set null" })` |
| `status` | `certificateStatusEnum` | `.notNull()` |
| `verification_code` | `varchar(255)` | `.notNull().unique()` |
| `file_path` | `varchar(1024)` | nullable |
| `issued_at` | `timestamp(3, tz)` | nullable |
| `expires_at` | `timestamp(3, tz)` | nullable |
| `revoked_at` | `timestamp(3, tz)` | nullable |
| `revocation_reason` | `text` | nullable |
| `idempotency_key` | `varchar(255)` | `.notNull()` |
| `created_by_user_id` | `uuid` | `.references(() => users.id, { onDelete: "set null" })` |
| `created_at` | `timestamp(3, tz)` | `.notNull()` (no defaultNow) |
| `updated_at` | `timestamp(3, tz)` | `.notNull()` (no defaultNow) |
| `deleted_at` | `timestamp(3, tz)` | nullable |

**Table Config (indexes + constraints)**:
```typescript
table => [
  uniqueIndex("certificates_verification_code_unique_idx").on(table.verificationCode),
  uniqueIndex("certificates_idempotency_key_unique_idx").on(table.idempotencyKey),
  uniqueIndex("certificates_template_student_unique_idx").on(table.templateId, table.studentId),
  index("certificates_template_id_idx").on(table.templateId),
  index("certificates_student_id_idx").on(table.studentId),
  index("certificates_recipient_group_id_idx").on(table.recipientGroupId),
  index("certificates_version_id_idx").on(table.versionId),
  index("certificates_status_idx").on(table.status),
  index("certificates_created_at_idx").on(table.createdAt),
  check("certificates_issued_expires_chk", sql`${table.issuedAt} <= ${table.expiresAt} OR ${table.expiresAt} IS NULL`),
]
```

**RLS Comment**:
```typescript
// NOTE: PostgreSQL Row-Level Security (RLS) policies are active on this table.
// See backend/db/migration/certificates_rls_policies.sql for policy definitions.
```

#### Table: `certificate_templates`

**Database Name**: `certificate_templates`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | `.defaultRandom().primaryKey()` |
| `name` | `jsonb` | `.notNull().$type<LocalizedString>()` |
| `description` | `text` | nullable |
| `category_id` | `uuid` | `.references(() => certificateCategories.id, { onDelete: "set null" })` |
| `status` | `templateStatusEnum` | `.notNull()` |
| `orientation` | `certificateOrientationEnum` | `.notNull()` |
| `width` | `integer` | `.notNull()` |
| `height` | `integer` | `.notNull()` |
| `background_color` | `varchar(50)` | nullable |
| `font_family` | `varchar(100)` | nullable |
| `created_by_user_id` | `uuid` | `.references(() => users.id, { onDelete: "set null" })` |
| `updated_by_user_id` | `uuid` | `.references(() => users.id, { onDelete: "set null" })` |
| `created_at` | `timestamp(3, tz)` | `.notNull()` |
| `updated_at` | `timestamp(3, tz)` | `.notNull()` |
| `deleted_at` | `timestamp(3, tz)` | nullable |

**Table Config**:
```typescript
table => [
  index("certificate_templates_category_id_idx").on(table.categoryId),
  index("certificate_templates_status_idx").on(table.status),
  index("certificate_templates_created_by_user_id_idx").on(table.createdByUserId),
  // CHECK: width > 0 and height > 0
  check("certificate_templates_dimensions_chk", sql`${table.width} > 0 AND ${table.height} > 0`),
]
```

#### Table: `certificate_template_versions`

**Database Name**: `certificate_template_versions`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | `.defaultRandom().primaryKey()` |
| `template_id` | `uuid` | `.notNull().references(() => certificateTemplates.id, { onDelete: "cascade" })` |
| `version` | `integer` | `.notNull()` |
| `published_at` | `timestamp(3, tz)` | nullable |
| `published_by_user_id` | `uuid` | `.references(() => users.id, { onDelete: "set null" })` |
| `status` | `templateStatusEnum` | `.notNull()` |
| `element_snapshot` | `jsonb` | nullable `.$type<Record<string, unknown>>()` |
| `created_at` | `timestamp(3, tz)` | `.notNull()` |

**Table Config**:
```typescript
table => [
  uniqueIndex("certificate_template_versions_template_version_unique_idx").on(table.templateId, table.version),
  index("certificate_template_versions_template_id_idx").on(table.templateId),
]
```

#### Table: `template_elements`

**Database Name**: `template_elements`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | `.defaultRandom().primaryKey()` |
| `template_id` | `uuid` | `.notNull().references(() => certificateTemplates.id, { onDelete: "cascade" })` |
| `type` | `templateElementTypeEnum` | `.notNull()` |
| `name` | `varchar(255)` | `.notNull()` |
| `config` | `jsonb` | nullable `.$type<Record<string, unknown>>()` |
| `position_x` | `real` | `.notNull()` |
| `position_y` | `real` | `.notNull()` |
| `width` | `real` | `.notNull()` |
| `height` | `real` | `.notNull()` |
| `rotation` | `real` | `.notNull().default(0)` |
| `z_index` | `integer` | `.notNull().default(0)` |
| `created_at` | `timestamp(3, tz)` | `.notNull()` |
| `updated_at` | `timestamp(3, tz)` | `.notNull()` |
| `deleted_at` | `timestamp(3, tz)` | nullable |

**Table Config**:
```typescript
table => [
  index("template_elements_template_id_idx").on(table.templateId),
  index("template_elements_type_idx").on(table.type),
  // CHECK: position coordinates must be non-negative
  check("template_elements_position_chk", sql`${table.positionX} >= 0 AND ${table.positionY} >= 0 AND ${table.width} >= 0 AND ${table.height} >= 0`),
]
```

#### Table: `template_variables`

**Database Name**: `template_variables`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | `.defaultRandom().primaryKey()` |
| `template_id` | `uuid` | `.notNull().references(() => certificateTemplates.id, { onDelete: "cascade" })` |
| `key` | `varchar(255)` | `.notNull()` |
| `label` | `jsonb` | `.$type<LocalizedString>()` nullable |
| `type` | `templateVariableTypeEnum` | `.notNull()` |
| `default_value` | `varchar(255)` | nullable |
| `is_required` | `boolean` | `.notNull().default(false)` |
| `sort_order` | `integer` | `.notNull().default(0)` |
| `created_at` | `timestamp(3, tz)` | `.notNull()` |
| `updated_at` | `timestamp(3, tz)` | `.notNull()` |

**Table Config**:
```typescript
table => [
  uniqueIndex("template_variables_template_key_unique_idx").on(table.templateId, table.key),
  index("template_variables_template_id_idx").on(table.templateId),
]
```

#### Table: `certificate_recipient_groups`

**Database Name**: `certificate_recipient_groups`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | `.defaultRandom().primaryKey()` |
| `template_id` | `uuid` | `.notNull().references(() => certificateTemplates.id, { onDelete: "cascade" })` |
| `name` | `varchar(255)` | `.notNull()` |
| `student_ids` | `text[]` | notNull (array) |
| `created_at` | `timestamp(3, tz)` | `.notNull()` |
| `updated_at` | `timestamp(3, tz)` | `.notNull()` |
| `deleted_at` | `timestamp(3, tz)` | nullable |

**Table Config**:
```typescript
table => [
  index("certificate_recipient_groups_template_id_idx").on(table.templateId),
]
```

#### Table: `certificate_verifications`

**Database Name**: `certificate_verifications`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | `.defaultRandom().primaryKey()` |
| `certificate_id` | `uuid` | `.notNull().references(() => certificates.id, { onDelete: "cascade" })` |
| `verification_code` | `varchar(255)` | `.notNull()` |
| `verified_at` | `timestamp(3, tz)` | `.notNull()` |
| `verified_by_user_id` | `uuid` | `.references(() => users.id, { onDelete: "set null" })` |
| `ip_address` | `varchar(45)` | nullable (IPv4/IPv6) |
| `user_agent` | `text` | nullable |
| `created_at` | `timestamp(3, tz)` | `.notNull()` |

**Table Config**:
```typescript
table => [
  index("certificate_verifications_certificate_id_idx").on(table.certificateId),
  index("certificate_verifications_verification_code_idx").on(table.verificationCode),
  index("certificate_verifications_verified_at_idx").on(table.verifiedAt),
]
```

#### Table: `certificate_categories`

**Database Name**: `certificate_categories`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | `.defaultRandom().primaryKey()` |
| `name` | `jsonb` | `.notNull().$type<LocalizedString>()` |
| `parent_id` | `uuid` | `.references(() => certificateCategories.id, { onDelete: "set null" })` |
| `sort_order` | `integer` | `.notNull().default(0)` |
| `created_at` | `timestamp(3, tz)` | `.notNull()` |
| `updated_at` | `timestamp(3, tz)` | `.notNull()` |
| `deleted_at` | `timestamp(3, tz)` | nullable |

**Table Config**:
```typescript
table => [
  index("certificate_categories_parent_id_idx").on(table.parentId),
  index("certificate_categories_sort_order_idx").on(table.sortOrder),
]
```

#### Table: `certificate_files` (Junction)

**Database Name**: `certificate_files`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | `.defaultRandom().primaryKey()` |
| `file_id` | `uuid` | `.notNull().references(() => storageFiles.id, { onDelete: "cascade" })` |
| `certificate_id` | `uuid` | `.notNull().references(() => certificates.id, { onDelete: "cascade" })` |
| `usage_type` | `varchar(100)` | `.notNull()` |
| `created_at` | `timestamp(3, tz)` | `.notNull().defaultNow()` (junction tables use defaultNow) |

**Table Config**:
```typescript
table => [
  index("certificate_files_file_id_idx").on(table.fileId),
  index("certificate_files_certificate_id_idx").on(table.certificateId),
]
```

**Note**: This junction table mirrors the existing `invoice_files` pattern exactly (UUID PK, file_id FK cascade, entity_id FK cascade, usage_type varchar, createdAt defaultNow). Proxy from `storage/storage.ts`.

---

## Data Models

### Entity Relationship Summary

```
certificate_categories (self-ref)
    └── certificate_templates (category_id FK)
            ├── template_elements (template_id FK cascade)
            ├── template_variables (template_id FK cascade)
            ├── certificate_template_versions (template_id FK cascade)
            └── certificate_recipient_groups (template_id FK cascade)
                    └── certificates (template_id FK restrict, student_id FK restrict, recipient_group_id FK setnull)
                            ├── certificate_verifications (certificate_id FK cascade)
                            └── certificate_files (certificate_id FK cascade, file_id FK cascade)
```

### Key Design Notes

1. **`certificates.version_id`**: Points to the specific `certificate_template_versions` row that was active when the certificate was issued. `ON DELETE SET NULL` allows version deletion without losing the certificate record. The `element_snapshot` in the version provides the rendering context.

2. **`certificates.verification_code`**: Unique per certificate. Used for public verification lookups without authentication. Generated at the service layer using a secure random string.

3. **`certificates.idempotency_key`**: Unique per certificate. Prevents duplicate certificate creation on API retries. Provided by the client/service layer.

4. **`certificate_templates.name`**: Uses `jsonb` with `LocalizedString` type for multi-language support. This follows the existing Siraj pattern seen in other tables with multi-language content.

5. **`template_elements.config`**: A flexible jsonb column that stores element-type-specific configuration (e.g., font size for text elements, image URL for image elements, QR code content for QR elements). The exact schema of this jsonb is defined by the `type` enum and validated at the service layer.

---

## Relations Registration (`drizzleRelations.ts`)

New relations block to add to the existing `defineRelations(schema, r => ({ ... }))` call:

```typescript
// Certificate domain relations
certificateTemplates: {
  one: {
    category: r.one.certificateCategories({ from: r.certificateTemplates.categoryId, to: r.certificateCategories.id }),
    createdByUser: r.one.users({ from: r.certificateTemplates.createdByUserId, to: r.users.id }),
    updatedByUser: r.one.users({ from: r.certificateTemplates.updatedByUserId, to: r.users.id }),
  },
  many: {
    elements: r.many.templateElements({ from: r.certificateTemplates.id, to: r.templateElements.templateId }),
    variables: r.many.templateVariables({ from: r.certificateTemplates.id, to: r.templateVariables.templateId }),
    versions: r.many.certificateTemplateVersions({ from: r.certificateTemplates.id, to: r.certificateTemplateVersions.templateId }),
    recipientGroups: r.many.certificateRecipientGroups({ from: r.certificateTemplates.id, to: r.certificateRecipientGroups.templateId }),
    certificates: r.many.certificates({ from: r.certificateTemplates.id, to: r.certificates.templateId }),
  },
  through: {
    files: r.many.storageFiles.through(r.certificateFiles.fileId),
  },
},
certificates: {
  one: {
    template: r.one.certificateTemplates({ from: r.certificates.templateId, to: r.certificateTemplates.id }),
    recipientGroup: r.one.certificateRecipientGroups({ from: r.certificates.recipientGroupId, to: r.certificateRecipientGroups.id }),
    version: r.one.certificateTemplateVersions({ from: r.certificates.versionId, to: r.certificateTemplateVersions.id }),
    student: r.one.students({ from: r.certificates.studentId, to: r.students.id }),
    createdByUser: r.one.users({ from: r.certificates.createdByUserId, to: r.users.id }),
  },
  many: {
    verifications: r.many.certificateVerifications({ from: r.certificates.id, to: r.certificateVerifications.certificateId }),
  },
  through: {
    files: r.many.storageFiles.through(r.certificateFiles.fileId),
  },
},
certificateCategories: {
  one: {
    parent: r.one.certificateCategories({ from: r.certificateCategories.parentId, to: r.certificateCategories.id }),
  },
  many: {
    children: r.many.certificateCategories({ from: r.certificateCategories.id, to: r.certificateCategories.parentId }),
    templates: r.many.certificateTemplates({ from: r.certificateCategories.id, to: r.certificateTemplates.categoryId }),
  },
},
templateElements: {
  one: {
    template: r.one.certificateTemplates({ from: r.templateElements.templateId, to: r.certificateTemplates.id }),
  },
},
templateVariables: {
  one: {
    template: r.one.certificateTemplates({ from: r.templateVariables.templateId, to: r.certificateTemplates.id }),
  },
},
certificateTemplateVersions: {
  one: {
    template: r.one.certificateTemplates({ from: r.certificateTemplateVersions.templateId, to: r.certificateTemplates.id }),
    publishedByUser: r.one.users({ from: r.certificateTemplateVersions.publishedByUserId, to: r.users.id }),
  },
},
certificateRecipientGroups: {
  one: {
    template: r.one.certificateTemplates({ from: r.certificateRecipientGroups.templateId, to: r.certificateTemplates.id }),
  },
  many: {
    certificates: r.many.certificates({ from: r.certificateRecipientGroups.id, to: r.certificates.recipientGroupId }),
  },
},
certificateVerifications: {
  one: {
    certificate: r.one.certificates({ from: r.certificateVerifications.certificateId, to: r.certificates.id }),
    verifiedByUser: r.one.users({ from: r.certificateVerifications.verifiedByUserId, to: r.users.id }),
  },
},
certificateFiles: {
  one: {
    file: r.one.storageFiles({ from: r.certificateFiles.fileId, to: r.storageFiles.id }),
    certificate: r.one.certificates({ from: r.certificateFiles.certificateId, to: r.certificates.id }),
  },
},
```

---

## RLS Policies (`backend/db/migration/certificates_rls_policies.sql`)

```sql
-- Certificate domain RLS policies (soft-delete pattern).
-- These policies apply the standard 4-policy soft-delete pattern to tables with deleted_at.
-- Tables without deleted_at (junction tables, append-only audit) do NOT require RLS.

-- 1. certificates configuration
ALTER TABLE "certificates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "certificates" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS certificates_select_policy ON "certificates";
CREATE POLICY certificates_select_policy ON "certificates" FOR SELECT USING (deleted_at IS NULL);
DROP POLICY IF EXISTS certificates_insert_policy ON "certificates";
CREATE POLICY certificates_insert_policy ON "certificates" FOR INSERT WITH CHECK (deleted_at IS NULL);
DROP POLICY IF EXISTS certificates_update_policy ON "certificates";
CREATE POLICY certificates_update_policy ON "certificates" FOR UPDATE USING (deleted_at IS NULL) WITH CHECK (
  deleted_at IS NULL OR (deleted_at IS NOT NULL AND current_setting('app.soft_delete', true) = 'true')
);
DROP POLICY IF EXISTS certificates_soft_delete_policy ON "certificates";
DROP POLICY IF EXISTS certificates_delete_policy ON "certificates";
CREATE POLICY certificates_delete_policy ON "certificates" FOR DELETE USING (false);

-- 2. certificate_templates configuration
ALTER TABLE "certificate_templates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "certificate_templates" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS certificate_templates_select_policy ON "certificate_templates";
CREATE POLICY certificate_templates_select_policy ON "certificate_templates" FOR SELECT USING (deleted_at IS NULL);
DROP POLICY IF EXISTS certificate_templates_insert_policy ON "certificate_templates";
CREATE POLICY certificate_templates_insert_policy ON "certificate_templates" FOR INSERT WITH CHECK (deleted_at IS NULL);
DROP POLICY IF EXISTS certificate_templates_update_policy ON "certificate_templates";
CREATE POLICY certificate_templates_update_policy ON "certificate_templates" FOR UPDATE USING (deleted_at IS NULL) WITH CHECK (
  deleted_at IS NULL OR (deleted_at IS NOT NULL AND current_setting('app.soft_delete', true) = 'true')
);
DROP POLICY IF EXISTS certificate_templates_soft_delete_policy ON "certificate_templates";
DROP POLICY IF EXISTS certificate_templates_delete_policy ON "certificate_templates";
CREATE POLICY certificate_templates_delete_policy ON "certificate_templates" FOR DELETE USING (false);

-- 3. template_elements configuration
ALTER TABLE "template_elements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "template_elements" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS template_elements_select_policy ON "template_elements";
CREATE POLICY template_elements_select_policy ON "template_elements" FOR SELECT USING (deleted_at IS NULL);
DROP POLICY IF EXISTS template_elements_insert_policy ON "template_elements";
CREATE POLICY template_elements_insert_policy ON "template_elements" FOR INSERT WITH CHECK (deleted_at IS NULL);
DROP POLICY IF EXISTS template_elements_update_policy ON "template_elements";
CREATE POLICY template_elements_update_policy ON "template_elements" FOR UPDATE USING (deleted_at IS NULL) WITH CHECK (
  deleted_at IS NULL OR (deleted_at IS NOT NULL AND current_setting('app.soft_delete', true) = 'true')
);
DROP POLICY IF EXISTS template_elements_soft_delete_policy ON "template_elements";
DROP POLICY IF EXISTS template_elements_delete_policy ON "template_elements";
CREATE POLICY template_elements_delete_policy ON "template_elements" FOR DELETE USING (false);

-- 4. certificate_recipient_groups configuration
ALTER TABLE "certificate_recipient_groups" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "certificate_recipient_groups" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS certificate_recipient_groups_select_policy ON "certificate_recipient_groups";
CREATE POLICY certificate_recipient_groups_select_policy ON "certificate_recipient_groups" FOR SELECT USING (deleted_at IS NULL);
DROP POLICY IF EXISTS certificate_recipient_groups_insert_policy ON "certificate_recipient_groups";
CREATE POLICY certificate_recipient_groups_insert_policy ON "certificate_recipient_groups" FOR INSERT WITH CHECK (deleted_at IS NULL);
DROP POLICY IF EXISTS certificate_recipient_groups_update_policy ON "certificate_recipient_groups";
CREATE POLICY certificate_recipient_groups_update_policy ON "certificate_recipient_groups" FOR UPDATE USING (deleted_at IS NULL) WITH CHECK (
  deleted_at IS NULL OR (deleted_at IS NOT NULL AND current_setting('app.soft_delete', true) = 'true')
);
DROP POLICY IF EXISTS certificate_recipient_groups_soft_delete_policy ON "certificate_recipient_groups";
DROP POLICY IF EXISTS certificate_recipient_groups_delete_policy ON "certificate_recipient_groups";
CREATE POLICY certificate_recipient_groups_delete_policy ON "certificate_recipient_groups" FOR DELETE USING (false);

-- 5. certificate_categories configuration
ALTER TABLE "certificate_categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "certificate_categories" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS certificate_categories_select_policy ON "certificate_categories";
CREATE POLICY certificate_categories_select_policy ON "certificate_categories" FOR SELECT USING (deleted_at IS NULL);
DROP POLICY IF EXISTS certificate_categories_insert_policy ON "certificate_categories";
CREATE POLICY certificate_categories_insert_policy ON "certificate_categories" FOR INSERT WITH CHECK (deleted_at IS NULL);
DROP POLICY IF EXISTS certificate_categories_update_policy ON "certificate_categories";
CREATE POLICY certificate_categories_update_policy ON "certificate_categories" FOR UPDATE USING (deleted_at IS NULL) WITH CHECK (
  deleted_at IS NULL OR (deleted_at IS NOT NULL AND current_setting('app.soft_delete', true) = 'true')
);
DROP POLICY IF EXISTS certificate_categories_soft_delete_policy ON "certificate_categories";
DROP POLICY IF EXISTS certificate_categories_delete_policy ON "certificate_categories";
CREATE POLICY certificate_categories_delete_policy ON "certificate_categories" FOR DELETE USING (false);

-- NOTE: The following tables do NOT require RLS policies:
--   - template_variables: No deleted_at; cascade-deleted with template
--   - certificate_template_versions: No deleted_at; cascade-deleted with template
--   - certificate_verifications: Append-only audit table; public INSERT allowed
--   - certificate_files: Junction table; cascade-deleted with certificate
```

---

## Error Handling

### Constraint Violation Handling

| Constraint | Violation Scenario | Handling |
|------------|-------------------|----------|
| `certificates_issued_expires_chk` | `expires_at < issued_at` | Service layer catches `PgCheckViolationError`, returns validation error |
| `certificates_verification_code_unique_idx` | Duplicate verification code | Service layer retries with new random code |
| `certificates_idempotency_key_unique_idx` | Duplicate idempotency key | Service layer returns existing certificate (idempotent behavior) |
| `certificates_template_student_unique_idx` | Duplicate template+student | Service layer returns "certificate already exists" error |
| `certificate_template_versions_template_version_unique_idx` | Duplicate version number | Service layer increments version counter |
| `template_variables_template_key_unique_idx` | Duplicate variable key | Service layer returns "variable key already exists" error |
| FK `certificates.template_id` RESTRICT | Template has certificates | Service layer prevents template hard-delete, returns "template has issued certificates" |

### Logging Strategy

- **Error Logs**: Constraint violations are logged at `logger.error` level with table name, constraint name, and operation type
- **Audit Logs**: Certificate status transitions (DRAFT → ISSUED → EXPIRED/REVOKED) are logged at `logger.info` level with certificate ID and user ID
- **Performance Logs**: Verification code lookups are logged at `logger.debug` level with lookup duration

---

## Testing Strategy

### Unit Testing (Deferred to Plan 07)

This plan does not include tests. Testing is deferred to Plan 07 (Database Repository Tests). However, the schema design supports the following test categories:

- **Table existence tests**: Verify all 9 tables exist with correct columns
- **Enum tests**: Verify all 6 pgEnums exist with correct values
- **Constraint tests**: Verify CHECK constraints reject invalid data
- **Unique index tests**: Verify unique indexes reject duplicates
- **FK cascade tests**: Verify ON DELETE behaviors (cascade, set null, restrict)
- **RLS tests**: Verify soft-delete policies filter deleted rows

---

## Migration Strategy

### Step 1: Define Tables (Drizzle Schema)
~Create all table files under `backend/db/schema/certificates/` with `pgTable()` definitions.~

### Step 2: Push Schema to Database
```bash
bun run db push
```
This generates the Drizzle migration SQL and applies it to the database. The push command creates tables, indexes, and CHECK constraints automatically.

### Step 3: Apply RLS Policies (Custom SQL)
```bash
bun db migrate
```
This runs the custom SQL migration file `certificates_rls_policies.sql` which creates RLS policies. This must be run AFTER the Drizzle push creates the tables.

### Migration Order
1. Create TS enums → pgEnums → table files → barrel exports → relations
2. Run `bun run db push` (creates tables + indexes + CHECK constraints)
3. Run `bun db migrate` (applies RLS policies)

---

## Outcome & Knowledge Transfer Protocol (`.ai/draft_plans/cert/plans/01-db-schema-enums/outcome/`)

- **BEFORE Execution:** Executing agents MUST read ALL existing files in `.ai/draft_plans/cert/plans/01-db-schema-enums/outcome/` to avoid re-analysis.
- **AFTER Execution:** Executing agents MUST write `.ai/draft_plans/cert/plans/01-db-schema-enums/outcome/<task-id>-outcome.md` with research/doc findings and implementation details.
- **PROGRESS TRACKING:** Executing agents MUST update task checkboxes `[ ]` -> `[x]` in `tasks.md`.

---

## Design Review Checklist

### Architecture ✅
- [x] High-level architecture is clearly described
- [x] Component responsibilities are well-defined
- [x] Interfaces between components are specified (FK relationships)
- [x] Technology choices are justified (Drizzle ORM, two-tier enums)

### Requirements Alignment ✅
- [x] Design addresses all functional requirements (9 tables, 6 enums, relations, RLS, CHECK, indexes)
- [x] Non-functional requirements are considered (performance indexes)
- [x] Success criteria can be met with this design
- [x] Constraints and assumptions are addressed

### Technical Quality ✅
- [x] Design follows established patterns (billing, storage, users schemas)
- [x] Security considerations are addressed (RLS policies)
- [x] Performance requirements are considered (FK indexes, unique indexes)
- [x] Error handling is comprehensive (constraint violation table)

### Implementation Readiness ✅
- [x] Design provides sufficient detail for implementation (exact column specs, index names)
- [x] Data models are complete and validated
- [x] Migration strategy is specified (push → migrate)

### Maintainability ✅
- [x] Design supports future extensibility (jsonb config columns)
- [x] Components are loosely coupled (schema layer is independent)
- [x] Relations are centralized (drizzleRelations.ts)

### UX/Navigation Completeness ✅
- [x] Future routes table complete with permissions and roles (deferred to Plan 05)
- [x] Sidebar navigation placement specified (future group: grp_certificates)
- [x] Role-based access matrix for ALL user types
- [x] Per-audience rendering differences documented
- [x] Mobile vs Desktop variants defined
- [x] Permission mapping for each route/component specified
