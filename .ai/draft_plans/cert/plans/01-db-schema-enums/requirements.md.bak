# Plan 01 — DB Schema & Enums: Requirements

> **Feature**: Certificate Module — Database Schema, Enums, and Relations
> **Plan #**: 01
> **Dependencies**: None (foundation plan)
> **Stakeholders**: Database engineering, Backend engineering
> **Related Docs**:
> - `MASTER_ARCHITECTURE.md` — Overarching certificate feature architecture
> - `cgvs_analysis/02-database-schema.md` — CGVS database schema analysis
> - `siraj_analysis/01-db-schema-patterns.md` — Siraj schema patterns
> - `siraj_analysis/02-types-enums-permissions.md` — Siraj enum and permission patterns
> - `backend/db/schema/AGENTS.md` — Schema layer rules
> - `backend/enum/AGENTS.md` — Enum layer rules

---

## 1. Introduction

### 1.1 Overview

This plan specifies the complete database schema for the certificate feature in Siraj. It defines all tables, pgEnums, indexes, relations, constraints, and RLS policies required by the certificate module. The schema follows Siraj's existing Drizzle ORM conventions — `pgTable` definitions live in per-domain sub-directories under `backend/db/schema/` (e.g. `backend/db/schema/students/`, `backend/db/schema/billing/`), `pgEnum` registrations are centralized in the **top-level `backend/db/schema/enums.ts` registry** via the `createPgEnumFromEnum("snake_case_name", Enum)` helper from `@/backend/utils/db.utils` (TS enums live under `backend/enum/<domain>/`), relations are centralized in `backend/db/drizzleRelations.ts`, and domain barrels re-export tables via `backend/db/schema/index.ts`.

### 1.2 Business Value

The database schema is the foundation of the entire certificate feature. Every subsequent plan (types, repositories, services, GraphQL, UI) depends on these tables being correctly defined with proper indexes, constraints, and relations. A well-designed schema ensures:

- Efficient queries for template listing, certificate generation, and verification
- Data integrity through foreign keys, CHECK constraints, and unique indexes
- Full-text search capability for templates and certificates
- Soft-delete support for audit trails
- Hierarchical category management with closure-table or adjacency-list patterns
- Proper indexing for pagination, filtering, and sorting at scale

### 1.3 Scope

| In Scope | Out of Scope |
|---|---|
| `backend/db/schema/certificates/` — all certificate table definitions | Repository methods (Plan 3) |
| `pgEnum` definitions for certificate domains | Type definitions (Plan 2) |
| Relations in `drizzleRelations.ts` | Service layer logic (Plan 4) |
| Indexes (B-tree, GiST, GIN, unique) | GraphQL resolvers (Plan 5) |
| CHECK constraints for data integrity | Frontend UI |
| Foreign key relationships | PDF rendering (Plan 6) |
| Soft-delete columns and patterns | Storage signed URLs (Plan 7) |
| Barrel re-exports in `backend/db/schema/index.ts` | Seed data (separate plan task) |
| Migration generation (`bun run db push`) | Cron jobs (Plan 22) |
| i18n keys for schema-level validation errors | |

### 1.4 Entities Covered

| Table | Purpose |
|---|---|
| `certificate_categories` | Hierarchical category tree for template organization |
| `certificate_templates` | Template definitions with dimensions, orientation, background, font, status, version chain |
| `certificate_template_elements` | Visual elements placed on a template (text, image, QR, shape, date) |
| `certificate_template_variables` | Variable definitions that can be interpolated into templates |
| `certificate_recipient_groups` | Groups of students assigned to a template for batch generation |
| `certificate_recipient_group_items` | Student entries within a recipient group |
| `recipient_group_item_variable_values` | Per-recipient variable value overrides |
| `certificates` | Generated certificates with status, verification code, PDF reference |
| `certificate_verifications` | Verification log entries for public verification checks |
| `template_style_presets` | Reusable style presets for templates (optional) |

---

## 2. Requirements (EARS Format)

> EARS conventions:
> - **WHEN** `⟨precondition⟩` **THE SYSTEM SHALL** `⟨behavior⟩`
> - **IF** `⟨error-condition⟩` **THE SYSTEM SHALL** `⟨error-behavior⟩`
> - **THE SYSTEM SHALL** `⟨unconditional-behavior⟩`

### 2.1 Schema Architecture Conformance

**REQ-01-001**: THE SYSTEM SHALL define all certificate tables in `backend/db/schema/certificates/` following the existing Siraj `pgTable` convention used in `backend/db/schema/`.

**REQ-01-002**: THE SYSTEM SHALL export all certificate table definitions through a barrel file `backend/db/schema/certificates/index.ts` and re-export from `backend/db/schema/index.ts`.

