# Requirements: Certificate Types & Permissions (Plan 02)

## Document Information

- **Feature Name**: Certificate Type Definitions & Permission Entries
- **Target Directory**: `.ai/draft_plans/cert/plans/02-types-permissions`
- **Outcome Directory**: `.ai/draft_plans/cert/plans/02-types-permissions/outcome`
- **Version**: 1.0
- **Date**: 2025-01-20
- **Author**: Siraj Development Team
- **Stakeholders**: Backend team, Certificate feature team, Security/Permissions team
- **Related Documents**:
  - Analysis: `.ai/draft_plans/cert/siraj_analysis/02-types-enums-patterns.md`
  - Analysis: `.ai/draft_plans/cert/siraj_analysis/09-auth-permissions.md`
  - Analysis: `.ai/draft_plans/cert/cgvs_analysis/02-database-schema.md`
  - Dependency: `.ai/draft_plans/cert/plans/01-db-schema-enums/requirements.md` (Plan 01 — must be complete)
  - Dependent: `.ai/draft_plans/cert/plans/03-repository-layer/requirements.md` (Plan 03 — depends on this plan)

## Introduction

The certificate feature requires a complete type definitions layer and permission entries to support the database schema created in Plan 01. This plan covers ONLY the TypeScript type definitions for all certificate-domain entities following Siraj's canonical type pattern (`{Entity}SelectType`, `{Entity}InsertType`, `{Entity}ReturnType`, `{Entity}SubmitInput`), plus 11 `AppPermission` enum entries for certificate CRUD operations, permission group seed assignments, and Pothos enum registration for GraphQL exposure.

No repositories, services, GraphQL resolvers, or frontend components are in scope. The type definitions created here serve as the canonical contract consumed by the repository layer (Plan 03), services (Plan 04+), and GraphQL layer.

### Feature Summary

Create 8 type definition files in `backend/types/certificates/`, add 11 `AppPermission` entries to the existing `AppPermission` enum, register certificate-specific Pothos enums for GraphQL exposure, and wire barrel exports into `backend/types/index.ts` and `backend/enum/index.ts`.

### Business Value

- Provides the canonical type contract between DB schema, repositories, services, and GraphQL
- Enables role-based access control for certificate operations through the permission system
- Ensures type safety across all layers consuming certificate data
- Supports GraphQL enum exposure for certificate-specific enums (CertificateStatus, TemplateStatus, etc.)

### Scope

**In Scope:**
- 8 type definition files under `backend/types/certificates/`
- 1 barrel export file (`backend/types/certificates/index.ts`)
- 11 `AppPermission` enum entries in `backend/enum/permissions/permission.enum.ts`
- Permission group seed data documentation for default group assignments
- Pothos enum registration in `backend/graphql/pothos/shared/enum.pothos.ts`
- Barrel export wiring in `backend/types/index.ts`
- Barrel export wiring in `backend/enum/certificates/index.ts` and `backend/enum/index.ts`

**Out of Scope:**
- Repository layer (Plan 03)
- Service layer (Plan 04)
- GraphQL schema/resolvers (Plan 04)
- Frontend views, stores, or components (Plan 05+)
- Database schema changes (Plan 01)
- Seed data implementation (Plan 06)
- Tests (Plan 07)

## Dependencies

### Upstream Dependencies (Must Be Complete)

| Dependency | Plan | What It Provides |
|---|---|---|
| Certificate DB Schema | Plan 01 | 9 Drizzle table definitions in `backend/db/schema/certificates/` — these are the `$inferSelect` / `$inferInsert` sources for `SelectType` / `InsertType` |
| Certificate Enums | Plan 01 | 6 TS enums in `backend/enum/certificates/certificate.enum.ts` — these are re-applied as union types in `ReturnType` and imported in type files |
| Enum Barrel | Plan 01 | `backend/enum/certificates/index.ts` barrel export — type files import enums from `@/backend/enum` |

### Downstream Dependents

| Dependent | Plan | What It Consumes from This Plan |
|---|---|---|
| Repository Layer | Plan 03 | `{Entity}SelectType`, `{Entity}InsertType`, `{Entity}ReturnType`, filter/orderBy input types, `mapEntityToDto` return types |
| Services Layer | Plan 04 | `{Entity}ReturnType`, `{Entity}SubmitInput`, filter/orderBy types, permission checks against `AppPermission.CERTIFICATES_*` |
| GraphQL Layer | Plan 04 | `{Entity}ReturnType` for Pothos object types, Pothos enum registrations, `AppPermission` for auth scopes |
| Frontend | Plan 05+ | Generated TypeScript types from GraphQL codegen (derived from Pothos schema using these types) |

## Requirements

### Requirement 0: Execution Outcome Protocol & Task Progress Tracking

**User Story:** As an AI agent or developer, I want persistent task outcome tracking and progress updates, so that subsequent tasks do not repeat past research or analysis.

#### Acceptance Criteria

