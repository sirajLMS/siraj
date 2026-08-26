# Plan 02 — Types & Permissions: Requirements

## Document Info

| Field | Value |
|-------|-------|
| Feature | Certificate Types & Permissions |
| Plan # | 02 |
| Dependencies | Plan 1 (DB Schema & Enums) |
| Stakeholders | Backend, GraphQL, Frontend |
| Related Docs | MASTER_ARCHITECTURE.md, siraj_analysis/02-types-enums-patterns.md, siraj_analysis/09-auth-permissions.md, cgvs_analysis/02-database-schema.md (Type System section), cgvs_analysis/07-auth-security-config.md (§12 Admin RBAC) |
| AGENTS.md References | `backend/types/AGENTS.md`, `backend/enum/AGENTS.md`, `backend/AGENTS.md` (root), `shared/AGENTS.md` |
| Instruction Files | `.agents/instructions/backend.instructions.md` |

---

## 1. Introduction

### 1.1 Overview

This plan defines the complete type system and permission catalog for the certificate feature. It creates canonical backend type definitions for all certificate-domain entities (certificates, templates, elements, variables, categories, recipient groups, verifications) following Siraj's `{Entity}SelectType` / `{Entity}InsertType` / `{Entity}ReturnType` / `{Entity}SubmitInput` naming convention. It also registers all certificate-domain TypeScript enums in `backend/enum/` and adds 11 new `AppPermission` entries to the existing permission catalog, plus defines which system permission groups receive which certificate permissions.

### 1.2 Business Value

- **Type safety**: A single canonical type definition per entity ensures all layers (repository, service, GraphQL) share identical contracts, eliminating drift.
- **Permission enforcement**: Fine-grained permissions allow role-based access control (RBAC) over certificate operations — admins can manage templates, teachers can generate certificates, public users can verify.
- **Enum metadata**: Arabic/English display labels for all certificate enums enable localized UI rendering without hardcoding strings.

### 1.3 Scope

| In Scope | Out of Scope |
|----------|-------------|
| Type definitions for 8 entities (select, insert, return, submit) | Database schema/table creation (Plan 1) |
| Pagination, filter, and sort types for each listable entity | Repository implementations (Plan 3) |
| Filter argument types with multi-operator support | Service business logic (Plan 4) |
| 8 TypeScript enums in `backend/enum/certificates/` | GraphQL Pothos type registration (Plan 5) |
| Enum metadata (Arabic/English display labels) | Frontend UI components (Plans 8-19) |
| 11 new `AppPermission` entries | Permission group seed migration SQL (Plan 1) |
| Permission group default mappings | Public verification endpoint logic (Plan 5) |
| i18n translation keys for permissions and enum labels | i18n for frontend page content (Plans 8-19) |
| Barrel export registration in `backend/enum/index.ts` and `backend/types/index.ts` | |
| Cross-layer enum duplication in `shared/constants/` (if needed by frontend) | |

---

## 2. Requirements — Type Definitions

### 2.1 Entity Type Quad Pattern

Each certificate entity MUST follow the Siraj canonical naming convention from `backend/types/AGENTS.md`:
- `{Entity}SelectType` — raw DB row shape via `$inferSelect`
- `{Entity}InsertType` — raw insert shape via `$inferInsert`
- `{Entity}ReturnType` — canonical return type that Omits forbidden/system fields, re-applies enum types (instead of raw strings), and adds resolved join properties
- `{Entity}SubmitInput` — input type that Omits system-managed fields (id, timestamps, version, idempotencyKey, status where applicable)

**REQ-TYPE-001**: WHEN a developer creates type definitions for any certificate entity, THEN the system SHALL produce exactly four canonical types (SelectType, InsertType, ReturnType, SubmitInput) in a single file under `backend/types/certificates/`.

**REQ-TYPE-002**: WHEN a ReturnType is defined for an entity with enum columns, THEN the ReturnType SHALL re-apply the proper TypeScript enum types (from `backend/enum/certificates/`) for each enum column, replacing the raw string inference from `$inferSelect`.

**REQ-TYPE-003**: WHEN a ReturnType is defined for an entity with soft-delete columns, THEN the ReturnType SHALL Omits the `deletedAt` field to prevent GraphQL exposure of internal lifecycle metadata.

**REQ-TYPE-004**: WHEN a SubmitInput is defined, THEN it SHALL Omits `id`, `createdAt`, `updatedAt`, `deletedAt`, `idempotencyKey`, `version`, and any auto-computed status fields that the service layer manages.

### 2.2 Certificate Entity Types

**REQ-TYPE-010**: The system SHALL define `CertificateSelectType` and `CertificateInsertType` matching the `certificates` table columns from Plan 1 (id, templateId, studentId, recipientGroupId, releaseDate, verificationCode, status, generationStatus, pdfFilePath, pdfStorageKey, issuedAt, revokedAt, revokedByUserId, revokeReason, metadata, version, idempotencyKey, createdAt, updatedAt, deletedAt).

**REQ-TYPE-011**: The system SHALL define `CertificateReturnType` that Omits `deletedAt`, `idempotencyKey`, `version`, and re-applies `CertificateStatus` and `CertificateGenerationStatus` enum types. It SHALL add optional resolved properties: `templateName` (from template join), `studentName` (from student join), `recipientGroupName` (from recipient group join), `studentEmail`, `studentAvatarUrl`.