**REQ-01-003**: THE SYSTEM SHALL define all relations between certificate tables in `backend/db/drizzleRelations.ts` using the **Drizzle 1.0 RC `defineRelations(schema, r => ({ ... }))` graph API** (the canonical Siraj relations registry — verified: `backend/db/drizzleRelations.ts:1-4` exports `relations = defineRelations(...)`; there is NO legacy per-table `relations()` factory and NO per-domain `relations.ts` file anywhere in the codebase). Each relation entry uses `r.one.<Table>({ from, to })` / `r.many.<Table>({ from, to })` with explicit FK field references.

**REQ-01-004**: WHEN a table has a foreign key to a non-certificate table (e.g., `students`, `users`) THE SYSTEM SHALL use the `references()` callback referencing the target table's `id` column with appropriate `onDelete` behavior.

### 2.2 Certificate Categories Table

**REQ-01-010**: THE SYSTEM SHALL define a `certificate_categories` table with the following columns:

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PRIMARY KEY, default `gen_random_uuid()` |
| `name` | `text` | NOT NULL |
| `nameAr` | `text` | NOT NULL (Arabic name for i18n) |
| `slug` | `text` | NOT NULL, UNIQUE |
| `description` | `text` | nullable |
| `descriptionAr` | `text` | nullable (Arabic description) |
| `parentId` | `uuid` | nullable, FK → `certificate_categories.id` ON DELETE SET NULL |
| `sortOrder` | `integer` | NOT NULL, default 0 |
| `isActive` | `boolean` | NOT NULL, default true |
| `createdAt` | `timestamp` | NOT NULL, default `now()` |
| `updatedAt` | `timestamp` | NOT NULL, default `now()` |
| `deletedAt` | `timestamp` | nullable (soft delete) |

**REQ-01-011**: THE SYSTEM SHALL create a unique index on `certificate_categories(slug)` to ensure slug uniqueness.

**REQ-01-012**: THE SYSTEM SHALL create an index on `certificate_categories(parentId)` for efficient tree traversal queries.

**REQ-01-013**: THE SYSTEM SHALL create an index on `certificate_categories(sortOrder)` for ordered listing.

**REQ-01-014**: WHEN a category is soft-deleted (`deletedAt` is set) THEN the system SHALL NOT return it in normal queries; only explicit soft-delete-aware queries SHALL retrieve it.

**REQ-01-015**: WHEN a category with child categories is deleted THEN the system SHALL set `parentId` of children to NULL (via ON DELETE SET NULL), preserving the children as root-level categories.

### 2.3 Certificate Templates Table

**REQ-01-020**: THE SYSTEM SHALL define a `certificate_templates` table with the following columns:

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PRIMARY KEY, default `gen_random_uuid()` |
| `name` | `text` | NOT NULL |
| `slug` | `text` | NOT NULL, (mixed single-column unique not sufficient — see REQ-01-021) |
| `nameAr` | `text` | nullable (Arabic name) |
| `description` | `text` | nullable |
| `descriptionAr` | `text` | nullable |
| `categoryId` | `uuid` | nullable, FK → `certificate_categories.id` ON DELETE SET NULL |
| `status` | `certificate_template_status` | NOT NULL, default 'draft' |
| `version` | `integer` | NOT NULL, default 1 |
| `parentId` | `uuid` | nullable, FK → `certificate_templates.id` ON DELETE SET NULL (for version chain) |
| `width` | `integer` | NOT NULL (in pixels, default 1200) |
| `height` | `integer` | NOT NULL (in pixels, default 850) |
| `orientation` | `certificate_orientation` | NOT NULL, default 'landscape' |
| `backgroundType` | `certificate_background_type` | NOT NULL, default 'color' |
| `backgroundColor` | `text` | nullable (hex color, default '#ffffff') |
| `backgroundImageId` | `text` | nullable (storage reference) |
| `fontFamily` | `text` | NOT NULL, default 'Cairo' |
| `fontColor` | `text` | nullable (hex color, default '#000000') |
| `fontSize` | `integer` | nullable (base font size in pt) |
| `titleText` | `text` | nullable (certificate title, e.g., "Certificate of Completion") |
| `titleTextAr` | `text` | nullable (Arabic title) |
| `defaultValidityPeriod` | `integer` | nullable (in months, NULL = no expiry) |
| `templateSchema` | `jsonb` | nullable (serialized pdfme/editor schema) |
| `metadata` | `jsonb` | nullable (key-value store for custom properties) |
| `createdBy` | `uuid` | NOT NULL, FK → `users.id` |
| `updatedBy` | `uuid` | NOT NULL, FK → `users.id` |
| `publishedAt` | `timestamp` | nullable |
| `createdAt` | `timestamp` | NOT NULL, default `now()` |
| `updatedAt` | `timestamp` | NOT NULL, default `now()` |
| `deletedAt` | `timestamp` | nullable (soft delete) |

