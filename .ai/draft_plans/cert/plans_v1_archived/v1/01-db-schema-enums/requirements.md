# Requirements: Certificate DB Schema & Enums (Plan 01)

## Document Information

- **Feature Name**: Certificate Database Schema & Enums
- **Target Directory**: `.ai/draft_plans/cert/plans/01-db-schema-enums`
- **Outcome Directory**: `.ai/draft_plans/cert/plans/01-db-schema-enums/outcome`
- **Version**: 1.0
- **Date**: 2025-01-20
- **Author**: Siraj Development Team
- **Stakeholders**: Backend team, Database administrators, Certificate feature team
- **Related Documents**:
  - Analysis: `.ai/draft_plans/cert/siraj_analysis/01-db-schema-patterns.md`
  - Analysis: `.ai/draft_plans/cert/cgvs_analysis/02-database-schema.md`
  - Analysis: `.ai/draft_plans/cert/cgvs_analysis/01-generation-logic.md`

## Introduction

The certificate feature requires a complete database schema layer to support certificate template management, element composition, variable substitution, recipient grouping, certificate issuance, and public verification. This plan covers ONLY the database schema layer — tables, enums, relations, RLS policies, CHECK constraints, and indexes. No repositories, services, GraphQL resolvers, or frontend components are in scope.

The schema design draws from the CGVS (Certificate Generation & Verification System) reference schema, adapted to Siraj's established Drizzle ORM patterns including uuid primary keys, two-tier enum system (TS enum + pgEnum), centralized relations, soft-delete RLS policies, and per-entity file attachment junctions.

### Feature Summary

Create 9 database tables, 6 PostgreSQL enums (with backing TS enums), relations registration, RLS policies, CHECK constraints, and indexes for the certificate domain under `backend/db/schema/certificates/`.

### Business Value

- Enables certificate generation, issuance, and verification workflows
- Provides data integrity through CHECK constraints, unique indexes, and foreign keys
- Supports multi-language certificate content via LocalizedString jsonb columns
- Ensures row-level security consistent with existing Siraj patterns

### Scope

**In Scope:**
- 9 table definitions under `backend/db/schema/certificates/`
- 6 TS enums in `backend/enum/certificates/`
- 6 pgEnums registered in `backend/db/schema/enums.ts`
- Relations in `backend/db/drizzleRelations.ts`
- RLS policies migration SQL in `backend/db/migration/certificates_rls_policies.sql`
- CHECK constraints and indexes on all tables
- Barrel exports in `schema/index.ts` and `enum/index.ts`
- Database push to generate migration

**Out of Scope:**
- Repository layer (Plan 02)
- Service layer (Plan 03)
- GraphQL schema (Plan 04)
- Frontend views, stores, or components (Plan 05+)
- Seed data (Plan 06)
- Tests (Plan 07)

## Requirements

### Requirement 0: Execution Outcome Protocol & Task Progress Tracking

**User Story:** As an AI agent or developer, I want persistent task outcome tracking and progress updates, so that subsequent tasks do not repeat past research or analysis.

#### Acceptance Criteria

1. WHEN an executing agent starts any task THEN system SHALL read ALL existing outcome files in `.ai/draft_plans/cert/plans/01-db-schema-enums/outcome/` to absorb prior research, search results, and pitfalls.
2. WHEN an executing agent completes any task THEN system SHALL write a new outcome document under `.ai/draft_plans/cert/plans/01-db-schema-enums/outcome/<task-id>-outcome.md` detailing research findings, docs/web search results, implementation details, and carry-over points.
3. WHEN an executing agent completes any subtask THEN system SHALL update the corresponding task checkbox `[ ]` -> `[x]` in `tasks.md`.
4. WHEN any file is modified THEN system SHALL execute per-file verification (`tsgo` + `biome` + `lint-queue`) on that specific file.
5. WHEN any subtask is completed THEN system SHALL execute `bun tsgo`, `bun biome:check`, and `bun run lint` globally, exiting with zero errors and zero warnings.