1. **WHEN** an executing agent starts any task **THE SYSTEM SHALL** read ALL existing outcome files in `.ai/draft_plans/cert/plans/02-types-permissions/outcome/` to absorb prior research, search results, and pitfalls.
2. **WHEN** an executing agent completes any task **THE SYSTEM SHALL** write a new outcome document under `.ai/draft_plans/cert/plans/02-types-permissions/outcome/<task-id>-outcome.md` detailing research findings, implementation details, and carry-over points.
3. **WHEN** an executing agent completes any subtask **THE SYSTEM SHALL** update the corresponding task checkbox `[ ]` -> `[x]` in `tasks.md`.
4. **WHEN** any file is modified **THE SYSTEM SHALL** execute per-file verification (`tsgo` + `biome` + `lint-queue`) on that specific file.
5. **WHEN** any subtask is completed **THE SYSTEM SHALL** execute `bun tsgo`, `bun biome:check`, and `bun run lint` globally, exiting with zero errors and zero warnings.

### Requirement 1: Certificate Type Definitions

**User Story:** As a backend developer, I want canonical TypeScript type definitions for the `certificates` table, so that all layers (repository, service, GraphQL) share a single type-safe contract for certificate data.

#### Acceptance Criteria

1. **WHEN** the certificate type file is created **THE SYSTEM SHALL** define `CertificateSelectType = typeof certificates.$inferSelect` deriving directly from the Drizzle `certificates` table schema created in Plan 01.
2. **WHEN** the certificate type file is created **THE SYSTEM SHALL** define `CertificateInsertType = typeof certificates.$inferInsert` deriving from the Drizzle table insert shape.
3. **WHEN** the `CertificateReturnType` is defined **THE SYSTEM SHALL** use `Omit<CertificateSelectType, "deletedAt" | "idempotencyKey" | "version">` to remove internal/forbidden fields, and re-apply TS enum types:
   - `status: CertificateStatus` (re-applied from pgEnum-inferred `string`)
   - `orientation: CertificateOrientation` (re-applied)
4. **WHEN** the `CertificateSubmitInput` is defined **THE SYSTEM SHALL** use `Omit<CertificateInsertType, "id" | "createdAt" | "updatedAt" | "deletedAt" | "idempotencyKey" | "version" | "status" | "issuedAt" | "verificationCode">` to remove system-generated and server-managed fields.
5. **WHEN** the type file is created **THE SYSTEM SHALL** import the `certificates` table from `@/backend/db/schema` and certificate enums from `@/backend/enum`.
6. **WHEN** filter and order-by types are defined **THE SYSTEM SHALL** define `CertificateFilterInput` (with optional `status?`, `templateId?`, `studentId?`, `recipientGroupId?`, `dateFrom?`, `dateTo?` fields) and `CertificateOrderByInput` (with optional `field: "createdAt" | "issuedAt" | "status"` and `direction: "asc" | "desc"`).
7. **WHEN** the `CertificateReturnType` is defined **THE SYSTEM SHALL** include resolved/relation properties as optional readonly fields:
   - `readonly template?: CertificateTemplateReturnType | null`
   - `readonly student?: StudentReturnType | null` (referencing existing `StudentReturnType` from `@/backend/types`)
   - `readonly files?: CertificateFileReturnType[]`
8. **IF** the `certificates` table includes a `createdByUserId` column **THE SYSTEM SHALL** omit it from `CertificateReturnType` (internal field not exposed to API consumers).

#### Additional Details
- **Priority**: High
- **Complexity**: Medium
- **Dependencies**: Plan 01 (`certificates` table in `backend/db/schema/certificates/certificates.ts`)
- **Assumptions**: The `certificates` table uses UUID primary key, `timestamp` with timezones, `LocalizedString` jsonb for student name, and has `deletedAt`, `idempotencyKey`, `version` columns. The `CertificateStatus` and `CertificateOrientation` enums exist in `backend/enum/certificates/`.

### Requirement 2: Certificate Template Type Definitions

**User Story:** As a backend developer, I want canonical TypeScript type definitions for the `certificate_templates` table, so that template management operations are fully type-safe across all layers.

#### Acceptance Criteria

1. **WHEN** the template type file is created **THE SYSTEM SHALL** define `CertificateTemplateSelectType = typeof certificateTemplates.$inferSelect` and `CertificateTemplateInsertType = typeof certificateTemplates.$inferInsert`.
2. **WHEN** `CertificateTemplateReturnType` is defined **THE SYSTEM SHALL** `Omit` internal fields (`deletedAt`, `idempotencyKey`, `version`, `createdByUserId`) and re-apply:
   - `status: TemplateStatus`
   - `orientation: CertificateOrientation`
   - `name: LocalizedString` (re-applied from raw jsonb)
3. **WHEN** `CertificateTemplateSubmitInput` is defined **THE SYSTEM SHALL** omit system fields (`id`, `createdAt`, `updatedAt`, `deletedAt`, `idempotencyKey`, `version`, `createdByUserId`, `status`, `publishedAt`, `publishedByUserId`) from the insert type.
4. **WHEN** filter types are defined **THE SYSTEM SHALL** define `CertificateTemplateFilterInput` with optional `status?`, `categoryId?`, `isPublished?` fields.
5. **WHEN** `CertificateTemplateReturnType` is defined **THE SYSTEM SHALL** include optional resolved relation fields:
   - `readonly elements?: TemplateElementReturnType[]`
   - `readonly variables?: TemplateVariableReturnType[]`
   - `readonly category?: CertificateCategoryReturnType | null`
   - `readonly versions?: CertificateTemplateVersionReturnType[]`
   - `readonly recipientGroups?: CertificateRecipientGroupReturnType[]`