**REQ-01-021**: THE SYSTEM SHALL create a unique index on `certificate_templates(name, version)` to prevent duplicate version names, AND a unique index on `certificate_templates(slug, version)` to anchor the version chain (Plan 02/03 `getVersionChain(slug)` queries and the `catch (slug, version) conflict` requirement depend on this column+index — `slug` is the stable human-readable identifier preserved across versions of the same template family).

**REQ-01-022**: THE SYSTEM SHALL create an index on `certificate_templates(status)` for filtering by status.

**REQ-01-023**: THE SYSTEM SHALL create an index on `certificate_templates(categoryId)` for category-based listing.

**REQ-01-024**: THE SYSTEM SHALL create an index on `certificate_templates(createdBy)` for user-specific queries.

**REQ-01-025**: THE SYSTEM SHALL create a GIN index on `certificate_templates` using a full-text search vector combining `name` and `description` for template search functionality.

**REQ-01-026**: WHEN a template's `status` is 'draft' THEN the system SHALL NOT allow certificates to be generated from it.

**REQ-01-027**: WHEN a template's `status` is 'archived' THEN the system SHALL NOT allow new certificates to be generated from it; existing certificates remain valid.

**REQ-01-028**: IF a template's `orientation` is 'portrait' THEN the system SHALL enforce that `width` < `height`.

**REQ-01-029**: IF a template's `orientation` is 'landscape' THEN the system SHALL enforce that `width` > `height`.

**REQ-01-030**: THE SYSTEM SHALL create a CHECK constraint ensuring `width` > 0 and `height` > 0.

### 2.4 Certificate Template Elements Table

**REQ-01-040**: THE SYSTEM SHALL define a `certificate_template_elements` table with the following columns:

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PRIMARY KEY, default `gen_random_uuid()` |
| `templateId` | `uuid` | NOT NULL, FK → `certificate_templates.id` ON DELETE CASCADE |
| `type` | `certificate_element_type` | NOT NULL |
| `label` | `text` | NOT NULL (display label in editor) |
| `content` | `text` | nullable (static text content or variable reference) |
| `variableId` | `uuid` | nullable, FK → `certificate_template_variables.id` ON DELETE SET NULL |
| `x` | `real` | NOT NULL (position X in canvas coordinates) |
| `y` | `real` | NOT NULL (position Y in canvas coordinates) |
| `width` | `real` | NOT NULL (element width) |
| `height` | `real` | NOT NULL (element height) |
| `rotation` | `real` | NOT NULL, default 0 (in degrees) |
| `zIndex` | `integer` | NOT NULL, default 0 |
| `style` | `jsonb` | nullable (font size, color, weight, alignment, etc.) |
| `properties` | `jsonb` | nullable (element-type-specific properties) |
| `sortOrder` | `integer` | NOT NULL, default 0 |
| `createdAt` | `timestamp` | NOT NULL, default `now()` |
| `updatedAt` | `timestamp` | NOT NULL, default `now()` |

**REQ-01-041**: THE SYSTEM SHALL create an index on `certificate_template_elements(templateId)` for efficient template-to-element queries.

**REQ-01-042**: THE SYSTEM SHALL create an index on `certificate_template_elements(templateId, zIndex)` for correct rendering order.

**REQ-01-043**: THE SYSTEM SHALL create an index on `certificate_template_elements(variableId)` for variable-to-element lookups.

**REQ-01-044**: WHEN an element `type` is 'data_text' or 'data_date' THEN the system SHALL require either `content` or `variableId` to be non-null.

**REQ-01-045**: WHEN an element `type` is 'static_text' THEN the system SHALL require `content` to be non-null and `variableId` to be null.

**REQ-01-046**: WHEN an element `type` is 'image' or 'shape' THEN the `properties` column SHALL contain the element-specific configuration (e.g., image URL, shape type).

**REQ-01-047**: WHEN an element `type` is 'qr_code' THEN the `properties` column SHALL contain QR code configuration (e.g., size, error correction level).

**REQ-01-048**: THE SYSTEM SHALL create a CHECK constraint ensuring `x >= 0`, `y >= 0`, `width > 0`, `height > 0`.

### 2.5 Certificate Template Variables Table

**REQ-01-060**: THE SYSTEM SHALL define a `certificate_template_variables` table with the following columns:

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PRIMARY KEY, default `gen_random_uuid()` |
| `templateId` | `uuid` | NOT NULL, FK → `certificate_templates.id` ON DELETE CASCADE |
| `name` | `text` | NOT NULL (variable key, e.g., "student_name") |
| `label` | `text` | NOT NULL (display label) |
| `labelAr` | `text` | nullable (Arabic label) |
| `type` | `certificate_variable_type` | NOT NULL, default 'text' |
| `defaultValue` | `text` | nullable |
| `isRequired` | `boolean` | NOT NULL, default false |
| `sortOrder` | `integer` | NOT NULL, default 0 |
| `selectOptions` | `jsonb` | nullable (for select type: array of {value, label, labelAr}) |
| `validationPattern` | `text` | nullable (regex pattern for validation) |
| `createdAt` | `timestamp` | NOT NULL, default `now()` |
| `updatedAt` | `timestamp` | NOT NULL, default `now()` |