### Requirement 1: Certificate Template Management

**User Story:** As an academy administrator, I want to create certificate templates with configurable layouts, elements, and variables, so that certificates can be generated consistently with reusable designs.

#### Acceptance Criteria

1. WHEN a new certificate template is created THEN system SHALL persist it in the `certificate_templates` table with a UUID primary key, a LocalizedString jsonb `name` field, and a `TemplateStatus` enum defaulting to `DRAFT`.
2. WHEN a template is created THEN system SHALL store its orientation (`CertificateOrientation`: LANDSCAPE or PORTRAIT), width, height, background color, and font family as configurable design properties.
3. WHEN a template is assigned to a category THEN system SHALL maintain a foreign key reference to `certificate_categories.id` with `ON DELETE SET NULL` to preserve template integrity when a category is removed.
4. WHEN a template name is stored THEN system SHALL use `jsonb("name").$type<LocalizedString>()` to support multi-language names per Siraj's LocalizedString pattern.
5. WHEN a template is soft-deleted THEN system SHALL set `deleted_at` to a timestamp while preserving all rows for audit purposes.
6. IF a template's `created_by_user_id` references a user that is deleted THEN system SHALL NOT cascade-delete the template (use `ON DELETE SET NULL` for the `createdByUserId` foreign key).

#### Additional Details
- **Priority**: High
- **Complexity**: Medium
- **Dependencies**: Requires `users` table (exists), `certificate_categories` table (this plan)
- **Assumptions**: The `users` table already exists with UUID primary keys. The `LocalizedString` type is available from existing shared types.

### Requirement 2: Template Element Composition

**User Story:** As an academy administrator, I want to compose certificate templates from positioned elements (text, images, QR codes, signatures, shapes), so that certificate layouts are fully customizable and stored as structured data.

#### Acceptance Criteria

1. WHEN a template element is created THEN system SHALL persist it in the `template_elements` table with a `TemplateElementType` enum (TEXT, IMAGE, QR_CODE, SIGNATURE, SHAPE).
2. WHEN element positioning is stored THEN system SHALL persist `position_x`, `position_y`, `width`, `height`, `rotation`, and `z_index` as numeric fields on the `template_elements` table.
3. WHEN an element has complex configuration THEN system SHALL store it in a `config` jsonb column supporting arbitrary key-value structure.
4. WHEN a template is deleted (soft-delete) THEN system SHALL cascade soft-delete to its elements via application logic (no DB cascade — RLS governs visibility).
5. WHEN an element references a template THEN system SHALL enforce foreign key `template_id -> certificate_templates.id` with `ON DELETE CASCADE` so that hard deletes remove elements.
6. IF two elements share the same `z_index` within a template THEN system SHALL NOT prevent this via constraint (z-index conflicts are resolved at rendering time, not DB level).

#### Additional Details
- **Priority**: High
- **Complexity**: Medium
- **Dependencies**: Requires `certificate_templates` table (this plan)
- **Assumptions**: Element positioning uses real numeric coordinates in a 2D space defined by the template's width/height.

### Requirement 3: Template Variable Definitions

**User Story:** As an academy administrator, I want to define template variables (text, date, name, email, custom) so that certificate generation can populate placeholder fields with recipient-specific data.

#### Acceptance Criteria

1. WHEN a template variable is created THEN system SHALL persist it in the `template_variables` table with a `TemplateVariableType` enum (TEXT, DATE, NAME, EMAIL, CUSTOM).
2. WHEN a variable has a localized label THEN system SHALL store it as `jsonb("label").$type<LocalizedString>()` to support multi-language display.
3. WHEN a variable has a default value THEN system SHALL store it in a `default_value` varchar column (nullable).
4. WHEN a variable is marked required THEN system SHALL store `is_required` as a boolean column.
5. WHEN multiple variables exist for a template THEN system SHALL order them by `sort_order` integer column.
6. WHEN a template is hard-deleted THEN system SHALL cascade-delete its variables via `ON DELETE CASCADE` on `template_id`.
7. IF two variables in the same template have the same `key` THEN system SHALL reject the insert via a unique composite index `(template_id, key)`.