**REQ-TYPE-012**: The system SHALL define `CertificateSubmitInput` that Omits `id`, `createdAt`, `updatedAt`, `deletedAt`, `idempotencyKey`, `version`, `verificationCode` (system-generated), `pdfFilePath`, `pdfStorageKey`, `issuedAt`, `revokedAt`, `revokedByUserId`, `revokeReason`, `status` (service-managed), `generationStatus` (service-managed).

### 2.3 Certificate Template Entity Types

**REQ-TYPE-020**: The system SHALL define `CertificateTemplateSelectType` and `CertificateTemplateInsertType` matching the `certificate_templates` table columns (id, categoryId, name, description, width, height, orientation, backgroundImagePath, fontFamily, defaultFontSize, status, version, currentVersionId, createdByUserId, createdAt, updatedAt, deletedAt).

**REQ-TYPE-021**: The system SHALL define `CertificateTemplateReturnType` that Omits `deletedAt`, `idempotencyKey`, `createdByUserId`, re-applies `TemplateStatus` and `CertificateOrientation` and `FontFamily` enum types, and adds resolved properties: `categoryName` (from category join), `elementCount` (computed), `variableCount` (computed), `certificateCount` (computed), `createdByName` (from user join).

**REQ-TYPE-022**: The system SHALL define `CertificateTemplateSubmitInput` that Omits `id`, `createdAt`, `updatedAt`, `deletedAt`, `version`, `currentVersionId`, `createdByUserId`, `status` (service-managed lifecycle: draft → published → archived). Input retains: categoryId, name, description, width, height, orientation, backgroundImagePath, fontFamily, defaultFontSize.

### 2.4 Template Element Entity Types

**REQ-TYPE-030**: The system SHALL define `TemplateElementSelectType` and `TemplateElementInsertType` matching the `certificate_template_elements` table columns (id, templateId, type, label, xPosition, yPosition, width, height, zIndex, rotation, fontSize, color, alignment, fontFamily, languageConstraint, content, sourceType, sourceField, dateFormat, imageUrl, imageWidth, imageHeight, qrCodeSize, shapeType, createdAt, updatedAt).

**REQ-TYPE-031**: The system SHALL define `TemplateElementReturnType` that re-applies `TemplateElementType` enum type and adds the resolved property `templateName` (optional, from template join).

**REQ-TYPE-032**: The system SHALL define `TemplateElementSubmitInput` (called `TemplateElementSubmitInput` to match Siraj convention) that Omits `id`, `createdAt`, `updatedAt`, and `templateId` (assigned by service from route param). Input retains all element configuration properties.

### 2.5 Template Variable Entity Types

**REQ-TYPE-040**: The system SHALL define `TemplateVariableSelectType` and `TemplateVariableInsertType` matching the `certificate_template_variables` table columns (id, templateId, name, description, type, defaultValue, isRequired, displayOrder, minLength, maxLength, pattern, minValue, maxValue, decimalPlaces, minDate, maxDate, dateFormat, selectOptions, allowMultiple, createdAt, updatedAt).

**REQ-TYPE-041**: The system SHALL define `TemplateVariableReturnType` that re-applies `TemplateVariableType` enum type and adds resolved property `templateName` (optional).

**REQ-TYPE-042**: The system SHALL define `TemplateVariableSubmitInput` that Omits `id`, `createdAt`, `updatedAt`, `templateId`. Retains: name, description, type, defaultValue, isRequired, displayOrder, and all type-specific constraint fields (minLength, maxLength, pattern, etc.).

### 2.6 Certificate Category Entity Types

**REQ-TYPE-050**: The system SHALL define `CertificateCategorySelectType` and `CertificateCategoryInsertType` matching the `certificate_categories` table columns (id, name, description, parentCategoryId, displayOrder, specialType, createdAt, updatedAt, deletedAt).

**REQ-TYPE-051**: The system SHALL define `CertificateCategoryReturnType` that Omits `deletedAt`, re-applies any enum types for `specialType`, and adds resolved properties: `parentCategoryName` (optional, from self-join), `templateCount` (computed), `subCategoryCount` (computed).

**REQ-TYPE-052**: The system SHALL define `CertificateCategorySubmitInput` that Omits `id`, `createdAt`, `updatedAt`, `deletedAt`. Retains: name, description, parentCategoryId, displayOrder, specialType.

### 2.7 Recipient Group Entity Types

**REQ-TYPE-060**: The system SHALL define `RecipientGroupSelectType` and `RecipientGroupInsertType` matching the `certificate_recipient_groups` table columns (id, templateId, name, description, date, createdAt, updatedAt, deletedAt).

**REQ-TYPE-061**: The system SHALL define `RecipientGroupReturnType` that Omits `deletedAt` and adds resolved properties: `templateName` (optional), `recipientCount` (computed from join to recipient_group_items), `studentNames` (optional array from join).

**REQ-TYPE-062**: The system SHALL define `RecipientGroupSubmitInput` that Omits `id`, `createdAt`, `updatedAt`, `deletedAt`, `templateId` (assigned by service). Retains: name, description, date.

### 2.8 Certificate Verification Entity Types

**REQ-TYPE-070**: The system SHALL define `CertificateVerificationSelectType` and `CertificateVerificationInsertType` matching the `certificate_verifications` table columns (id, certificateId, verificationCode, ipAddress, userAgent, result, verifiedAt, createdAt).