**REQ-01-061**: THE SYSTEM SHALL create a unique index on `certificate_template_variables(templateId, name)` to prevent duplicate variable names within a template.

**REQ-01-062**: THE SYSTEM SHALL create an index on `certificate_template_variables(templateId)` for template-to-variable queries.

**REQ-01-063**: WHEN a variable `type` is 'select' THEN the `selectOptions` column SHALL NOT be null.

**REQ-01-064**: WHEN a variable `type` is 'number' and `validationPattern` is set THEN the pattern SHALL be a valid numeric validation regex.

### 2.6 Certificate Recipient Groups Table

**REQ-01-080**: THE SYSTEM SHALL define a `certificate_recipient_groups` table with the following columns:

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PRIMARY KEY, default `gen_random_uuid()` |
| `templateId` | `uuid` | NOT NULL, FK → `certificate_templates.id` ON DELETE CASCADE |
| `name` | `text` | NOT NULL |
| `nameAr` | `text` | nullable |
| `description` | `text` | nullable |
| `status` | `certificate_recipient_group_status` | NOT NULL, default 'active' |
| `createdBy` | `uuid` | NOT NULL, FK → `users.id` |
| `createdAt` | `timestamp` | NOT NULL, default `now()` |
| `updatedAt` | `timestamp` | NOT NULL, default `now()` |
| `deletedAt` | `timestamp` | nullable (soft delete) |

**REQ-01-081**: THE SYSTEM SHALL create an index on `certificate_recipient_groups(templateId)` for template-to-group queries.

**REQ-01-082**: THE SYSTEM SHALL create an index on `certificate_recipient_groups(status)` for status filtering.

### 2.7 Certificate Recipient Group Items Table

**REQ-01-090**: THE SYSTEM SHALL define a `certificate_recipient_group_items` table with the following columns:

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PRIMARY KEY, default `gen_random_uuid()` |
| `groupId` | `uuid` | NOT NULL, FK → `certificate_recipient_groups.id` ON DELETE CASCADE |
| `studentId` | `uuid` | NOT NULL, FK → `students.id` ON DELETE CASCADE |
| `status` | `certificate_recipient_item_status` | NOT NULL, default 'pending' |
| `certificateId` | `uuid` | nullable, FK → `certificates.id` ON DELETE SET NULL |
| `sortOrder` | `integer` | NOT NULL, default 0 |
| `createdAt` | `timestamp` | NOT NULL, default `now()` |
| `updatedAt` | `timestamp` | NOT NULL, default `now()` |

**REQ-01-091**: THE SYSTEM SHALL create a unique index on `certificate_recipient_group_items(groupId, studentId)` to prevent duplicate student entries in a group.

**REQ-01-092**: THE SYSTEM SHALL create an index on `certificate_recipient_group_items(groupId)` for group-to-item queries.

**REQ-01-093**: THE SYSTEM SHALL create an index on `certificate_recipient_group_items(studentId)` for student-to-group queries.

**REQ-01-094**: WHEN a recipient item's `certificateId` is set THEN the `status` SHALL be 'issued'.

### 2.8 Recipient Group Item Variable Values Table

**REQ-01-100**: THE SYSTEM SHALL define a `recipient_group_item_variable_values` table with the following columns:

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PRIMARY KEY, default `gen_random_uuid()` |
| `groupItemId` | `uuid` | NOT NULL, FK → `certificate_recipient_group_items.id` ON DELETE CASCADE |
| `variableId` | `uuid` | NOT NULL, FK → `certificate_template_variables.id` ON DELETE CASCADE |
| `value` | `text` | nullable (the overridden value for this recipient) |
| `createdAt` | `timestamp` | NOT NULL, default `now()` |
| `updatedAt` | `timestamp` | NOT NULL, default `now()` |

**REQ-01-101**: THE SYSTEM SHALL create a unique index on `recipient_group_item_variable_values(groupItemId, variableId)` to prevent duplicate variable overrides per recipient.

**REQ-01-102**: THE SYSTEM SHALL create an index on `recipient_group_item_variable_values(groupItemId)` for item-to-value queries.

### 2.9 Certificates Table