#### Additional Details
- **Priority**: High
- **Complexity**: Low
- **Dependencies**: Requires `certificate_templates` table (this plan)
- **Assumptions**: Variable keys are unique per template, not globally unique. Variable keys use snake_case format.

### Requirement 4: Certificate Recipient Groups

**User Story:** As an academy administrator, I want to batch students into recipient groups associated with a template, so that certificates can be issued in bulk to groups of students.

#### Acceptance Criteria

1. WHEN a recipient group is created THEN system SHALL persist it in the `certificate_recipient_groups` table with a UUID primary key, a `name` varchar, and a `template_id` foreign key.
2. WHEN a recipient group stores student IDs THEN system SHALL use a `student_ids text[]` PostgreSQL array column (not a junction table) for lightweight batch grouping.
3. WHEN a template is hard-deleted THEN system SHALL cascade-delete its recipient groups via `ON DELETE CASCADE` on `template_id`.
4. WHEN a recipient group is soft-deleted THEN system SHALL set `deleted_at` to a timestamp.
5. IF a recipient group references an array of student IDs THEN system SHALL NOT enforce foreign key constraints on individual array elements (array elements are validated at the service layer before insertion).

#### Additional Details
- **Priority**: Medium
- **Complexity**: Low
- **Dependencies**: Requires `certificate_templates` table (this plan)
- **Assumptions**: Student IDs are managed by the existing `students` table. Array column is used for simplicity — student existence is validated at the service layer, not DB level.

### Requirement 5: Certificate Issuance & Lifecycle

**User Story:** As an academy administrator, I want to issue certificates to students, so that certificates have a lifecycle from draft through issued, expired, revoked, and archived states with full audit trail.

#### Acceptance Criteria

1. WHEN a certificate is created THEN system SHALL persist it in the `certificates` table with a UUID primary key, `CertificateStatus` enum (DRAFT, ISSUED, EXPIRED, REVOKED, ARCHIVED), and a unique `verification_code` varchar.
2. WHEN a certificate references a template THEN system SHALL enforce `template_id -> certificate_templates.id` with `ON DELETE RESTRICT` to prevent deleting a template that has issued certificates.
3. WHEN a certificate references a recipient group THEN system SHALL enforce `recipient_group_id -> certificate_recipient_groups.id` with `ON DELETE SET NULL` so certificate records persist when a group is removed.
4. WHEN a certificate is issued THEN system SHALL store `issued_at` timestamp.
5. WHEN a certificate has an expiry date THEN system SHALL store `expires_at` timestamp, and the system SHALL enforce via CHECK constraint that `issued_at <= expires_at` when `expires_at` is not NULL.
6. WHEN a certificate is revoked THEN system SHALL store `revoked_at` timestamp and `revocation_reason` text (nullable when not revoked).
7. WHEN a certificate is created with an idempotency key THEN system SHALL enforce uniqueness via a `uniqueIndex` on `idempotency_key`.
8. WHEN two certificates share the same `(template_id, student_id)` combination THEN system SHALL reject via a unique composite index, ensuring one certificate per student per template.
9. WHEN a certificate is soft-deleted THEN system SHALL set `deleted_at` to a timestamp.
10. IF a certificate's `created_by_user_id` references a deleted user THEN system SHALL set the FK to NULL via `ON DELETE SET NULL`.

#### Additional Details
- **Priority**: High
- **Complexity**: High
- **Dependencies**: Requires `certificate_templates`, `certificate_recipient_groups` tables (this plan), `students` table (exists), `users` table (exists)
- **Assumptions**: `student_id` references the existing `students.id` UUID column. The idempotency key is provided by the service layer for retry safety.

### Requirement 6: Certificate Verification