**REQ-TYPE-071**: The system SHALL define `CertificateVerificationReturnType` (or omit ReturnType if this entity is write-only and never returned to clients) that re-applies `VerificationResult` enum type.

**REQ-TYPE-072**: The system SHALL define `CertificateVerificationInsertInput` (insert-only, no submit input needed since verifications are system-created during the public verification flow) that Omits `id`, `createdAt`. Retains: certificateId, verificationCode, ipAddress, userAgent, result, verifiedAt.

### 2.9 Pagination, Filter, Sort Types

**REQ-TYPE-080**: The system SHALL reuse the existing `PageInfo` type from `@/backend/types/shared/pagination.types` for all certificate entity list responses — no duplicate PageInfo definitions.

**REQ-TYPE-081**: The system SHALL define filter argument types for each listable entity: `CertificateFilterArgs`, `CertificateTemplateFilterArgs`, `TemplateElementFilterArgs`, `TemplateVariableFilterArgs`, `CertificateCategoryFilterArgs`, `RecipientGroupFilterArgs`. Each filter type SHALL expose optional filter fields relevant to its entity (e.g., CertificateFilterArgs includes: status, templateId, studentId, dateRange, verificationCode, searchQuery; TemplateFilterArgs includes: status, categoryId, searchQuery).

**REQ-TYPE-082**: The system SHALL define sort clause types for each listable entity following the pattern: `{Entity}OrderByColumn` (TypeScript enum of sortable column names) and `{Entity}OrderByClause` (type with `column` and optional `direction: OrderSortDirection`).

**REQ-TYPE-083**: The system SHALL define `{Entity}WithFiltersResponse` types for each listable entity, containing `data: {Entity}ReturnType[]` and `pageInfo: PageInfo`.

**REQ-TYPE-084**: The system SHALL define a `BulkGenerationResult` type containing: `totalRequested`, `totalSucceeded`, `totalFailed`, `failedItems` (array of `{ studentId, errorMessage }`), `generatedCertificateIds` (array of string).

**REQ-TYPE-085**: The system SHALL define a `RevokeResult` type containing: `certificateId`, `previousStatus`, `newStatus`, `revokedAt`, `success: boolean`.

**REQ-TYPE-086**: The system SHALL define a `PublishResult` type containing: `templateId`, `previousStatus`, `newStatus`, `version`, `success: boolean`.

---

## 3. Requirements — Enum Registration

### 3.1 Certificate Enums File

**REQ-ENUM-001**: The system SHALL create the file `backend/enum/certificates/certificate.enum.ts` containing all **11** certificate-domain TypeScript enums, matching the 11 pgEnums Plan 1 registers in `backend/db/schema/enums.ts` (authoritative set in Plan 01 `requirements.md` §3.1 REQ-01-150 — Plan 01 is the schema owner). The TS enum is the single source of truth; `createPgEnumFromEnum("snake_case_name", <Enum>)` derives the PG enum values from `Object.values(<Enum>)`.

**REQ-ENUM-002**: The system SHALL define the following enums with string values matching their PG enum counterparts from Plan 1:

| Enum | Values | Purpose |
|------|--------|---------|
| `CertificateTemplateStatus` | DRAFT, REVIEW, PUBLISHED, ARCHIVED | Template lifecycle states |
| `CertificateOrientation` | LANDSCAPE, PORTRAIT | Document orientation |
| `CertificateBackgroundType` | COLOR, IMAGE, GRADIENT | Background rendering type |
| `TemplateElementType` | STATIC_TEXT, DATA_TEXT, DATA_DATE, IMAGE, QR_CODE, SHAPE | Element type discriminator |
| `TemplateVariableType` | TEXT, NUMBER, DATE, SELECT | Variable type discriminator |
| `CertificateRecipientGroupStatus` | ACTIVE, INACTIVE, COMPLETED | Recipient-group batch lifecycle |
| `CertificateRecipientItemStatus` | PENDING, PROCESSING, ISSUED, FAILED, SKIPPED | Per-recipient item lifecycle inside a batch |
| `CertificateStatus` | DRAFT, PENDING, ISSUED, REVOKED, EXPIRED | Certificate lifecycle states |
| `CertificateGenerationStatus` | PENDING, PROCESSING, COMPLETED, FAILED | PDF generation pipeline states |
| `CertificateVerificationMethod` | QR_CODE, LINK, MANUAL | How the cert was verified |
| `CertificateVerificationResult` | VALID, INVALID, REVOKED, EXPIRED, NOT_FOUND | Verification outcome codes |

> **`FontFamily` is a TypeScript union, NOT a 12th PG enum.** Per Plan 01 REQ-01-020, `certificate_templates.fontFamily` is a plain `text` column (default `'Cairo'`) with NO corresponding pgEnum. Plan 02 therefore defines `FontFamily` as a TS union `"Amiri" | "Cairo" | "Tajawal" | "Noto Naskh" | "Inter" | "Roboto" | "System Default"` for client-side narrowing only — it is NOT registered via `createPgEnumFromEnum`. (Earlier REQ-ENUM-002 listed `FontFamily` as one of the 8 enums; that classification would have broken the Plan 01 ↔ Plan 02 pgEnum registry parity — corrected.)