**REQ-01-110**: THE SYSTEM SHALL define a `certificates` table with the following columns:

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PRIMARY KEY, default `gen_random_uuid()` |
| `templateId` | `uuid` | NOT NULL, FK → `certificate_templates.id` ON DELETE RESTRICT |
| `studentId` | `uuid` | NOT NULL, FK → `students.id` ON DELETE RESTRICT |
| `recipientGroupId` | `uuid` | nullable, FK → `certificate_recipient_groups.id` ON DELETE SET NULL |
| `verificationCode` | `text` | NOT NULL, UNIQUE |
| `status` | `certificate_status` | NOT NULL, default 'draft' |
| `issuedAt` | `timestamp` | nullable |
| `expiresAt` | `timestamp` | nullable |
| `revokedAt` | `timestamp` | nullable |
| `revokedReason` | `text` | nullable |
| `revokedBy` | `uuid` | nullable, FK → `users.id` |
| `pdfStoragePath` | `text` | nullable (storage path to generated PDF) |
| `pdfGeneratedAt` | `timestamp` | nullable |
| `idempotencyKey` | `text` | nullable (client-supplied dedup key for batch-generation retries — Plan 03 REQ-CERT-001 depends on this) |
| `generationStatus` | `certificate_generation_status` | NOT NULL, default 'pending' |
| `generationError` | `text` | nullable (error message if generation failed) |
| `variableData` | `jsonb` | nullable (snapshot of variable values used for this certificate) |
| `metadata` | `jsonb` | nullable (additional properties) |
| `createdBy` | `uuid` | NOT NULL, FK → `users.id` |
| `issuedBy` | `uuid` | nullable, FK → `users.id` |
| `createdAt` | `timestamp` | NOT NULL, default `now()` |
| `updatedAt` | `timestamp` | NOT NULL, default `now()` |
| `deletedAt` | `timestamp` | nullable (soft delete) |

**REQ-01-111**: THE SYSTEM SHALL create a unique index on `certificates(verificationCode)` to ensure verification code uniqueness, AND a unique index on `certificates(idempotencyKey)` (nullable — NULL values are not treated as equal by PG, so pending retries are unaffected) to make batch-generation retries idempotent (Plan 03 REQ-CERT-001).

**REQ-01-112**: THE SYSTEM SHALL create an index on `certificates(templateId)` for template-to-certificate queries.

**REQ-01-113**: THE SYSTEM SHALL create an index on `certificates(studentId)` for student-to-certificate queries.

**REQ-01-114**: THE SYSTEM SHALL create an index on `certificates(status)` for status filtering.

**REQ-01-115**: THE SYSTEM SHALL create a composite index on `certificates(createdAt, id)` for cursor-based pagination.

**REQ-01-116**: THE SYSTEM SHALL create a GIN index on `certificates` using a full-text search vector combining `verificationCode` and student-derived name fields.

**REQ-01-117**: WHEN a certificate's `status` is 'draft' THEN `issuedAt` SHALL be null.

**REQ-01-118**: WHEN a certificate's `status` is 'issued' THEN `issuedAt` SHALL NOT be null.

**REQ-01-119**: WHEN a certificate's `status` is 'revoked' THEN `revokedAt` SHALL NOT be null and `revokedReason` SHALL NOT be null.

**REQ-01-120**: WHEN a certificate's `status` is 'expired' THEN `expiresAt` SHALL NOT be null and `expiresAt` SHALL be in the past.

**REQ-01-121**: THE SYSTEM SHALL create a CHECK constraint ensuring that if `status` = 'revoked' then `revokedBy` is not null.

### 2.10 Certificate Verifications Table

**REQ-01-130**: THE SYSTEM SHALL define a `certificate_verifications` table with the following columns:

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PRIMARY KEY, default `gen_random_uuid()` |
| `certificateId` | `uuid` | NOT NULL, FK → `certificates.id` ON DELETE CASCADE |
| `verificationMethod` | `certificate_verification_method` | NOT NULL |
| `verificationResult` | `certificate_verification_result` | NOT NULL |
| `ipAddress` | `text` | nullable |
| `userAgent` | `text` | nullable |
| `referer` | `text` | nullable |
| `verifiedAt` | `timestamp` | NOT NULL, default `now()` |
| `metadata` | `jsonb` | nullable |

**REQ-01-131**: THE SYSTEM SHALL create an index on `certificate_verifications(certificateId)` for certificate-to-verification queries.

**REQ-01-132**: THE SYSTEM SHALL create an index on `certificate_verifications(verifiedAt)` for time-range queries.

**REQ-01-133**: THE SYSTEM SHALL create an index on `certificate_verifications(verificationResult)` for result filtering.

### 2.11 Template Style Presets Table

**REQ-01-140**: THE SYSTEM SHALL define a `template_style_presets` table with the following columns:

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PRIMARY KEY, default `gen_random_uuid()` |
| `name` | `text` | NOT NULL |
| `nameAr` | `text` | nullable |
| `description` | `text` | nullable |
| `fontFamily` | `text` | NOT NULL |
| `fontColor` | `text` | NOT NULL (hex color) |
| `fontSize` | `integer` | NOT NULL |
| `backgroundColor` | `text` | NOT NULL (hex color) |
| `borderColor` | `text` | nullable (hex color) |
| `borderWidth` | `integer` | nullable |
| `orientation` | `certificate_orientation` | NOT NULL |
| `previewImageId` | `text` | nullable (storage reference) |
| `isActive` | `boolean` | NOT NULL, default true |
| `createdBy` | `uuid` | NOT NULL, FK → `users.id` |
| `createdAt` | `timestamp` | NOT NULL, default `now()` |
| `updatedAt` | `timestamp` | NOT NULL, default `now()` |