**User Story:** As a public verifier, I want to verify a certificate's authenticity using a verification code, so that I can confirm the certificate is valid, expired, or revoked without needing authentication.

#### Acceptance Criteria

1. WHEN a verification lookup occurs THEN system SHALL store the verification event in the `certificate_verifications` table with a UUID primary key, `certificate_id` foreign key, and `verification_code` varchar.
2. WHEN a verification record is created THEN system SHALL store `verified_at` timestamp, `ip_address` varchar, and `user_agent` text.
3. WHEN a verification code is used THEN system SHALL NOT require authentication (public access) — RLS policies SHALL allow public INSERT on `certificate_verifications`.
4. WHEN a certificate is hard-deleted THEN system SHALL cascade-delete its verification records via `ON DELETE CASCADE` on `certificate_id`.
5. IF the `verified_by_user_id` is NULL THEN the verification was performed by an unauthenticated public user (nullable FK to `users.id` with `ON DELETE SET NULL`).

#### Additional Details
- **Priority**: Medium
- **Complexity**: Medium
- **Dependencies**: Requires `certificates` table (this plan), `users` table (exists)
- **Assumptions**: Verification is a public endpoint. IP address and user agent are captured for audit/security purposes. The `VerificationStatus` enum (VALID, INVALID, EXPIRED, REVOKED) is returned by the service layer, not stored in this table — it's computed at query time.

### Requirement 7: Template Categories (Hierarchical)

**User Story:** As an academy administrator, I want to organize certificate templates into hierarchical categories, so that templates can be browsed and filtered by category.

#### Acceptance Criteria

1. WHEN a category is created THEN system SHALL persist it in the `certificate_categories` table with a UUID primary key and LocalizedString jsonb `name` field.
2. WHEN a category is a sub-category THEN system SHALL store `parent_id` as a self-referencing foreign key to `certificate_categories.id` with `ON DELETE SET NULL`.
3. WHEN categories are displayed THEN system SHALL order them by `sort_order` integer column.
4. WHEN a category is soft-deleted THEN system SHALL set `deleted_at` to a timestamp.
5. IF a parent category is deleted (hard-delete) THEN system SHALL set child categories' `parent_id` to NULL (not cascade).

#### Additional Details
- **Priority**: Low
- **Complexity**: Low
- **Dependencies**: Self-referencing table (this plan)
- **Assumptions**: Categories support unlimited nesting depth (no depth constraint at DB level).

### Requirement 8: Template Versioning

**User Story:** As an academy administrator, I want to track template versions, so that I can publish template updates without invalidating previously issued certificates.

#### Acceptance Criteria

1. WHEN a template version is created THEN system SHALL persist it in the `certificate_template_versions` table with a UUID primary key, `template_id` foreign key, and integer `version` field.
2. WHEN a template version is published THEN system SHALL store `published_at` timestamp and `published_by_user_id` foreign key.
3. WHEN a template version captures element state THEN system SHALL store a jsonb `element_snapshot` column containing a serialized representation of all template elements at the time of version creation.
4. WHEN a template version has a status THEN system SHALL use the `TemplateStatus` enum (DRAFT, PUBLISHED, ARCHIVED) shared with the parent template.
5. WHEN a template is hard-deleted THEN system SHALL cascade-delete its versions via `ON DELETE CASCADE` on `template_id`.
6. IF two versions of the same template share the same version number THEN system SHALL reject via a unique composite index `(template_id, version)`.

#### Additional Details
- **Priority**: Medium
- **Complexity**: Medium
- **Dependencies**: Requires `certificate_templates` table (this plan), `users` table (exists)
- **Assumptions**: The element snapshot is a point-in-time copy stored as jsonb. Version numbers are sequential integers starting from 1.

### Requirement 9: File Attachments (Junction Table)

**User Story:** As an academy administrator, I want to attach files (e.g., PDF exports, background images) to certificates, so that generated certificate files are stored and retrievable.

#### Acceptance Criteria