#### Additional Details
- **Priority**: High
- **Complexity**: Medium
- **Dependencies**: Plan 01 (`certificate_templates` table), Requirement 1 (for cross-entity references)
- **Assumptions**: The `certificate_templates` table has `name` as `LocalizedString` jsonb, `status` as `TemplateStatus` enum, `orientation` as `CertificateOrientation` enum.

### Requirement 3: Template Element Type Definitions

**User Story:** As a backend developer, I want type definitions for template elements (text, images, QR codes, signatures, shapes), so that the template composition layer is fully type-safe.

#### Acceptance Criteria

1. **WHEN** the element type file is created **THE SYSTEM SHALL** define `TemplateElementSelectType` and `TemplateElementInsertType` from the `template_elements` table.
2. **WHEN** `TemplateElementReturnType` is defined **THE SYSTEM SHALL** `Omit` `deletedAt` and re-apply `type: TemplateElementType`.
3. **WHEN** `TemplateElementSubmitInput` is defined **THE SYSTEM SHALL** omit `id`, `createdAt`, `updatedAt`, `deletedAt`, `templateId` (templateId is provided by the parent context, not by the client).
4. **WHEN** the `config` column is jsonb **THE SYSTEM SHALL** type it as `Record<string, unknown>` in `ReturnType` and `SubmitInput` (preserving the flexible jsonb shape without over-constraining).
5. **WHEN** `TemplateElementReturnType` is defined **THE SYSTEM SHALL** include `readonly template?: CertificateTemplateReturnType | null` as optional.
6. **IF** the element type includes sub-element tables (e.g., `template_static_text_elements`, `template_data_text_elements`, `template_image_elements`, `template_qr_code_elements`) **THE SYSTEM SHALL** define corresponding `TemplateElementDetailSelectType` / `TemplateElementDetailReturnType` types for each sub-element table, keyed by `TemplateElementType`.

#### Additional Details
- **Priority**: High
- **Complexity**: Medium
- **Dependencies**: Plan 01 (`template_elements` table and sub-element tables)
- **Assumptions**: Elements have `positionX`, `positionY`, `width`, `height`, `rotation`, `zIndex` numeric fields. The `config` column stores type-specific element configuration as jsonb.

### Requirement 4: Template Variable Type Definitions

**User Story:** As a backend developer, I want type definitions for template variables (TEXT, DATE, NAME, EMAIL, CUSTOM), so that variable substitution and recipient group variable values are type-safe.

#### Acceptance Criteria

1. **WHEN** the variable type file is created **THE SYSTEM SHALL** define `TemplateVariableSelectType` and `TemplateVariableInsertType` from the `template_variables` table.
2. **WHEN** `TemplateVariableReturnType` is defined **THE SYSTEM SHALL** re-apply `type: TemplateVariableType` and preserve `name`, `description` (as `LocalizedString | null`), `required`, `order`, `previewValue`.
3. **WHEN** `TemplateVariableSubmitInput` is defined **THE SYSTEM SHALL** omit `id`, `createdAt`, `updatedAt`, `templateId`.
4. **WHEN** sub-variable tables exist (`template_text_variables`, `template_number_variables`, `template_date_variables`, `template_select_variables`) **THE SYSTEM SHALL** define corresponding detail types for each with their type-specific configuration columns.
5. **WHEN** the `RecipientGroupItemVariableValue` type is defined **THE SYSTEM SHALL** define `RecipientGroupItemVariableValueSelectType` and `RecipientGroupItemVariableValueReturnType` from the `recipient_group_item_variable_values` table, preserving `value`, `valueIndexed`, and the relation to `TemplateVariableReturnType`.

#### Additional Details
- **Priority**: High
- **Complexity**: Medium
- **Dependencies**: Plan 01 (`template_variables` table, sub-variable tables, `recipient_group_item_variable_values` table)

### Requirement 5: Certificate Recipient Group Type Definitions

**User Story:** As a backend developer, I want type definitions for recipient groups and their items, so that batch certificate generation with per-recipient variable values is fully type-safe.

#### Acceptance Criteria

1. **WHEN** the recipient group type file is created **THE SYSTEM SHALL** define `CertificateRecipientGroupSelectType` and `CertificateRecipientGroupInsertType` from the `certificate_recipient_groups` table.
2. **WHEN** `CertificateRecipientGroupReturnType` is defined **THE SYSTEM SHALL** `Omit` `deletedAt` and preserve `name` (as `LocalizedString | null`), `description` (as `LocalizedString | null`), `date`, `releaseDate`.
3. **WHEN** `CertificateRecipientGroupSubmitInput` is defined **THE SYSTEM SHALL** omit `id`, `createdAt`, `updatedAt`, `deletedAt`, `templateId`.
4. **WHEN** the `RecipientGroupItem` type is defined **THE SYSTEM SHALL** define `RecipientGroupItemSelectType`, `RecipientGroupItemInsertType`, `RecipientGroupItemReturnType` from the `recipient_group_items` table, with `studentId` relation.
5. **WHEN** `CertificateRecipientGroupReturnType` is defined **THE SYSTEM SHALL** include optional resolved relation fields:
   - `readonly items?: RecipientGroupItemReturnType[]`
   - `readonly template?: CertificateTemplateReturnType | null`