**REQ-01-141**: THE SYSTEM SHALL create an index on `template_style_presets(isActive)` for active preset listing.

### 2.12 pgEnum Definitions

**REQ-01-150**: THE SYSTEM SHALL define the following pgEnums:

| Enum Name | Values | Used By |
|---|---|---|
| `certificate_template_status` | 'draft', 'review', 'published', 'archived' | `certificate_templates.status` |
| `certificate_orientation` | 'landscape', 'portrait' | `certificate_templates.orientation`, `template_style_presets.orientation` |
| `certificate_background_type` | 'color', 'image', 'gradient' | `certificate_templates.backgroundType` |
| `certificate_element_type` | 'static_text', 'data_text', 'data_date', 'image', 'qr_code', 'shape' | `certificate_template_elements.type` |
| `certificate_variable_type` | 'text', 'number', 'date', 'select' | `certificate_template_variables.type` |
| `certificate_recipient_group_status` | 'active', 'inactive', 'completed' | `certificate_recipient_groups.status` |
| `certificate_recipient_item_status` | 'pending', 'processing', 'issued', 'failed', 'skipped' | `certificate_recipient_group_items.status` |
| `certificate_status` | 'draft', 'pending', 'issued', 'revoked', 'expired' | `certificates.status` |
| `certificate_generation_status` | 'pending', 'processing', 'completed', 'failed' | `certificates.generationStatus` |
| `certificate_verification_method` | 'qr_code', 'link', 'manual' | `certificate_verifications.verificationMethod` |
| `certificate_verification_result` | 'valid', 'invalid', 'revoked', 'expired', 'not_found' | `certificate_verifications.verificationResult` |

**REQ-01-151**: THE SYSTEM SHALL register all certificate pgEnums by APPENDING them to the **top-level `backend/db/schema/enums.ts` registry** using the canonical helper `createPgEnumFromEnum("<snake_case_name>", <TsEnum>)` (imported from `@/backend/utils/db.utils`). DO NOT create a per-domain `backend/db/schema/certificates/enums.ts` file — verified reality: `backend/db/schema/enums.ts` is the SINGLE top-level registry for all ~45 domain pgEnums in the codebase (per `backend/db/schema/AGENTS.md` §"Shared Top-Level Files"). The TS enums referenced by the helper are defined in Plan 02 under `backend/enum/certificates/`. This establishes a strict split: TS enums (source of truth) live in `backend/enum/`, and PG pgEnums (DB values derived via the helper) live in the top-level `backend/db/schema/enums.ts`.

**REQ-01-152**: THE SYSTEM SHALL NOT rename or reuse existing Siraj pgEnums; each certificate-specific enum SHALL have the `certificate_` prefix.

### 2.13 Soft Delete Pattern

**REQ-01-160**: THE SYSTEM SHALL include a `deletedAt` column on all tables that support soft deletion: `certificate_categories`, `certificate_templates`, `certificate_recipient_groups`, `certificates`.

**REQ-01-161**: THE SYSTEM SHALL NOT include `deletedAt` on junction/child tables that are cascade-deleted with their parent (e.g., `certificate_template_elements`, `certificate_template_variables`, `recipient_group_item_variable_values`).

**REQ-01-162**: THE SYSTEM SHALL NOT include `deletedAt` on append-only tables like `certificate_verifications` (log table — entries are never deleted).

---

## 3. i18n Requirements

### 3.1 Translation Namespace

**REQ-01-170**: THE SYSTEM SHALL define translation keys under the `certificates` namespace with nested `schema` sub-domain in `shared/locale/`.

### 3.2 Schema Validation Error Keys

**REQ-01-171**: THE SYSTEM SHALL define the following translation keys for schema-level validation errors:

| Key | English | Arabic |
|---|---|---|
| `certificates.schema.errors.duplicateTemplateName` | "A template with this name already exists" | "يوجد قالب بهذا الاسم بالفعل" |
| `certificates.schema.errors.duplicateCategorySlug` | "A category with this slug already exists" | "يوجد تصنيف بهذا الرابط بالفعل" |
| `certificates.schema.errors.duplicateVariableName` | "A variable with this name already exists in this template" | "يوجد متغير بهذا الاسم في هذا القالب" |
| `certificates.schema.errors.duplicateVerificationCode` | "This verification code already exists" | "رمز التحقق موجود بالفعل" |
| `certificates.schema.errors.invalidDimensions` | "Width and height must be positive values" | "يجب أن يكون العرض والارتفاع قيم موجبة" |
| `certificates.schema.errors.invalidOrientation` | "Orientation does not match dimensions" | "الاتجاه لا يتطابق مع الأبعاد" |
| `certificates.schema.errors.variableSelectOptionsRequired` | "Select options are required for select-type variables" | "خيارات التحديد مطلوبة لمتغيرات نوع التحديد" |
| `certificates.schema.errors.elementContentRequired` | "Content or variable is required for this element type" | "المحتوى أو المتغير مطلوب لهذا النوع من العناصر" |