> **Naming canonicalization**: enum names use the `Certificate…` prefix to match Plan 01's `createPgEnumFromEnum("certificate_<domain>", …)` pattern exactly; the earlier short names `TemplateStatus` and `VerificationResult` are RENAMED to `CertificateTemplateStatus` and `CertificateVerificationResult` so that `reApplyEnums` typing and PG-enum registration line up. The `CertificateGenerationStatus` value set is `PENDING, PROCESSING, COMPLETED, FAILED` (NOT the earlier `QUEUED, RENDERING` or `PENDING, IN_PROGRESS`).

**REQ-ENUM-003**: The system SHALL define an `ALLOWED_STATUS_TRANSITIONS` const lookup (`Record<CertificateStatus, readonly CertificateStatus[]>`) defining valid state transitions:
- DRAFT → PENDING
- PENDING → ISSUED | FAILED
- ISSUED → REVOKED | EXPIRED
- REVOKED → (terminal)
- EXPIRED → (terminal)
- FAILED → PENDING (retry allowed)

*(Aligned to Plan 01 CHECK constraints REQ-01-117..121 + the new `generationStatus` column — the earlier `DRAFT → PENDING, ISSUED` jumped states illegally; issuance only succeeds once `generationStatus=COMPLETED` per the generation pipeline.)*

**REQ-ENUM-004**: The system SHALL define an `ALLOWED_TEMPLATE_STATUS_TRANSITIONS` const lookup (`Record<CertificateTemplateStatus, readonly CertificateTemplateStatus[]>`) aligned to Plan 01 REQ-01-026/027 (draft cannot generate certs; archived templates cannot generate new certs):
- DRAFT → REVIEW | PUBLISHED
- REVIEW → PUBLISHED | DRAFT
- PUBLISHED → ARCHIVED
- ARCHIVED → DRAFT (un-archive for editing)

### 3.2 Enum Barrel Registration

**REQ-ENUM-010**: The system SHALL create a sub-directory index file `backend/enum/certificates/index.ts` that re-exports from `./certificate.enum`.

**REQ-ENUM-011**: The system SHALL add `export * from "./certificates";` to the top-level barrel `backend/enum/index.ts` to register the new sub-directory.

### 3.3 Enum Metadata (i18n Display Labels)

**REQ-ENUM-020**: The system SHALL define enum metadata providing Arabic/English display labels for each enum value. This metadata SHALL be structured as a const object keyed by enum value, with each entry containing `{ ar: string, en: string }` display text.

**REQ-ENUM-021**: The enum display labels SHALL follow the `shared/locale/` localization system conventions — the metadata is a plain object, not a `LocalizedString` JSONB map (since enums are compile-time constants, not DB-stored).

**REQ-ENUM-022**: The following display labels SHALL be defined:

| Enum | Value | Arabic Label | English Label |
|------|-------|-------------|---------------|
| CertificateStatus | DRAFT | مسودة | Draft |
| CertificateStatus | PENDING | قيد الانتظار | Pending |
| CertificateStatus | ISSUED | صادر | Issued |
| CertificateStatus | REVOKED | ملغى | Revoked |
| CertificateStatus | EXPIRED | منتهي الصلاحية | Expired |
| TemplateStatus | DRAFT | مسودة | Draft |
| TemplateStatus | PUBLISHED | منشور | Published |
| TemplateStatus | ARCHIVED | مؤرشف | Archived |
| TemplateElementType | STATIC_TEXT | نص ثابت | Static Text |
| TemplateElementType | DATA_TEXT | نص بيانات | Data Text |
| TemplateElementType | DATA_DATE | تاريخ | Date |
| TemplateElementType | IMAGE | صورة | Image |
| TemplateElementType | QR_CODE | رمز QR | QR Code |
| TemplateElementType | SHAPE | شكل | Shape |
| TemplateVariableType | TEXT | نص | Text |
| TemplateVariableType | NUMBER | رقم | Number |
| TemplateVariableType | DATE | تاريخ | Date |
| TemplateVariableType | SELECT | اختيار | Select |
| CertificateOrientation | LANDSCAPE | أفقي | Landscape |
| CertificateOrientation | PORTRAIT | عمودي | Portrait |
| VerificationResult | VALID | صالح | Valid |
| VerificationResult | INVALID | غير صالح | Invalid |
| VerificationResult | EXPIRED | منتهي الصلاحية | Expired |
| VerificationResult | REVOKED | ملغى | Revoked |
| VerificationResult | NOT_FOUND | غير موجود | Not Found |
| CertificateGenerationStatus | PENDING | قيد الانتظار | Pending |
| CertificateGenerationStatus | IN_PROGRESS | قيد التنفيذ | In Progress |
| CertificateGenerationStatus | COMPLETED | مكتمل | Completed |
| CertificateGenerationStatus | FAILED | فشل | Failed |

(FortFamily labels omitted from this table — see design.md for full FontFamily metadata.)

---

## 4. Requirements — AppPermission Entries

### 4.1 New Permission Catalog Entries

**REQ-PERM-001**: The system SHALL add the following 11 entries to the `AppPermission` enum in `backend/enum/permissions/permission.enum.ts`, using the Siraj dot-separated convention (`entity.action` / `entity.subentity.action`):