#### Additional Details
- **Priority**: High
- **Complexity**: Medium
- **Dependencies**: Plan 01 (`certificate_recipient_groups` and `recipient_group_items` tables), Requirement 2 (template reference), Requirement 4 (variable value references)

### Requirement 6: Certificate Verification Type Definitions

**User Story:** As a backend developer, I want type definitions for certificate verifications, so that the public verification lookup endpoint returns type-safe data.

#### Acceptance Criteria

1. **WHEN** the verification type file is created **THE SYSTEM SHALL** define `CertificateVerificationSelectType` and `CertificateVerificationInsertType` from the `certificate_verifications` table.
2. **WHEN** `CertificateVerificationReturnType` is defined **THE SYSTEM SHALL** preserve all audit columns (`verifiedAt`, `verifiedByUserId`, `verificationMethod`, `ipAddress`, `userAgent`) and re-apply `result: VerificationStatus`.
3. **WHEN** `CertificateVerificationSubmitInput` is defined **THE SYSTEM SHALL** include only client-provided fields: `verificationCode`, `verificationMethod` (optional — may be "public_link", "qr_code", "api"). **THE SYSTEM SHALL** omit `id`, `createdAt`, `verifiedAt`, `verifiedByUserId`, `ipAddress`, `userAgent`, `result` (all server-generated).
4. **WHEN** `CertificateVerificationReturnType` is defined **THE SYSTEM SHALL** include optional `readonly certificate?: CertificateReturnType | null` relation.
5. **IF** the verification is a public lookup (no authenticated user) **THE SYSTEM SHALL** define a `PublicVerificationResult` type that includes only non-PII fields: `certificateFound: boolean`, `status: VerificationStatus`, `certificateIssueDate: Date | null`, `certificateTemplateName: LocalizedString | null`, `studentName: string | null` (student's display name only, no ID or contact info).

#### Additional Details
- **Priority**: High
- **Complexity**: Medium
- **Dependencies**: Plan 01 (`certificate_verifications` table), Requirement 1 (certificate reference)
- **Assumptions**: The verification table is an audit table (no soft-delete). Public verification must not expose PII.

### Requirement 7: Certificate Category Type Definitions

**User Story:** As a backend developer, I want type definitions for certificate categories (tree structure), so that category management and template categorization are type-safe.

#### Acceptance Criteria

1. **WHEN** the category type file is created **THE SYSTEM SHALL** define `CertificateCategorySelectType` and `CertificateCategoryInsertType` from the `certificate_categories` table.
2. **WHEN** `CertificateCategoryReturnType` is defined **THE SYSTEM SHALL** `Omit` `deletedAt` and preserve `name` (as `LocalizedString`), `description` (as `LocalizedString | null`), `order`, `parentCategoryId`.
3. **WHEN** `CertificateCategorySubmitInput` is defined **THE SYSTEM SHALL** omit `id`, `createdAt`, `updatedAt`, `deletedAt`.
4. **WHEN** `CertificateCategoryReturnType` is defined **THE SYSTEM SHALL** include optional resolved relation fields:
   - `readonly parent?: CertificateCategoryReturnType | null`
   - `readonly children?: CertificateCategoryReturnType[]`
   - `readonly templates?: CertificateTemplateReturnType[]`

#### Additional Details
- **Priority**: High
- **Complexity**: Low
- **Dependencies**: Plan 01 (`certificate_categories` table — self-referencing), Requirements 2 (template reference)

### Requirement 8: Permission Entries for Certificates

**User Story:** As a system administrator, I want 11 `AppPermission` enum entries for certificate operations, so that role-based access control can gate certificate CRUD, generation, verification, and template management.

#### Acceptance Criteria

1. **WHEN** permission entries are added to the `AppPermission` enum **THE SYSTEM SHALL** add 11 entries following the dot-separated string value convention (e.g., `CERTIFICATES_LIST = "certificates.list"`):

   | Enum Key | String Value | Description |
   |----------|-------------|-------------|
   | `CERTIFICATES_LIST` | `"certificates.list"` | View the certificate list/dashboard |
   | `CERTIFICATES_CREATE` | `"certificates.create"` | Create a new certificate manually |
   | `CERTIFICATES_EDIT` | `"certificates.edit"` | Edit an existing certificate's metadata |
   | `CERTIFICATES_DELETE` | `"certificates.delete"` | Soft-delete a certificate |
   | `CERTIFICATES_VIEW_OWN` | `"certificates.view_own"` | View own certificates (student/teacher sees their own) |
   | `CERTIFICATES_VIEW_OTHER` | `"certificates.view_other"` | View other users' certificates (admin scope) |
   | `CERTIFICATES_GENERATE` | `"certificates.generate"` | Trigger batch or single certificate generation |
   | `CERTIFICATES_REVOKE` | `"certificates.revoke"` | Revoke an issued certificate |
   | `CERTIFICATES_VERIFY` | `"certificates.verify"` | Access the internal verification lookup (distinct from public) |
   | `CERTIFICATES_MANAGE_TEMPLATE` | `"certificates.manage_template"` | Create/edit/delete certificate templates |
   | `CERTIFICATES_DOWNLOAD` | `"certificates.download"` | Download a certificate PDF/file |

2. **WHEN** permission entries are added **THE SYSTEM SHALL** place them in the `AppPermission` enum in `backend/enum/permissions/permission.enum.ts`, grouped after the existing settings/last-group permissions, with a `// ─── Certificate permissions ─────────────────────────────` section comment.
3. **WHEN** permissions are added **THE SYSTEM SHALL** ensure the `filterKnownAppPermissions` helper still works (it derives from `Object.values(AppPermission)`, so new entries are automatically included — no changes needed to the helper).
4. **WHEN** permissions are added **THE SYSTEM SHALL NOT** modify the DB `appPermissionEnum` pgEnum directly — database-level enum updates are handled by `bun run db push` or migration (Plan 01/06 scope). The TS enum is the source of truth; the DB enum is synchronized via Drizzle migration.
5. **IF** a permission value has a dot-path longer than 2 segments (e.g., `certificates.template.manage`) **THE SYSTEM SHALL NOT** use such a format — stick to 2-segment dot-paths (`certificates.<action>`) consistent with existing permissions like `students.list`, `billing.create_invoice`.

#### Additional Details
- **Priority**: High
- **Complexity**: Low
- **Dependencies**: Plan 01 (DB schema must exist so the permission system can reference it), existing `permission.enum.ts`
- **Assumptions**: The `AppPermission` enum is in `backend/enum/permissions/permission.enum.ts`. The dot-path convention is `{entity}.{action}`. No multi-segment paths.

### Requirement 9: Permission Group Assignments

**User Story:** As a system administrator, I want default permission group assignments for certificate permissions, so that each system role group automatically gets the appropriate certificate access level.

#### Acceptance Criteria

1. **WHEN** permission group seed data is documented **THE SYSTEM SHALL** specify the following group→permission assignments:

   | Group Slug | Permissions Granted |
   |---|---|
   | `super_admin` | ALL 11 certificate permissions (super admin automatically gets all permissions via `isSuperAdmin` flag — no explicit seed needed, but documented for completeness) |
   | `academy_admin` | `CERTIFICATES_LIST`, `CERTIFICATES_CREATE`, `CERTIFICATES_EDIT`, `CERTIFICATES_DELETE`, `CERTIFICATES_VIEW_OWN`, `CERTIFICATES_VIEW_OTHER`, `CERTIFICATES_GENERATE`, `CERTIFICATES_REVOKE`, `CERTIFICATES_VERIFY`, `CERTIFICATES_DOWNLOAD` (all except `MANAGE_TEMPLATE` — template management is super-admin only by default; can be granted to academy_admin via custom group) |
   | `teacher_default` | `CERTIFICATES_LIST`, `CERTIFICATES_GENERATE`, `CERTIFICATES_VIEW_OWN` (teachers can list, generate certificates for their students, and view their own teaching certificates) |
   | `student_default` | `CERTIFICATES_VIEW_OWN` (students can view their own earned certificates) |
   | `parent_default` | `CERTIFICATES_VIEW_OWN` (parents can view certificates of their children — `view_own` in the context of parent→child relationship) |
   | `staff_default` | `CERTIFICATES_LIST`, `CERTIFICATES_VIEW_OTHER`, `CERTIFICATES_VERIFY`, `CERTIFICATES_DOWNLOAD` (staff can list, verify, and download but cannot create/edit/delete) |
   | `supervisor_default` | `CERTIFICATES_LIST`, `CERTIFICATES_VIEW_OTHER`, `CERTIFICATES_VERIFY`, `CERTIFICATES_DOWNLOAD` (same as staff — supervisors are read-only auditors for certificates) |

2. **WHEN** permission group assignments are documented **THE SYSTEM SHALL** note that actual seed data implementation is in Plan 06 (Seed Data) — this plan documents the intended assignments only.
3. **WHEN** `CERTIFICATES_VIEW_OWN` is assigned to `parent_default` **THE SYSTEM SHALL** note that "own" in the parent context means "certificates of children belonging to this parent" — the service layer resolves `parentId → studentIds` and scopes the query. This is a service-layer concern (Plan 04) but documented here for permission context.
4. **WHEN** `CERTIFICATES_MANAGE_TEMPLATE` is NOT granted to `academy_admin` by default **THE SYSTEM SHALL** document that academy admins can be granted template management via a custom (ad-hoc) permission group created by a super admin — the `SystemPermissionGroupSlug` enum defines system groups only.
5. **WHEN** `CERTIFICATES_VERIFY` is distinct from public verification **THE SYSTEM SHALL** document that public certificate verification (via verification code) does NOT require any `AppPermission` — it is an unauthenticated public endpoint. The `CERTIFICATES_VERIFY` permission is for the internal/admin verification lookup tool within the dashboard.

#### Additional Details
- **Priority**: High
- **Complexity**: Low
- **Dependencies**: Requirement 8 (permissions must exist before group assignments), Plan 06 (seed data implementation)
- **Assumptions**: The `SystemPermissionGroupSlug` enum already defines 7 system groups. The `group_permissions` table links groups to permissions. Super admin bypasses permission checks entirely via `isSuperAdmin` flag.

### Requirement 10: Pothos Enum Registration

**User Story:** As a backend developer, I want certificate-specific enums registered in Pothos, so that they are exposed as GraphQL enum types for the frontend to consume via codegen.

#### Acceptance Criteria

1. **WHEN** Pothos enum registration is performed **THE SYSTEM SHALL** register all 6 certificate-domain enums in `backend/graphql/pothos/shared/enum.pothos.ts` using the existing pattern:
   ```typescript
   gqlSchemaBuilder.enumType(CertificateStatus, { name: "CertificateStatus" });
   gqlSchemaBuilder.enumType(
     TemplateStatus,
     { name: "TemplateStatus" },
   );
   gqlSchemaBuilder.enumType(TemplateElementType, { name: "TemplateElementType" });
   gqlSchemaBuilder.enumType(TemplateVariableType, { name: "TemplateVariableType" });
   gqlSchemaBuilder.enumType(CertificateOrientation, { name: "CertificateOrientation" });
   gqlSchemaBuilder.enumType(VerificationStatus, { name: "VerificationStatus" });
   ```
2. **WHEN** blueprint enums are registered **THE SYSTEM SHALL** import them from `@/backend/enum/certificates` (not from the DB schema's `enums.ts` pgEnum file).
3. **WHEN** Pothos enum registration is complete **THE SYSTEM SHALL** run `bun run generate:gqlSchema` to regenerate the GraphQL schema, then `bun codegen` to generate TypeScript types from the schema.
4. **IF** the Pothos enum registration step is part of this plan **THE SYSTEM SHALL** note that running `generate:gqlSchema` and `codegen` are verification steps (not implementation) — the implementation is the enum registration lines themselves.
5. **THE SYSTEM SHALL NOT** hardcode enum value arrays in Pothos files — the `gqlSchemaBuilder.enumType(Enum, { name })` pattern derives values from the TS enum automatically.

#### Additional Details
- **Priority**: Medium
- **Complexity**: Low
- **Dependencies**: Plan 01 (TS enums in `backend/enum/certificates/certificate.enum.ts`), existing `enum.pothos.ts`
- **Assumptions**: The `gqlSchemaBuilder` is the Pothos builder instance exported from the shared Pothos setup. Enum registration is additive — existing registrations are not affected.

### Requirement 11: Barrel Exports

**User Story:** As a developer, I want barrel exports wired so that all certificate types are accessible from `@/backend/types` and all certificate enums are accessible from `@/backend/enum`.

#### Acceptance Criteria

1. **WHEN** type files are created **THE SYSTEM SHALL** create `backend/types/certificates/index.ts` as a barrel exporting all type files:
   ```typescript
   export * from "./certificate.types";
   export * from "./certificate-template.types";
   export * from "./template-element.types";
   export * from "./template-variable.types";
   export * from "./certificate-recipient-group.types";
   export * from "./certificate-verification.types";
   export * from "./certificate-category.types";
   ```
2. **WHEN** the type barrel is created **THE SYSTEM SHALL** add `export * from "./certificates";` to `backend/types/index.ts` (alphabetical order, after "billing" and before "expenses" or wherever it fits alphabetically).
3. **WHEN** the enum barrel already exists (from Plan 01) **THE SYSTEM SHALL** ensure `backend/enum/certificates/index.ts` exists and `backend/enum/index.ts` includes `export * from "./certificates";`. **IF** Plan 01 already created these, **THE SYSTEM SHALL** verify they are present and correct.
4. **WHEN** barrel exports are wired **THE SYSTEM SHALL** verify that `import { CertificateReturnType } from "@/backend/types"` resolves correctly by running `bun tsgo`.
5. **THE SYSTEM SHALL NOT** create circular dependencies — type files import from `@/backend/db/schema` (table definitions) and `@/backend/enum` (enums), never from `@/backend/types` (barrel).

#### Additional Details
- **Priority**: High
- **Complexity**: Low
- **Dependencies**: Requirements 1-7 (type files must exist before barrel), Plan 01 (enum barrel may already exist)
- **Assumptions**: `backend/types/index.ts` currently has ~20 entries. `backend/enum/index.ts` currently has ~15 entries.

### Requirement 12: Feature 6 — Outcome Knowledge Base & Progress Tracking Types

**User Story:** As a curriculum designer, I want type definitions for learning outcomes and progress tracking linked to certificates, so that the knowledge base connecting certificates to learning achievements is type-safe.

#### Acceptance Criteria

1. **WHEN** the outcome knowledge base types are defined **THE SYSTEM SHALL** define types for the `certificate_learning_outcomes` table (from Plan 01):
   - `LearningOutcomeSelectType = typeof certificateLearningOutcomes.$inferSelect`
   - `LearningOutcomeInsertType = typeof certificateLearningOutcomes.$inferInsert`
   - `LearningOutcomeReturnType = Omit<LearningOutcomeSelectType, "deletedAt"> & { title: LocalizedString; description: LocalizedString | null }`
   - `LearningOutcomeSubmitInput = Omit<LearningOutcomeInsertType, "id" | "createdAt" | "updatedAt" | "deletedAt" | "templateId">`
2. **WHEN** progress tracking types are defined **THE SYSTEM SHALL** define types for the `certificate_progress_tracking` table (from Plan 01):
   - `ProgressTrackingSelectType` and `ProgressTrackingInsertType`
   - `ProgressTrackingReturnType = Omit<ProgressTrackingSelectType, "idempotencyKey"> & { status: ProgressStatus }`
   - `ProgressTrackingSubmitInput = Omit<ProgressTrackingInsertType, "id" | "createdAt" | "updatedAt" | "idempotencyKey">`
3. **WHEN** `LearningOutcomeReturnType` is defined **THE SYSTEM SHALL** include optional relation fields:
   - `readonly template?: CertificateTemplateReturnType | null`
   - `readonly progress?: ProgressTrackingReturnType[]`
4. **WHEN** `ProgressTrackingReturnType` is defined **THE SYSTEM SHALL** include optional relation fields:
   - `readonly certificate?: CertificateReturnType | null`
   - `readonly outcome?: LearningOutcomeReturnType | null`
   - `readonly student?: StudentReturnType | null`
5. **WHEN** the Feature 6 types are created **THE SYSTEM SHALL** export them from `backend/types/certificates/index.ts` barrel alongside the other certificate types.
6. **WHEN** a `ProgressStatus` enum does not exist from Plan 01 **THE SYSTEM SHALL** document that a `ProgressStatus` enum (values: `NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`, `OVERDUE`) should be added in Plan 01 or as a supplementary enum — the type definitions will reference it.

#### Additional Details
- **Priority**: Medium
- **Complexity**: Medium
- **Dependencies**: Plan 01 (`certificate_learning_outcomes` and `certificate_progress_tracking` tables), Requirements 1-2 (certificate and template references)
- **Assumptions**: The `certificate_learning_outcomes` table has `templateId`, `title` (LocalizedString jsonb), `description` (LocalizedString jsonb), `order`, `createdAt`, `updatedAt`, `deletedAt`. The `certificate_progress_tracking` table has `studentId`, `outcomeId`, `certificateId`, `status`, `completedAt`, `idempotencyKey`.

## Non-Functional Requirements

### Performance Requirements
- **WHEN** type definitions are imported **THE SYSTEM SHALL** resolve barrel imports in O(1) via the TypeScript module resolution (no runtime cost — types are compile-time only).
- **WHEN** the `AppPermission` enum grows by 11 entries **THE SYSTEM SHALL** maintain O(n) lookup performance for `filterKnownAppPermissions` (Set-based lookup, n=~200 total permissions — negligible).

### Security Requirements
- **WHEN** certificate permissions are checked via `PermissionsService.hasAnyPermission(userId, [AppPermission.CERTIFICATES_*])` **THE SYSTEM SHALL** enforce the same RBAC pattern used by all other Siraj permissions.
- **WHEN** `CERTIFICATES_VIEW_OWN` is checked **THE SYSTEM SHALL** scope results to the authenticated user's own certificates (or their children's in the parent case) — this is a service-layer concern (Plan 04) but the permission entry enables this check.
- **WHEN** public certificate verification is accessed **THE SYSTEM SHALL NOT** require any `AppPermission` — the public verification endpoint is unauthenticated and does not use the permission system.

### Reliability Requirements
- **WHEN** the `AppPermission` enum is extended **THE SYSTEM SHALL** ensure `filterKnownAppPermissions` continues to function (it derives from `Object.values(AppPermission)` dynamically).
- **WHEN** Pothos enum registration is added **THE SYSTEM SHALL** ensure existing GraphQL schema generation is not broken (additive change only).

## UX/Navigation Requirements (MANDATORY)

This plan is types-only — no UI routes, sidebar entries, or frontend components are in scope. The navigation specification is deferred to Plan 05 (Frontend Views). However, the type and permission definitions created here support the following future UI requirements:

### Future Routes (Deferred to Plans 05+)

| Route | Purpose | Permission Gate | Roles with Access |
|-------|---------|-----------------|-------------------|
| `/certificates` | Certificate list | `CERTIFICATES_LIST` or `CERTIFICATES_VIEW_OWN` | SUPER_ADMIN, ACADEMY_ADMIN, STAFF, TEACHER (view own), STUDENT (view own), PARENT (view children's) |
| `/certificates/templates` | Template management | `CERTIFICATES_MANAGE_TEMPLATE` | SUPER_ADMIN (default), ACADEMY_ADMIN (if granted via custom group) |
| `/certificates/verify` | Internal verification dashboard | `CERTIFICATES_VERIFY` | SUPER_ADMIN, ACADEMY_ADMIN, STAFF, SUPERVISOR |
| `/certificates/verify-public` | Public verification (no auth) | (public — no permission) | ALL (unauthenticated, via verification code) |
| `/certificates/[id]` | Certificate detail | `CERTIFICATES_VIEW_OWN` or `CERTIFICATES_VIEW_OTHER` | SUPER_ADMIN, ACADEMY_ADMIN (view other), TEACHER/STUDENT/PARENT (view own) |
| `/certificates/new` | Create certificate | `CERTIFICATES_CREATE` | SUPER_ADMIN, ACADEMY_ADMIN |
| `/certificates/generate` | Batch generation | `CERTIFICATES_GENERATE` | SUPER_ADMIN, ACADEMY_ADMIN, TEACHER |

### Mobile vs Desktop

| Aspect | Desktop | Mobile |
|--------|---------|--------|
| Certificate preview | Full-page A4/Letter preview | Scaled responsive preview |
| Template editor | Drag-and-drop canvas | Touch-based simplified (deferred) |
| Verification form | Full search + detail | Compact code input + result card |

## Constraints and Assumptions

### Technical Constraints
- All type definitions follow the AGENTS.md canonical naming convention: `{Entity}SelectType`, `{Entity}InsertType`, `{Entity}ReturnType`, `{Entity}SubmitInput` — NOT the older `{Entity}Entity`/`{Entity}EntityInput` naming used by students/teachers
- Types import from `@/backend/db/schema` (table definitions) and `@/backend/enum` (enums) — never from relative paths
- The `@/*` path alias maps to the project root
- `AppPermission` values use the 2-segment dot-path convention (`entity.action`)
- Pothos enums are registered via `gqlSchemaBuilder.enumType(Enum, { name })` — never with hardcoded value arrays
- Node_modules `next/dist/docs/` is NOT relevant to this plan (types/permissions only)

### Business Constraints
- Super admin automatically receives all permissions via `isSuperAdmin` flag — no explicit seed needed
- Public certificate verification does not require authentication or permissions
- Template management (`MANAGE_TEMPLATE`) is super-admin-only by default; academy admins can be granted it via custom groups
- Permissions are additive — adding certificate permissions does not change existing permission behavior

### Assumptions
- Plan 01 is complete: all 9 certificate tables exist in `backend/db/schema/certificates/`
- Plan 01 is complete: all 6 TS enums exist in `backend/enum/certificates/certificate.enum.ts`
- The `AppPermission` enum in `permission.enum.ts` has ~190 existing entries and accepts new entries without structural changes
- The `gqlSchemaBuilder` in `enum.pothos.ts` is the shared Pothos builder instance
- The `LocalizedString` type is `Partial<Record<AppLocale, string>>` from `shared/types/localized-string.ts`

## Success Criteria

### Definition of Done
- [ ] All 8 type definition files are created under `backend/types/certificates/`
- [ ] `backend/types/certificates/index.ts` barrel exports all type files
- [ ] `backend/types/index.ts` includes `export * from "./certificates";`
- [ ] 11 `AppPermission` entries are added to `backend/enum/permissions/permission.enum.ts`
- [ ] Permission group assignments are documented (seed implementation deferred to Plan 06)
- [ ] 6 Pothos enum registrations are added to `backend/graphql/pothos/shared/enum.pothos.ts`
- [ ] `bun run generate:gqlSchema` succeeds with new enums
- [ ] `bun codegen` succeeds with new types
- [ ] `bun tsgo` passes with zero errors
- [ ] `bun biome:check` passes with zero errors
- [ ] `bun run lint` passes with zero errors
- [ ] Feature 6 types (LearningOutcome, ProgressTracking) are defined and exported

### Acceptance Metrics
- Zero TypeScript compilation errors from new type/permission files
- Zero ESLint violations from new type/permission files
- Zero Biome formatting issues from new type/permission files
- GraphQL schema generation includes 6 new enum types
- All certificate types are resolvable from `@/backend/types`

## Glossary

| Term | Definition |
|------|------------|
| EARS | Easy Approach to Requirements Syntax — WHEN/THEN/IF/SHALL format |
| SelectType | `typeof table.$inferSelect` — the raw DB row shape inferred by Drizzle |
| InsertType | `typeof table.$inferInsert` — the raw DB insert shape (all columns optional) |
| ReturnType | `Omit<SelectType, forbiddenFields> & { re-applied enums; resolved props }` — canonical API return type |
| SubmitInput | `Omit<InsertType, systemFields>` — user-provided input shape |
| AppPermission | The fine-grained permission enum in `backend/enum/permissions/permission.enum.ts` |
| SystemPermissionGroupSlug | Enum defining 7 immutable system permission group slugs |
| LocalizedString | `Partial<Record<AppLocale, string>>` — multi-language text stored as jsonb |
| Pothos | The GraphQL schema builder library used by Siraj for type-safe GraphQL schemas |
| gqlSchemaBuilder | The shared Pothos builder instance for registering types, enums, and resolvers |
| Feature 6 | Outcome Knowledge Base & Progress Tracking — tracks learning outcomes and progress milestones |

---

## Requirements Review Checklist

### Completeness ✅
- [x] All user stories have clear roles, features, and benefits
- [x] Each requirement has specific acceptance criteria using EARS format
- [x] Non-functional requirements are addressed (performance, security, reliability)
- [x] Success criteria are defined and measurable
- [x] Navigation/sidebar/tabs noted as deferred (types-only plan)
- [x] Permissions documented with group assignments and future route gates
- [x] Feature 6 (Outcome Knowledge Base) is covered

### Quality ✅
- [x] Requirements are written in active voice
- [x] Each acceptance criterion is testable
- [x] Requirements avoid implementation details (mostly — canonical pattern specifics noted as constraints)
- [x] Terminology is consistent throughout (SelectType/InsertType/ReturnType/SubmitInput)

### EARS Format Validation ✅
- [x] WHEN statements describe specific events or triggers
- [x] IF statements describe clear conditions or states
- [x] All statements use SHALL for system responses

### Traceability ✅
- [x] Requirements are numbered (0-12)
- [x] Dependencies between requirements are clear
- [x] Assumptions and constraints are documented
- [x] Upstream (Plan 01) and downstream (Plans 03-07) dependencies mapped