1. WHEN a file is attached to a certificate THEN system SHALL create a row in the `certificate_files` junction table with a UUID primary key, `file_id` foreign key to `storage_file.id`, and `certificate_id` foreign key to `certificates.id`.
2. WHEN a file usage type is recorded THEN system SHALL store it in a `usage_type` varchar(100) column (e.g., "pdf_export", "background_image", "signature_scan").
3. WHEN a storage file is deleted THEN system SHALL cascade-delete the junction record via `ON DELETE CASCADE` on `file_id`.
4. WHEN a certificate is hard-deleted THEN system SHALL cascade-delete its file junction records via `ON DELETE CASCADE` on `certificate_id`.
5. WHEN a file is attached THEN system SHALL store `created_at` timestamp with `defaultNow()` (junction tables use defaultNow, unlike main entity tables).
6. IF the same file is attached to the same certificate with the same usage type THEN system SHALL allow it (no unique constraint on the junction table — multiple files of the same usage type are permitted).

#### Additional Details
- **Priority**: Medium
- **Complexity**: Low
- **Dependencies**: Requires `certificates` table (this plan), `storage_file` table (exists)
- **Assumptions**: The junction table mirrors the existing `invoice_files` pattern exactly. No soft-delete on junction tables.

### Requirement 10: Enum Registration

**User Story:** As a developer, I want 6 certificate-domain enums defined as both TypeScript enums and PostgreSQL pgEnums, so that type-safe code and database-level enum constraints are both available.

#### Acceptance Criteria

1. WHEN certificate enums are created THEN system SHALL define 6 TS enums in `backend/enum/certificates/certificate.enum.ts` following the existing enum file convention (e.g., `export enum CertificateStatus { DRAFT = "DRAFT", ... }`).
2. WHEN certificate enums are registered THEN system SHALL create 6 pgEnums in `backend/db/schema/enums.ts` using `createPgEnumFromEnum("name", Enum)` for each.
3. WHEN the TS enum barrel is created THEN system SHALL create `backend/enum/certificates/index.ts` with `export * from "./certificate.enum"` and add `export * from "./certificates"` to `backend/enum/index.ts`.
4. WHEN enum values are referenced in schema files THEN system SHALL use the pgEnum variable (e.g., `certificateStatusEnum.notNull()`) and optionally narrow with `.$type<CertificateStatus>()`.

#### Enum Definitions

| Enum Name | TS Enum Name | pgEnum Variable | Values |
|-----------|-------------|-----------------|--------|
| `certificate_status` | `CertificateStatus` | `certificateStatusEnum` | DRAFT, ISSUED, EXPIRED, REVOKED, ARCHIVED |
| `template_status` | `TemplateStatus` | `templateStatusEnum` | DRAFT, PUBLISHED, ARCHIVED |
| `template_element_type` | `TemplateElementType` | `templateElementTypeEnum` | TEXT, IMAGE, QR_CODE, SIGNATURE, SHAPE |
| `template_variable_type` | `TemplateVariableType` | `templateVariableTypeEnum` | TEXT, DATE, NAME, EMAIL, CUSTOM |
| `certificate_orientation` | `CertificateOrientation` | `certificateOrientationEnum` | LANDSCAPE, PORTRAIT |
| `verification_status` | `VerificationStatus` | `verificationStatusEnum` | VALID, INVALID, EXPIRED, REVOKED |

#### Additional Details
- **Priority**: High
- **Complexity**: Low
- **Dependencies**: None
- **Assumptions**: TS enums are backend-only per `backend/enum/AGENTS.md`. Frontend will use GraphQL codegen enums when the GraphQL layer is built (Plan 04).

### Requirement 11: Relations Registration

**User Story:** As a developer, I want all certificate table relations registered centrally in `drizzleRelations.ts`, so that Drizzle query builder can naviguate between tables for joins and nested queries.

#### Acceptance Criteria