### 3.3 Enum Display Names

**REQ-01-172**: THE SYSTEM SHALL define translation keys for all enum display values:

| Key | English | Arabic |
|---|---|---|
| `certificates.schema.enums.templateStatus.draft` | "Draft" | "مسودة" |
| `certificates.schema.enums.templateStatus.review` | "Under Review" | "قيد المراجعة" |
| `certificates.schema.enums.templateStatus.published` | "Published" | "منشور" |
| `certificates.schema.enums.templateStatus.archived` | "Archived" | "مؤرشف" |
| `certificates.schema.enums.orientation.landscape` | "Landscape" | "أفقي" |
| `certificates.schema.enums.orientation.portrait` | "Portrait" | "عمودي" |
| `certificates.schema.enums.certificateStatus.draft` | "Draft" | "مسودة" |
| `certificates.schema.enums.certificateStatus.pending` | "Pending" | "قيد الانتظار" |
| `certificates.schema.enums.certificateStatus.issued` | "Issued" | "صادر" |
| `certificates.schema.enums.certificateStatus.revoked` | "Revoked" | "ملغى" |
| `certificates.schema.enums.certificateStatus.expired` | "Expired" | "منتهي الصلاحية" |
| `certificates.schema.enums.generationStatus.pending` | "Pending" | "قيد الانتظار" |
| `certificates.schema.enums.generationStatus.processing` | "Processing" | "قيد المعالجة" |
| `certificates.schema.enums.generationStatus.completed` | "Completed" | "مكتمل" |
| `certificates.schema.enums.generationStatus.failed` | "Failed" | "فشل" |
| `certificates.schema.enums.elementType.static_text` | "Static Text" | "نص ثابت" |
| `certificates.schema.enums.elementType.data_text` | "Data Text" | "نص بيانات" |
| `certificates.schema.enums.elementType.data_date` | "Data Date" | "تاريخ بيانات" |
| `certificates.schema.enums.elementType.image` | "Image" | "صورة" |
| `certificates.schema.enums.elementType.qr_code` | "QR Code" | "رمز QR" |
| `certificates.schema.enums.elementType.shape` | "Shape" | "شكل" |

### 3.4 Pluralization Rules

**REQ-01-173**: THE SYSTEM SHALL define pluralization-aware translation keys for count-based messages:

| Key | Type | English | Arabic |
|---|---|---|---|
| `certificates.schema.messages.templatesDeleted` | `(count: number) => string` | one: "{count} template deleted", other: "{count} templates deleted" | zero: "لم يتم حذف قوالب", one: "تم حذف {count} قالب", two: "تم حذف {count} قالبين", few: "تم حذف {count} قوالب", many: "تم حذف {count} قالباً", other: "تم حذف {count} قالب" |
| `certificates.schema.messages.certificatesGenerated` | `(count: number) => string` | one: "{count} certificate generated", other: "{count} certificates generated" | (same pattern as above with "شهادة") |

---

## 4. Edge Cases & Constraints

### 4.1 Data Integrity Constraints

**REQ-01-180**: WHEN a template is deleted (hard delete via cascade or soft delete) THEN all associated elements, variables, and recipient groups SHALL be cascade-deleted; certificates SHALL NOT be cascade-deleted (ON DELETE RESTRICT).

**REQ-01-181**: WHEN a student is deleted THEN certificates referencing that student SHALL be preserved (ON DELETE RESTRICT prevents student deletion if certificates exist).

**REQ-01-182**: THE SYSTEM SHALL enforce that a template's `version` is monotonically increasing within a version chain (tracked via `parentId`).

### 4.2 Performance Constraints

**REQ-01-190**: THE SYSTEM SHALL ensure all indexes are designed to support the query patterns identified in Plan 3 (Repository Layer): by ID, by status, by category, by template, by student, by verification code, full-text search, and cursor pagination on `(createdAt, id)`.

**REQ-01-191**: THE SYSTEM SHALL ensure the `templateSchema` jsonb column does not exceed typical document sizes (recommend < 256KB per template schema).

---

## 5. Outcome Knowledge Base & Progress Tracking

**REQ-01-200**: WHEN any task in this plan is executed THEN the executing agent SHALL read all existing files in `.ai/plans/cert-01-db-schema-enums/outcome/` before starting.

**REQ-01-201**: WHEN a task is completed THEN the executing agent SHALL create an outcome document at `.ai/plans/cert-01-db-schema-enums/outcome/<task-id>-outcome.md`.