| Enum Key | Value | Purpose |
|----------|-------|---------|
| `CERTIFICATES_VIEW` | `certificates.view` | View certificate list and detail |
| `CERTIFICATES_MANAGE` | `certificates.manage` | Create/edit/delete certificate records |
| `CERTIFICATES_REVOKE` | `certificates.revoke` | Revoke issued certificates |
| `CERTIFICATES_VERIFY` | `certificates.verify` | Manual verification (admin-side, not public) |
| `CERTIFICATES_TEMPLATES_VIEW` | `certificates.templates.view` | View template list and detail |
| `CERTIFICATES_TEMPLATES_MANAGE` | `certificates.templates.manage` | Create/edit/delete templates |
| `CERTIFICATES_TEMPLATES_PUBLISH` | `certificates.templates.publish` | Publish/archive templates (lifecycle state change) |
| `CERTIFICATES_CATEGORIES_MANAGE` | `certificates.categories.manage` | Manage certificate categories (CRUD) |
| `CERTIFICATES_RECIPIENT_GROUPS_MANAGE` | `certificates.recipient_groups.manage` | Manage recipient groups (CRUD) |
| `CERTIFICATES_GENERATE` | `certificates.generate` | Trigger single certificate generation |
| `CERTIFICATES_BULK_GENERATE` | `certificates.bulk_generate` | Trigger batch/bulk certificate generation |

**REQ-PERM-002**: The existing `filterKnownAppPermissions` helper SHALL automatically include the new permission values since it derives from `Object.values(AppPermission)` — no modification to the helper function needed.

**REQ-PERM-003**: The `appPermissionEnum` PG enum definition in `backend/db/schema/enums.ts` SHALL automatically include the new values since it is built from `Object.values(AppPermission)` — Plan 1 handles the migration that extends the PG enum type.

### 4.2 Permission Group Default Mapping

**REQ-PERM-010**: The system SHALL define which system permission groups receive which certificate permissions. The mapping SHALL be documented in design.md and implemented as a seed migration in Plan 1's scope (DB seeds). The mapping is:

| Group Slug | Permissions Granted |
|------------|-------------------|
| `super_admin` | ALL certificate permissions (via super-admin shortcut — no explicit seeding needed) |
| `academy_admin` | ALL 11 certificate permissions |
| `staff_default` | CERTIFICATES_VIEW, CERTIFICATES_TEMPLATES_VIEW, CERTIFICATES_VERIFY, CERTIFICATES_GENERATE, CERTIFICATES_BULK_GENERATE |
| `teacher_default` | CERTIFICATES_VIEW, CERTIFICATES_TEMPLATES_VIEW, CERTIFICATES_GENERATE, CERTIFICATES_BULK_GENERATE |
| `supervisor_default` | CERTIFICATES_VIEW, CERTIFICATES_TEMPLATES_VIEW, CERTIFICATES_VERIFY |
| `parent_default` | CERTIFICATES_VIEW (limited to own children — enforced at service layer) |
| `student_default` | CERTIFICATES_VIEW (limited to own certificates — enforced at service layer) |

**REQ-PERM-011**: The system SHALL NOT grant template management, category management, recipient group management, or revoke permissions to `teacher_default`, `parent_default`, or `student_default` groups — these are admin/staff-only operations.

**REQ-PERM-012**: WHEN a user with `teacher_default` or `parent_default` group accesses certificates, THEN the service layer SHALL scope data visibility by `ctx.user.id` → resolved `teacherId` or `parentId` (as done for students/parents across the existing system). This scoping is NOT a type/permission-layer concern but is documented here for context.

### 4.3 Permission Descriptions (i18n)

**REQ-PERM-020**: Each new permission SHALL have Arabic/English description labels for the `permissions` table seed (stored as `LocalizedString` JSONB). The labels SHALL be:

| Permission Key | Arabic Description | English Description |
|---------------|-------------------|---------------------|
| certificates.view | عرض الشهادات | View certificates |
| certificates.manage | إدارة الشهادات | Manage certificates |
| certificates.revoke | إلغاء الشهادات الصادرة | Revoke issued certificates |
| certificates.verify | التحقق اليدوي من الشهادات | Manual certificate verification |
| certificates.templates.view | عرض قوالب الشهادات | View certificate templates |
| certificates.templates.manage | إدارة قوالب الشهادات | Manage certificate templates |
| certificates.templates.publish | نشر وأرشفة القوالب | Publish and archive templates |
| certificates.categories.manage | إدارة فئات الشهادات | Manage certificate categories |
| certificates.recipient_groups.manage | إدارة مجموعات المستلمين | Manage recipient groups |
| certificates.generate | إنشاء شهادة فردية | Generate single certificate |
| certificates.bulk_generate | إنشاء شهادات بالجملة | Bulk generate certificates |

**REQ-PERM-021**: Each new permission SHALL have a category label (Arabic/English) for grouping in the permissions management UI:

| Permission Key | Arabic Category | English Category |
|---------------|----------------|-----------------|
| certificates.* | الشهادات | Certificates |
| certificates.templates.* | قوالب الشهادات | Certificate Templates |
| certificates.categories.* | فئات الشهادات | Certificate Categories |
| certificates.recipient_groups.* | مجموعات المستلمين | Recipient Groups |
| certificates.generate, certificates.bulk_generate | إنشاء الشهادات | Certificate Generation |

---

## 5. Requirements — Barrel Exports

**REQ-BARREL-001**: The system SHALL create `backend/types/certificates/index.ts` that re-exports from `./certificate.types` and all other certificate type files in the sub-directory.

**REQ-BARREL-002**: The system SHALL add `export * from "./certificates";` to the top-level barrel `backend/types/index.ts`.

**REQ-BARREL-003**: The system SHALL add `export * from "./certificates";` to `backend/enum/index.ts` (the top-level enum barrel).

---