1. WHEN certificate tables are created THEN system SHALL register relations in `backend/db/drizzleRelations.ts` using the `defineRelations(schema, r => ({ ... }))` API.
2. WHEN a one-to-many relationship exists THEN system SHALL use `r.many.<TableName>({ from: ..., to: ... })`.
3. WHEN a many-to-one relationship exists THEN system SHALL use `r.one.<TableName>({ from: ..., to: ... })`.
4. WHEN a junction-table many-to-many is needed THEN system SHALL use `r.<junctionColumn>.through(<junctionRelation>)` for the many-through pattern.
5. WHEN relations are defined THEN system SHALL cover:
   - `certificates` → one template, one recipientGroup, one student, one version, many verifications, many files
   - `certificateTemplates` → many elements, many variables, many versions, many recipientGroups, many certificates, one category
   - `certificateCategories` → many templates, many children (self-referencing), one parent (self-referencing)
   - `templateElements` → one template
   - `templateVariables` → one template
   - `certificateTemplateVersions` → one template, one publishedByUser
   - `certificateRecipientGroups` → one template, many certificates
   - `certificateVerifications` → one certificate, one verifiedByUser (nullable)
   - `certificateFiles` → one certificate, one file (storage_file)

#### Additional Details
- **Priority**: High
- **Complexity**: Medium
- **Dependencies**: All certificate tables must be created first (this plan)
- **Assumptions**: The `defineRelations` API is already imported and used in `drizzleRelations.ts`. Existing relations for billing, users, students, etc. are already defined there.

### Requirement 12: Row-Level Security (RLS) Policies

**User Story:** As a database administrator, I want RLS policies on certificate tables, so that data access follows Siraj's soft-delete and ownership patterns consistent with existing tables.

#### Acceptance Criteria

1. WHEN a certificate table has `deleted_at` THEN system SHALL create the 4-policy soft-delete pattern: SELECT (filter `deleted_at IS NULL`), INSERT (check `deleted_at IS NULL`), UPDATE (using `deleted_at IS NULL` + soft-delete session variable), DELETE (using `false` to block hard deletes).
2. WHEN a certificate table does NOT have `deleted_at` (junction tables, verifications) THEN system SHALL NOT create soft-delete policies (no-RLS tables).
3. WHEN RLS policies are written THEN system SHALL store them in `backend/db/migration/certificates_rls_policies.sql` using idempotent SQL (`DROP POLICY IF EXISTS` before `CREATE POLICY`).
4. WHEN RLS is enabled THEN system SHALL execute both `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` and `ALTER TABLE ... FORCE ROW LEVEL SECURITY`.
5. WHEN the soft-delete update policy is created THEN system SHALL use the session variable pattern: `WITH CHECK (deleted_at IS NULL OR (deleted_at IS NOT NULL AND current_setting('app.soft_delete', true) = 'true'))`.

#### Tables Requiring RLS (Soft-Delete Pattern)

| Table | Has `deleted_at` | RLS Pattern |
|-------|------------------|-------------|
| `certificates` | Yes | 4-policy soft-delete |
| `certificate_templates` | Yes | 4-policy soft-delete |
| `template_elements` | Yes | 4-policy soft-delete |
| `template_variables` | No | No RLS (cascade-deleted with template) |
| `certificate_recipient_groups` | Yes | 4-policy soft-delete |
| `certificate_verifications` | No | No RLS (public insert, audit table) |
| `certificate_categories` | Yes | 4-policy soft-delete |
| `certificate_template_versions` | No | No RLS (cascade-deleted with template) |
| `certificate_files` | No | No RLS (junction table, cascade-deleted) |

#### Additional Details
- **Priority**: High
- **Complexity**: Medium
- **Dependencies**: All certificate tables must be created first (this plan)
- **Assumptions**: RLS is applied at the database level via custom SQL migration, not Drizzle ORM. The migration SQL runs via `bun db migrate` (not `drizzle-kit generate`).

### Requirement 13: CHECK Constraints & Indexes