**REQ-01-202**: WHEN a task is completed THEN the executing agent SHALL update the checkbox `[ ]` → `[x]` in `tasks.md`.

---

## 6. Acceptance Criteria Summary

| # | Criterion | Verification |
|---|---|---|
| AC-01 | All 10 tables defined with correct columns and types | `bun run db push` succeeds; `drizzle-kit` introspection matches spec |
| AC-02 | All 11 pgEnums defined with correct values | Schema export contains all enums |
| AC-03 | All indexes created (B-tree, GIN, unique, composite) | Query plan analysis shows index usage |
| AC-04 | All foreign keys and ON DELETE behaviors correct | Constraint violation tests pass |
| AC-05 | CHECK constraints prevent invalid data | Insert invalid data → constraint error |
| AC-06 | Relations defined in `drizzleRelations.ts` | Drizzle relation queries work |
| AC-07 | Barrel re-exports functional | `import { certificateTemplates } from "@/backend/db/schema"` works |
| AC-08 | Soft delete columns on correct tables | Soft-delete-aware queries exclude deleted records |
| AC-09 | Full-text search indexes functional | FTS queries return relevant results |
| AC-10 | i18n keys defined in `shared/locale/` | Translation functions resolve correctly in both locales |
| AC-11 | Migration generated successfully | `bun run db push` creates all tables without errors |

---

## 7. User Stories

### US-01: As a database engineer
I want all certificate tables defined with proper indexes and constraints, so that the certificate feature has a solid data foundation that performs well at scale.

### US-02: As a backend developer
I want clear schema definitions with proper relations and enums, so that I can build repository and service layers that leverage type-safe Drizzle queries.

### US-03: As a system architect
I want the schema to follow Siraj conventions (pgTable, pgEnum, soft delete, relations), so that the certificate module integrates seamlessly with existing codebase patterns.

### US-04: As an international user
I want Arabic column values (nameAr, descriptionAr, titleTextAr) and i18n keys, so that the certificate feature supports Arabic localization from the database level up.

### US-05: As a compliance officer
I want verification logs and audit trails (certificate_verifications, soft deletes), so that certificate issuance and verification history is preserved for compliance purposes.

---

## Reality Check Notes

> Added by codebase-reality verification pass on 2026-08-02. Verified against the actual state of `/home/ahmed/Projects/siraj-cert/`.

### Corrections applied to requirements.md
1. **§1.1 overview** — replaced the ambiguous "\`pgEnum\` definitions co-located or in \`backend/enum/\`" description with the verified canonical three-tier split: TS enums → \`backend/enum/<domain>/\`; PG pgEnums → top-level \`backend/db/schema/enums.ts\` registry (single file, ~45 entries); tables → per-domain \`backend/db/schema/<domain>/\` sub-directories.
2. **REQ-01-151** — original mandated "all pgEnums in the \`backend/db/schema/certificates/\` directory co-located with the table definitions", which **violates** the codebase reality. Verified: \`backend/db/schema/enums.ts\` is the SINGLE top-level pgEnum registry (mandated by \`backend/db/schema/AGENTS.md\` §"Shared Top-Level Files"). Corrected REQ-01-151 to mandate APPENDING certificate pgEnums to \`backend/db/schema/enums.ts\` via the canonical \`createPgEnumFromEnum("snake_case_name", Enum)\` helper from \`@/backend/utils/db.utils\`, with TS enums living in \`backend/enum/certificates/\` (Plan 02).

### Verified correct (no changes needed)
- The 11-pgEnum inventory in §2.12 / REQ-01-150 table (rows \`certificate_template_status\`, \`certificate_orientation\`, etc.) — names match Plan 02's TS enum naming convention.
- The \`certificate_*\` prefix for the snake_case DB enum names (REQ-01-152) — verified to match the existing \`student_status\`, \`account_status\` prefix convention.
- \`backend/db/schema/certificates/\` table sub-directory (REQ-01-001) — matches verified domain sub-directory layout.
- Soft-delete column convention \`deletedAt\` (REQ-01-160) — verified (existing tables use \`deletedAt\` timestamp).
- \`drizzleRelations.ts\` central relations file (REQ-01-002) — verified single top-level \`backend/db/drizzleRelations.ts\` registry; no per-domain \`relations.ts\` convention exists.

### Cross-plan consistency note
- REQ-01-150 lists hardcoded enum values that may differ from Plan 02's \`requirements.md\` §3.1 TS enum value lists (e.g. \`certificate_generation_status\` here lists \`pending, processing, completed, failed\` whereas Plan 02's TS enum uses \`QUEUED=queued, RENDERING=rendering, COMPLETED=completed, FAILED=failed\`). Because \`createPgEnumFromEnum\` derives PG values FROM the TS enum (TS is source of truth), REQ-01-150's hardcoded value lists should be re-aligned with Plan 02 before execution.