## 6. Requirements — i18n

### 6.1 Namespace Structure

**REQ-I18N-001**: The system SHALL define a translation namespace `certificates` with nested sub-domains: `permissions`, `enums`, `statuses`, `errors`.

**REQ-I18N-002**: The `certificates.permissions` sub-namespace SHALL contain the permission display labels (name and description) for all 11 certificate permissions in both Arabic and English locales.

**REQ-I18N-003**: The `certificates.enums` sub-namespace SHALL contain the enum display labels for all **11 certificate enums** (CertificateTemplateStatus, CertificateOrientation, CertificateBackgroundType, TemplateElementType, TemplateVariableType, CertificateRecipientGroupStatus, CertificateRecipientItemStatus, CertificateStatus, CertificateGenerationStatus, CertificateVerificationMethod, CertificateVerificationResult) in both Arabic and English locales. (`FontFamily`, being a TS union and NOT a pgEnum, is included in the same `certificates.enums.font_family.*` keys for client-side display but is NOT registered as a Pothos enumType — see design §4.1.)

**REQ-I18N-004**: The `certificates.statuses` sub-namespace SHALL contain human-readable status transition messages and lifecycle labels for certificates and templates (e.g., "Certificate issued successfully", "Template published successfully", "Certificate has been revoked").

**REQ-I18N-005**: The `certificates.errors` sub-namespace SHALL contain error messages for type/permission validation failures (e.g., "You do not have permission to manage certificates", "Certificate status cannot transition from X to Y", "Template must be in DRAFT status to publish").

### 6.2 Translation Key Catalog

**REQ-I18N-010**: The following translation key categories SHALL be defined:

**Permission labels** (21 keys — 11 permission names + 10 category labels including the 5 group-level categories):
- `certificates.permissions.certificates_view.name` / `.description`
- `certificates.permissions.certificates_manage.name` / `.description`
- `certificates.permissions.certificates_revoke.name` / `.description`
- `certificates.permissions.certificates_verify.name` / `.description`
- `certificates.permissions.certificates_templates_view.name` / `.description`
- `certificates.permissions.certificates_templates_manage.name` / `.description`
- `certificates.permissions.certificates_templates_publish.name` / `.description`
- `certificates.permissions.certificates_categories_manage.name` / `.description`
- `certificates.permissions.certificates_recipient_groups_manage.name` / `.description`
- `certificates.permissions.certificates_generate.name` / `.description`
- `certificates.permissions.certificates_bulk_generate.name` / `.description`
- `certificates.permissions.category.certificates.name`
- `certificates.permissions.category.templates.name`
- `certificates.permissions.category.categories.name`
- `certificates.permissions.category.recipient_groups.name`
- `certificates.permissions.category.generation.name`

**Enum labels** (~50 keys — one function type per enum value, across all 11 enums):
- `certificates.enums.certificate_status.draft` / `.pending` / `.issued` / `.revoked` / `.expired`
- `certificates.enums.template_status.draft` / `.published` / `.archived`
- `certificates.enums.template_element_type.static_text` / `.data_text` / `.data_date` / `.image` / `.qr_code` / `.shape`
- `certificates.enums.template_variable_type.text` / `.number` / `.date` / `.select`
- `certificates.enums.certificate_orientation.landscape` / `.portrait`
- `certificates.enums.font_family.amiri` / `.cairo` / `.tajawal` / `.noto_naskh` / `.inter` / `.roboto` / `.system_default`
- `certificates.enums.verification_result.valid` / `.invalid` / `.expired` / `.revoked` / `.not_found`
- `certificates.enums.generation_status.pending` / `.in_progress` / `.completed` / `.failed`

**Error messages** (at minimum):
- `certificates.errors.no_permission_view` — "You do not have permission to view certificates"
- `certificates.errors.no_permission_manage` — "You do not have permission to manage certificates"
- `certificates.errors.no_permission_revoke` — "You do not have permission to revoke certificates"
- `certificates.errors.no_permission_templates_manage` — "You do not have permission to manage templates"
- `certificates.errors.no_permission_publish` — "You do not have permission to publish templates"
- `certificates.errors.invalid_status_transition` — interpolation: `(from: string, to: string) => string` — "Cannot transition certificate status from {from} to {to}"
- `certificates.errors.template_not_draft` — "Template must be in DRAFT status to publish"
- `certificates.errors.template_not_published` — "Template must be in PUBLISHED status to generate certificates"
- `certificates.errors.verification_code_not_found` — "Certificate with this verification code was not found"

**REQ-I18N-011**: All translation keys SHALL be defined using the compile-time TypeScript system in `shared/locale/` following the `defineNamespace` pattern. The `load` config SHALL provide async loaders for `ar` and `en` locales.

**REQ-I18N-012**: Pluralization SHALL use the standard pattern: `(count: number) => string` function type in the namespace schema, implemented in each locale file. Error messages that reference counts (e.g., bulk generation results) SHALL use Arabic zero/one/two/few/many/other pluralization and English one/other pluralization.

---

## 7. Acceptance Criteria

### 7.1 Type Definitions