**User Story:** As a developer, I want CHECK constraints and indexes on certificate tables, so that data integrity is enforced at the database level and queries are performant.

#### Acceptance Criteria

1. WHEN a certificate has both `issued_at` and `expires_at` THEN system SHALL enforce `issued_at <= expires_at` via a CHECK constraint named `certificates_issued_expires_chk`.
2. WHEN a certificate is revoked THEN system SHALL allow `revoked_at` to be NULL only when the status is not REVOKED — this is a service-layer concern, not a DB constraint (documented here for awareness).
3. WHEN a foreign key column exists THEN system SHALL create a btree index on that column for join performance (e.g., `certificates_template_id_idx`, `certificates_student_id_idx`).
4. WHEN a `verification_code` column exists THEN system SHALL create a unique index to enforce uniqueness at the database level.
5. WHEN an `idempotency_key` column exists THEN system SHALL create a unique index to enforce idempotency at the database level.
6. WHEN a composite uniqueness rule exists (e.g., one certificate per student per template) THEN system SHALL create a unique composite index on `(template_id, student_id)`.
7. WHEN a status column exists THEN system SHALL create a btree index for status-based filtering queries.
8. WHEN sort_order columns exist THEN system SHALL create btree indexes for ordered queries.

#### Additional Details
- **Priority**: High
- **Complexity**: Medium
- **Dependencies**: All certificate tables must be defined first (this plan)
- **Assumptions**: Index naming follows Siraj's convention: `<table>_<col>_idx` for btree, `<table>_<purpose>_unique_idx` for unique indexes.

## Non-Functional Requirements

### Performance Requirements

- WHEN querying certificates by verification code THEN system SHALL use a unique index for O(1) lookup performance.
- WHEN querying certificates by student ID THEN system SHALL use a btree index for efficient filtering.
- WHEN querying templates by category THEN system SHALL use a btree index on `category_id`.
- IF certificate tables grow beyond 100,000 rows THEN system SHALL maintain query performance under 100ms for indexed lookups.

### Security Requirements

- WHEN a user queries certificate data THEN RLS policies SHALL filter out soft-deleted rows automatically.
- WHEN a public user verifies a certificate THEN system SHALL NOT expose student PII through the verification lookup.
- IF a certificate is revoked THEN system SHALL prevent further verification lookups from returning VALID status (enforced at service layer, schema only stores the status).

### Reliability Requirements

- WHEN a database migration is applied THEN system SHALL execute RLS policy SQL idempotently (DROP IF EXISTS before CREATE).
- WHEN a foreign key constraint is violated THEN system SHALL reject the insert/update at the database level.
- IF a CHECK constraint is violated THEN system SHALL reject the insert/update and return a constraint violation error.

## UX/Navigation Requirements (MANDATORY)

This plan is schema-only — no UI routes, sidebar entries, or frontend components are in scope. The navigation specification is deferred to Plan 05 (Frontend Views). However, the schema design supports the following future UI requirements:

### Future Routes (Deferred to Plans 05+)

| Route | Purpose | Permission | Roles with Access |
|-------|---------|------------|-------------------|
| `/certificates` | Certificate list | `CERTIFICATE_VIEW` | SUPER_ADMIN, ACADEMY_ADMIN, STAFF |
| `/certificates/templates` | Template management | `TEMPLATE_MANAGE` | SUPER_ADMIN, ACADEMY_ADMIN |
| `/certificates/verify` | Public verification | (public) | ALL (unauthenticated) |
| `/certificates/[id]` | Certificate detail | `CERTIFICATE_VIEW` | SUPER_ADMIN, ACADEMY_ADMIN, STAFF |

### Mobile vs Desktop

| Aspect | Desktop | Mobile |
|--------|---------|--------|
| Certificate preview | Full-page A4/Letter preview | Scaled preview |
| Template editor | Drag-and-drop canvas | Touch-based simplified |

## Constraints and Assumptions

### Technical Constraints
- Database is PostgreSQL with Drizzle ORM
- Primary keys are UUID type `uuid("id").defaultRandom().primaryKey()`
- Timestamps use `timestamp("...", { withTimezone: true, precision: 3 })` (no `defaultNow()` on main entity tables; junction tables use `defaultNow()`)
- Enums follow two-tier pattern: TS enum in `backend/enum/` + pgEnum via `createPgEnumFromEnum()` in `schema/enums.ts`
- Relations are centralized in `drizzleRelations.ts` using `defineRelations` API
- RLS policies are hand-written SQL in `backend/db/migration/`

### Business Constraints
- Certificate templates support multi-language content (LocalizedString jsonb)
- One certificate per student per template (unique composite constraint)
- Verification is a public endpoint (no auth required)
- Soft deletes are mandatory for entities with `deleted_at`

### Assumptions
- The `users` table exists with UUID primary keys
- The `students` table exists with UUID primary keys
- The `storage_file` table exists with UUID primary keys
- The `LocalizedString` type is `Partial<Record<AppLocale, string>>`
- The `defineRelations` function is available from the existing Drizzle relations setup
- The `createPgEnumFromEnum` helper is available in `backend/utils/db.utils.ts`

## Success Criteria

### Definition of Done
- [ ] All 9 tables are defined under `backend/db/schema/certificates/`
- [ ] All 6 TS enums are created in `backend/enum/certificates/certificate.enum.ts`
- [ ] All 6 pgEnums are registered in `backend/db/schema/enums.ts`
- [ ] Relations are registered in `backend/db/drizzleRelations.ts`
- [ ] RLS policies SQL is written in `backend/db/migration/certificates_rls_policies.sql`
- [ ] CHECK constraints and indexes are defined in table configs
- [ ] Barrel exports are added to `schema/index.ts` and `enum/index.ts`
- [ ] `bun run db push` generates migration successfully
- [ ] `bun tsgo` passes with zero errors
- [ ] `bun biome:check` passes with zero errors
- [ ] `bun run lint` passes with zero errors

### Acceptance Metrics
- Zero TypeScript compilation errors from new schema files
- Zero ESLint violations from new schema files
- Zero Biome formatting issues from new schema files
- Successful database schema push with no migration errors

## Glossary

| Term | Definition |
|------|------------|
| EARS | Easy Approach to Requirements Syntax — WHEN/THEN/IF/SHALL format |
| pgEnum | PostgreSQL enum type created via Drizzle's `pgEnum()` function |
| RLS | Row-Level Security — PostgreSQL feature for per-row access control |
| LocalizedString | `Partial<Record<AppLocale, string>>` — multi-language text stored as jsonb |
| Soft Delete | Pattern where `deleted_at` timestamp marks rows as deleted instead of hard DELETE |
| Idempotency Key | Unique key preventing duplicate operations on retry |
| Junction Table | Many-to-many resolution table with FKs to both parent tables |
| Element Snapshot | Point-in-time jsonb copy of all template elements stored at version creation time |
| Verification Code | Unique string used for public certificate verification lookup |

---

## Requirements Review Checklist

### Completeness ✅
- [x] All user stories have clear roles, features, and benefits
- [x] Each requirement has specific acceptance criteria using EARS format
- [x] Non-functional requirements are addressed
- [x] Success criteria are defined and measurable
- [x] Navigation/sidebar/tabs noted as deferred (schema-only plan)
- [x] Permissions documented for future routes (deferred)

### Quality ✅
- [x] Requirements are written in active voice
- [x] Each acceptance criterion is testable
- [x] Requirements avoid implementation details (mostly — some Drizzle-specific patterns noted as constraints)
- [x] Terminology is consistent throughout

### EARS Format Validation ✅
- [x] WHEN statements describe specific events or triggers
- [x] IF statements describe clear conditions or states
- [x] All statements use SHALL for system responses

### Traceability ✅
- [x] Requirements are numbered and organized (0-13)
- [x] Dependencies between requirements are clear
- [x] Assumptions and constraints are documented