- **AC-TYPE-01**: All 8 entities have SelectType, InsertType defined via `$inferSelect`/`$inferInsert` — verified by `bun run tsgo` passing.
- **AC-TYPE-02**: All 8 entities have ReturnType with enums re-applied and forbidden fields omitted.
- **AC-TYPE-03**: All listable entities have SubmitInput with system fields omitted.
- **AC-TYPE-04**: Filter, sort, and pagination response types exist for all listable entities.
- **AC-TYPE-05**: `CertificateReturnType` includes resolved join properties (templateName, studentName, etc.) as optional fields.
- **AC-TYPE-06**: `backend/types/certificates/index.ts` barrel exists and is re-exported from `backend/types/index.ts`.
- **AC-TYPE-07**: No local type definitions created in any Pothos/GraphQL files (enforced by lint).

### 7.2 Enums

- **AC-ENUM-01**: File `backend/enum/certificates/certificate.enum.ts` exists with all **11 enums** matching Plan 01 §3.1 REQ-01-150 (names + values; `FontFamily` is a TS-only union co-located in the same file).
- **AC-ENUM-02**: `ALLOWED_STATUS_TRANSITIONS` and `ALLOWED_TEMPLATE_STATUS_TRANSITIONS` const objects are defined alongside their enums.
- **AC-ENUM-03**: `backend/enum/certificates/index.ts` barrel exists.
- **AC-ENUM-04**: `backend/enum/index.ts` includes `export * from "./certificates"`.
- **AC-ENUM-05**: Enum metadata with Arabic/English display labels is defined for all enum values.
- **AC-ENUM-06**: `bun run tsgo` passes with all new enum files included.

### 7.3 Permissions

- **AC-PERM-01**: 11 new `AppPermission` entries exist in the enum with correct dot-separated values.
- **AC-PERM-02**: `filterKnownAppPermissions` function still compiles and works unchanged.
- **AC-PERM-03**: Permission group default mapping is documented in design.md and the seed migration (Plan 1 scope) uses the mapping.
- **AC-PERM-04**: Permission description and category labels (Arabic/English) are defined in the `permissions` table seed.

### 7.4 i18n

- **AC-I18N-01**: `certificates` namespace is registered in `shared/locale/namespaces/`.
- **AC-I18N-02**: Both `ar` and `en` locale loaders exist with all numbered translation keys.
- **AC-I18N-03**: Pluralization functions are correctly typed in the namespace schema.
- **AC-I18N-04**: `bun run tsgo` passes with all i18n files included.

### 7.5 Quality Gates

- **AC-Q-01**: `bun run tsgo` passes with zero errors.
- **AC-Q-02**: `bun run biome:check` passes on all new files.
- **AC-Q-03**: `bun run lint` passes on all new files (via lint queue client for scoped files).
- **AC-Q-04**: No `console.*` usage in any new file (use `@/backend/lib/logger`).
- **AC-Q-05**: All imports use `@/` path alias (no relative imports across layer boundaries).

---

## 8. Feature 6: Outcome Knowledge Base & Progress Tracking

### 8.1 Outcome Recording

**REQ-OUTCOME-001**: During implementation, the developer SHALL document any deviations from the planned type naming convention, unexpected enum mapping challenges, or permission group seeding issues encountered. These SHALL be recorded as outcome notes in the implementation task tracking.

### 8.2 Knowledge Propagation

**REQ-OUTCOME-002**: The completed implementation SHALL verify that all new type files and enum files are properly discovered by the barrel exports and that `bun run tsgo` confirms no missing exports before marking the task complete.

---

## 9. Dependencies

| Dependency | Provides | Impact if Missing |
|-----------|----------|-------------------|
| Plan 1 (DB Schema & Enums) | Drizzle table definitions (`certificates`, `certificate_templates`, etc.) that `$inferSelect`/`$inferInsert` derive from; PG enum definitions that TS enums must match | Type inference will fail — `typeof table.$inferSelect` has no table to reference |
| Plan 1 (DB Schema & Enums) | `appPermissionEnum` PG enum extension (migration) | New AppPermission values cannot be seeded into the `permissions` table |
| Existing `backend/types/shared/pagination.types.ts` | `PageInfo`, `PaginationArgs` types | Must reuse, not redefine |

---

## 10. References

- `backend/types/AGENTS.md` — Single Canonical Object Type Pattern, naming conventions
- `backend/enum/AGENTS.md` — Enum layer rules, backend-only, file organization, barrel registration
- `backend/AGENTS.md` — Standard Type Definition Pattern across layers
- `shared/AGENTS.md` — Shared layer rules, cross-layer enum duplication rules
- `siraj_analysis/02-types-enums-patterns.md` — Full inventory of existing type/enum patterns
- `siraj_analysis/09-auth-permissions.md` — AppPermission catalog structure, permission group system, auth scopes
- `cgvs_analysis/02-database-schema.md` — CGVS type system (Section 6), entity columns
- `cgvs_analysis/07-auth-security-config.md` — Section 12: Admin RBAC (CGVS's simpler role model vs Siraj's permission-group model)
- `MASTER_ARCHITECTURE.md` — Layer architecture, 22-plan structure, entity model

---

## Reality Check Notes

> Added by codebase-reality verification pass on 2026-08-02. Verified against the actual state of `/home/ahmed/Projects/siraj-cert/`.

### Verified correct (no changes needed)
- `backend/enum/certificates/` sub-directory path — matches verified `backend/enum/{billing,students}/` structure. ✓
- `backend/enum/permissions/permission.enum.ts` location for `AppPermission` (the dotted-value form `BILLING_CREATE_INVOICE = "billing.create_invoice"` is the canonical convention). ✓
- `backend/types/certificates/index.ts` barrel plan and `export * from "./certificates";` to `backend/types/index.ts` — matches verified barrel pattern. ✓
- `backend/db/schema/enums.ts` (used in REQ-ENUM-002 cross-reference) is verified to be the single top-level PG enum registry. ✓
- The billing-domain type contract (`{Entity}SelectType/InsertType/ReturnType/SubmitInput`) is verified canonical in `backend/types/billing/billing.types.ts`. ✓
- Backend `permissions` table stores display metadata via `description`/`category` JSONB columns (verified `backend/db/schema/permissions/permissions.ts`) — Plan 02 correctly places permission display labels in the DB row + i18n namespace, NOT in the enum file. ✓

### Cross-plan inconsistencies — RESOLVED (this pass)
- **REQ-ENUM-001 / REQ-ENUM-002** list 8 enums, whereas Plan 01 registers 11 pgEnums in `backend/db/schema/enums.ts` and Plan 02 `design.md` (and `tasks.md` T01) reference 11 TS enums. The missing 3 are `CertificateRecipientGroupStatus`, `CertificateRecipientItemStatus`, `CertificateVerificationMethod` — they appear to be intentional omissions in `requirements.md` (perhaps considered sub-domain enums), but they are REQUIRED by Plan 01's pgEnum registry. Reconcile the lists before executing the cross-plan tasks.
- **REQ-ENUM-002 enum naming** uses `TemplateStatus`, `VerificationResult`, and `CertificateGenerationStatus` (with members PENDING, IN_PROGRESS, COMPLETED, FAILED); Plan 01's pgEnums are named `CertificateTemplateStatus`, `CertificateVerificationResult`, `CertificateGenerationStatus` (with members QUEUED, RENDERING, COMPLETED, FAILED). Name and value-set must align — pick one side and propagate. The `requirements.md` here rtlreuses short `TemplateStatus` vs `CertificateTemplateStatus` will break `reApplyEnums` (TS → PG mismatch) and `createPgEnumFromEnum` (export const name mismatch).
- **REQ-ENUM-002 includes `FontFamily`** (AMIRI, CAIRO, TAJAWAL, NOTO_NASKH, INTER, ROBOTO, SYSTEM_DEFAULT) and `design.md` §3.2 re-applies it on `CertificateTemplateReturnType`, but there is NO `font_family` pgEnum or TS enum in Plan 01. **Recommend**: either add a `font_family` pgEnum to Plan 01's `enums.ts`, OR convert `font_family` to a plain `text` column with a TS-side union type — pick one before Plan 01 executes.
- **REQ-ENUM-020..022** place enum display labels at `backend/enum/` as a plain object. Verified reality: existing `backend/enum/` files contain NO inline labels. The `design.md` §2.3 has been corrected to say display labels go in `shared/locale/` (per `requirements.md` §6). Double-check `requirements.md` should be amended to make REQ-ENUM-020..022 explicitly say "defined in `shared/locale/` namespace, NOT in `backend/enum/`".

---

### Resolution summary (SWE Expert Review — this pass applied the following edits across Plan 01 + Plan 02)

1. **Enum count reconciled to 11** everywhere (requirements/design/tasks): added `CertificateRecipientGroupStatus`, `CertificateRecipientItemStatus`, `CertificateVerificationMethod`; corrected `CertificateBackgroundType`; renamed `TemplateStatus`→`CertificateTemplateStatus` (added REVIEW), `VerificationResult`→`CertificateVerificationResult` (added INVALID); fixed `CertificateGenerationStatus` values to `PENDING, PROCESSING, COMPLETED, FAILED`; values now byte-match Plan 01 §3.1 REQ-01-150.
2. **`FontFamily` reclassified** from "one of the 8 enums" to a TS-only union (no `font_family` pgEnum) — unblocks Plan 01↔02 `createPgEnumFromEnum` parity.
3. **Permission white names canonicalized** to `certificates.*` roots (REQ-PERM-001 entries are authoritative; design §2.4/§2.10/§5.1/§5.3/§5.4 + tasks T09/T10 reconciled). The deprecated `cert.*`/`template.*` short roots and `batch_generate`/`recipient_groups.view` extras removed.
4. **Type-layer column drift removed** vs Plan 01: `createdByUserId`→`createdBy`/`updatedBy`; `widthPx/heightPx`→`width/height`; `backgroundImageUrl`/`backgroundImageStorageId`→`backgroundImageId`; `idempotencyKey` indexed; `template_versions` table references removed (version chain is `(slug, version)` on `certificate_templates`); nonexistent `recipientName`/`recipientEmail`/`resolution`/`fileUrl`/`fileSize` fields removed from `CertificateSubmitInput`/`GenerateCertificateInput`.
5. **i18n flat-file paths** in tasks T12 replaced with the verified per-domain sub-directory layout (`shared/locale/{types,namespaces,en,ar}/certificates/*.ts`); backend repo `ErrorsLabels` aggregate extension explicitly handed off to Plan 03.
6. **REQ-ENUM-020..022** clarified: display labels are defined in `shared/locale/` namespaces, NOT co-located in `backend/enum/` files — design §4.3 + tasks T01 step 3 now enforce this.


### Verified reference files
- `backend/types/billing/billing.types.ts`, `backend/enum/permissions/permission.enum.ts`, `backend/enum/students/student-lifecycle.enum.ts`, `backend/db/schema/permissions/permissions.ts`, `backend/db/schema/enums.ts`.
