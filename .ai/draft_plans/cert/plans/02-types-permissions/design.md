# Plan 02 — Types & Permissions: Design

> **Feature**: Certificate Module — Type System, Enums, Permissions
> **Plan #**: 02
> **Dependencies**: Plan 1 (DB Schema & Enums) — provides Drizzle table definitions and PG enum columns
> **Dependents**: Plan 03 (Repository Layer), Plan 04 (Services), Plan 05 (GraphQL API)
> **Architecture Position**: Layer 2 — Type definitions and permission model, between database schema (Plan 1) and repository/services (Plans 3-5)

---

## 1. Architecture Position & Data Flow

### 1.1 Layer Context

```
Plan 1 (DB Schema)
  │ Drizzle tables + PG enums
  ▼
Plan 2 (Types & Permissions)  ← THIS PLAN
  │ SelectType/InsertType/ReturnType/SubmitInput per entity
  │ AppPermission enum entries
  │ Permission group default mappings
  │ Filter/Sort/Pagination types
  │ i18n error key schemas (permissions + enums)
  ▼
Plan 3 (Repository Layer)
  │ Repos consume SelectType/InsertType from Plan 2
  │ Repos return ReturnType shapes
  ▼
Plan 4 (Services)
  │ Services consume ReturnType/SubmitInput from Plan 2
  │ Services validate with Zod against SubmitInput shapes
  │ Services check permissions against AppPermission entries
  ▼
Plan 5 (GraphQL API)
  │ Pothos object refs use ReturnType from Plan 2
  │ Pothos input refs use SubmitInput from Plan 2
  │ Pothos enum registrations use enums from Plan 2
  │ Auth scopes use AppPermission keys from Plan 2
```

### 1.2 Data Flow Through the Type System

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        TYPE FLOW (per entity)                                │
│                                                                              │
│  Drizzle Table (Plan 1)                                                      │
│    │                                                                         │
│    ├─ typeof table.$inferSelect  ──→  {Entity}SelectType  (raw DB row)       │
│    │                                      │                                  │
│    │                                      │ Omit forbidden fields           │
│    │                                      │ Re-apply TS enums                │
│    │                                      │ Add resolved (join) props        │
│    │                                      ▼                                  │
│    │                                 {Entity}ReturnType  (canonical return)  │
│    │                                                                         │
│    ├─ typeof table.$inferInsert  ──→  {Entity}InsertType  (raw insert)      │
│    │                                      │                                  │
│    │                                      │ Omit system fields               │
│    │                                      │ (id, createdAt, updatedAt,      │
│    │                                      │  deletedAt, idempotencyKey,     │
│    │                                      │  version, createdBy)          │
│    │                                      ▼                                  │
│    │                                 {Entity}SubmitInput  (API input)       │
│    │                                                                         │
│    └─ PG enums  ──→  TS enums (Plan 2, this plan)                            │
│                       │                                                      │
│                       ├─ Backend barrel:  backend/enum/certificates/*.enum.ts       │
│                       ├─ Pothos reg:       shared/enum.pothos.ts (Plan 5)   │
│                       └─ i18n labels:      shared/locale/ (this plan)        │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 1.3 Permission Data Flow

```
AppPermission enum (this plan)
  │
  ├─→ permissions table (seeded, Plan 1)
  │     key: app_permission column
  │
  ├─→ permission_groups table (seeded with defaults)
  │     permission_keys: text[] column referencing AppPermission values
  │
  ├─→ ScopeAuth builder (gqlSchemaBuilder.ts)
  │     authScopes.permission(key) → ctx.isSuperAdmin || ctx.permissions.includes(key)
  │
  └─→ Services (Plan 4)
        PermissionsService.hasPermission(userId, AppPermission.CERT_GENERATE)
```

---

## 2. Design Decisions

### 2.1 Naming Convention: AGENTS.md Canonical

**Decision**: Use the canonical naming convention from `backend/types/AGENTS.md`:
`{Entity}SelectType`, `{Entity}InsertType`, `{Entity}ReturnType`, `{Entity}SubmitInput`.

**Rationale**: The billing domain (`backend/types/billing/billing.types.ts`) is the most faithful implementer of this convention. The certificate feature is new, so we adopt the canonical pattern from the start rather than the older `{Entity}Entity`/`{Entity}` variant used by students/teachers. This ensures consistency with AGENTS.md guidance and simplifies GraphQL Pothos integration (Plan 5), which explicitly expects `{Entity}ReturnType` as the object ref basis.

**Alternative considered**: The older `{Entity}Entity`/`{Entity}` naming (students, teachers, storage). Rejected because it creates ambiguity (`Student` the type vs `students` the table) and diverges from AGENTS.md canonical guidance.

### 2.2 Type File Organization: One File Per Entity

**Decision**: Each certificate entity gets its own `.types.ts` file under **`backend/types/certificates/`** (canonical full-domain sub-directory name — verified against existing `backend/types/students/`, `backend/types/billing/`, `backend/types/teachers/`; the abbreviated `cert/` variant does NOT exist anywhere in the codebase and would break the barrel-re-export convention that requires the sub-directory name match the domain). The sub-directory has an `index.ts` barrel that re-exports all entity type files.

**Rationale**: Mirrors the billing domain structure (`backend/types/billing/billing.types.ts` houses billing entities, but the certificate feature has more entities — 8 vs 3 — so per-entity files are cleaner). Per-entity files reduce merge conflicts, simplify review diffs, and make it easy to trace a type to its entity.

**File inventory** (verified pattern: `backend/types/<domain-subdir>/<entity>.types.ts`, all kebab-case or camelCase `.types.ts` file names are valid — `backend/types/students/student-lifecycle.types.ts` uses kebab-case, `backend/types/students/student.types.ts` uses camelCase):
| File | Entities Covered |
|---|---|
| `backend/types/certificates/certificate.types.ts` | Certificate (SelectType, InsertType, ReturnType, SubmitInput) |
| `backend/types/certificates/template.types.ts` | CertificateTemplate, TemplateVersion |
| `backend/types/certificates/template-element.types.ts` | TemplateElement |
| `backend/types/certificates/template-variable.types.ts` | TemplateVariable |
| `backend/types/certificates/category.types.ts` | CertificateCategory, CategoryTreeNode |
| `backend/types/certificates/recipient-group.types.ts` | RecipientGroup, RecipientGroupItem |
| `backend/types/certificates/verification.types.ts` | CertificateVerification, PublicVerificationResult |
| `backend/types/certificates/generation.types.ts` | GenerateCertificateInput, GenerateBatchInput, BatchResult |
| `backend/types/certificates/filter.types.ts` | Filter types, sort types, pagination types for all listable entities |
| `backend/types/certificates/index.ts` | Barrel re-exporting all above |

### 2.3 Enum Organization: One File Per Domain Concern

**Decision**: Two enum files under **`backend/enum/certificates/`** (canonical full-domain sub-directory name — verified against existing `backend/enum/billing/`, `backend/enum/students/`; there is no `backend/enum/certificates/` and the top-level barrel `backend/enum/index.ts` already follows the full-domain export convention `export * from "./billing"; export * from "./students";`):
- `certificate.enum.ts` — certificate lifecycle and verification enums
- `template.enum.ts` — template element, variable, and layout enums

A sub-directory `index.ts` barrel (`backend/enum/certificates/index.ts`) re-exports both files, and is itself re-exported from the top-level `backend/enum/index.ts` via `export * from "./certificates";`.

**Rationale**: Follows the one-enum-file-per-logical-domain convention (mirrors `backend/enum/billing/billing.enum.ts` which houses `InvoiceStatus`, `InvoiceType`, `InvoicePaymentSubmissionStatus` together, plus `backend/enum/billing/index.ts` barrel). Certificate-related enums are grouped by concern: certificate lifecycle vs template design.

> **Note on enum display labels**: the inline "enum metadata" pattern is NOT used in `backend/enum/`. Reality-checked: TS enums in this codebase are bare `export enum X { ... }` plus optional `ALLOWED_*_TRANSITIONS` const objects (see `backend/enum/students/student-lifecycle.enum.ts`). Display labels for enums are exclusively located in the i18n `shared/locale/` system (see §2.11 and Plan 03 i18n). Do NOT co-locate Arabic/English label metadata in the enum files.

### 2.4 Permission Key Naming: Dot-Separated Entity.Action (canonical — matches requirements §4.1 REQ-PERM-001)

**Decision**: New `AppPermission` entries follow the existing dot-separated convention `entity.action` / `entity.subentity.action` and are rooted under the `certificates.*` namespace — the canonical authoritative list lives in `requirements.md` §4.1 (REQ-PERM-001, 11 entries: `certificates.view`, `certificates.manage`, `certificates.revoke`, `certificates.verify`, `certificates.templates.view`, `certificates.templates.manage`, `certificates.templates.publish`, `certificates.categories.manage`, `certificates.recipient_groups.manage`, `certificates.generate`, `certificates.bulk_generate`). The earlier `cert.<action>` / `template.<action>` short forms are REJECTED (non-`certificates.` roots diverge both from requirements and the verified `billing.create_invoice` / `students.edit` convention; the deprecated `cert.batch_generate` value `batch_generate` is also replaced by `bulk_generate` to match requirements).

**Rationale**: The existing `AppPermission` enum uses dot-separated strings (e.g., `billing.create_invoice`, `students.edit`, `storage.manage`). Certificate permissions follow the same pattern for consistency and to ensure the `filterKnownAppPermissions` helper and PG enum registration work without special casing.

### 2.5 Forbidden Fields per Entity

**Decision**: Each entity's `ReturnType` omits specific forbidden fields via `Omit`. The forbidden fields are determined by the entity's sensitivity and internal-use columns.

**Forbidden field matrix**:
| Entity | Omitted Fields | Reason |
|---|---|---|
| Certificate | `deletedAt`, `idempotencyKey`, `createdBy`, `issuedBy` | Internal/system fields; idempotency key is a security-sensitive dedup token; creator/issuer FKs are internal audit |
| CertificateTemplate | `deletedAt`, `createdBy`, `updatedBy` | Soft-delete and internal audit; `createdBy`/`updatedBy` FKs, not `createdByUserId`; version stays for display; `parentId` also omitted on ReturnType? (No — parentId is useful to render the version chain) |
| TemplateElement | `deletedAt` | Soft-delete only |
| TemplateVariable | `deletedAt` | Soft-delete only |
| CertificateCategory | `deletedAt` | Soft-delete only |
| RecipientGroup | `deletedAt`, `createdBy` | Soft-delete and internal audit; FK is `createdBy`; also `status` is re-applied, not omitted |
| RecipientGroupItem | `deletedAt` | Soft-delete only |
| CertificateVerification | `deletedAt` | Soft-delete only |

### 2.6 Enum Re-Application on ReturnType

**Decision**: Each `ReturnType` explicitly re-applies TypeScript enum types for enum columns, replacing the raw `string` type inferred from `$inferSelect`.

**Rationale**: Drizzle's `$inferSelect` infers PG enum columns as `string`. The `ReturnType` must use the proper TS enum types (e.g., `CertificateStatus` instead of `string`) so that:
1. Services (Plan 4) get compile-time exhaustiveness checking in switch statements.
2. Pothos (Plan 5) can use the TS enum for `gqlSchemaBuilder.enumType` registration.
3. Frontend codegen produces typed enums, not strings.

**Re-application map**:
| Entity | Column | TS Enum |
|---|---|---|
| Certificate | `status` | `CertificateStatus` |
| Certificate | `generationStatus` | `CertificateGenerationStatus` |
| CertificateTemplate | `status` | `CertificateTemplateStatus` |
| CertificateTemplate | `orientation` | `CertificateOrientation` |
| CertificateTemplate | `backgroundType` | `CertificateBackgroundType` |
| TemplateElement | `type` | `TemplateElementType` |
| TemplateVariable | `type` | `TemplateVariableType` |
| CertificateRecipientGroup | `status` | `CertificateRecipientGroupStatus` |
| CertificateRecipientGroupItem | `status` | `CertificateRecipientItemStatus` |
| CertificateVerification | `verificationMethod` | `CertificateVerificationMethod` |
| CertificateVerification | `verificationResult` | `CertificateVerificationResult` |

> **Canonical enum names**: TS enum names match Plan 01's pgEnum camelCase exports prefixed by `certificate…` EXACTLY (`CertificateTemplateStatus`, not `TemplateStatus`; `CertificateVerificationResult`, not `VerificationResult`; `CertificateGenerationStatus` with members `PENDING/PROCESSING/COMPLETED/FAILED`, not the earlier `QUEUED/RENDERING/…` or `IN_PROGRESS`). `fontFamily` is a plain `text` column on `certificate_templates` (Plan 01 REQ-01-020) — it has **no** pgEnum, so it is NOT re-applied here (the `FontFamily` TS union type is defined in Plan 02 §4 but is NOT a PG enum). The invented `CertificateResolution` and `TemplateElementSource` enums and the `certificates.resolution` column do NOT exist in Plan 01 — removed.

### 2.7 Resolved Properties on ReturnType

**Decision**: `ReturnType` types include optional resolved properties for data that comes from joins, not the entity's own columns. These are typed as optional (`?`) since they may not always be populated (depends on which repository method fetched them).

**Resolved property map**:
| Entity ReturnType | Resolved Property | Source | Type |
|---|---|---|---|
| CertificateReturnType | `template?` | join to `certificateTemplates` | `CertificateTemplateReturnType \| null` |
| CertificateReturnType | `elements?` | join through template to `templateElements` | `TemplateElementReturnType[] \| null` |
| CertificateReturnType | `verification?` | join to `certificateVerifications` | `CertificateVerificationReturnType \| null` |
| CertificateTemplateReturnType | `elements?` | join to `templateElements` | `TemplateElementReturnType[] \| null` |
| CertificateTemplateReturnType | `variables?` | join to `templateVariables` | `TemplateVariableReturnType[] \| null` |
| CertificateTemplateReturnType | `category?` | join to `certificateCategories` | `CertificateCategoryReturnType \| null` |
| RecipientGroupReturnType | `items?` | join to `recipientGroupItems` | `RecipientGroupItemReturnType[] \| null` |
| RecipientGroupReturnType | `template?` | join to `certificateTemplates` | `CertificateTemplateReturnType \| null` |
| RecipientGroupItemReturnType | `variableValues?` | join to `recipientGroupItemVariableValues` | `Record<string, string \| number \| boolean \| null> \| null` |
| CertificateCategoryReturnType | `parent?` | self-join to `certificateCategories` | `CertificateCategoryReturnType \| null` |
| CertificateCategoryReturnType | `children?` | self-join to `certificateCategories` | `CertificateCategoryReturnType[] \| null` |
| CertificateCategoryReturnType | `templateCount?` | aggregate count | `number \| null` |

### 2.8 SubmitInput Design: Explicit Omit of System Fields

**Decision**: Each `SubmitInput` type is `Omit<{Entity}InsertType, <system fields>>`. System fields are: `id`, `createdAt`, `updatedAt`, `deletedAt`, and any auto-managed fields (e.g., `idempotencyKey`, `version`, `createdBy`, `updatedBy`, `issuedBy`).

**Rationale**: The `SubmitInput` represents what the API caller provides. System-managed fields are never accepted from the caller — they are set by the service layer (Plan 4). This matches the billing pattern: `InvoiceSubmitInput = Omit<InvoiceInsertType, "id" | "createdAt" | "updatedAt" | "deletedAt" | "idempotencyKey" | "version" | "createdByUserId" | "status" | "paidDate">` *(billing's actual column name is `createdByUserId` — left verbatim as the codebase reference; NOTE: certificate tables use the Siraj domain convention `createdBy`/`updatedBy`, NOT `createdByUserId` — see §3.1/§3.2)*.

**Per-entity SubmitInput omit map**:
| Entity | Omitted Fields | Notes |
|---|---|---|
| Certificate | `id`, `createdAt`, `updatedAt`, `deletedAt`, `idempotencyKey`, `createdBy`, `issuedBy`, `status`, `generationStatus`, `verificationCode`, `issuedAt`, `expiresAt`, `revokedAt`, `revokedReason`, `revokedBy`, `pdfStoragePath`, `pdfGeneratedAt`, `generationError` | All system/audit/audit-lifecycle fields set by the generation pipeline; `version`/`fileUrl`/`fileSize` were drift (no such columns). |
| CertificateTemplate | `id`, `createdAt`, `updatedAt`, `deletedAt`, `createdBy`, `updatedBy`, `status`, `version`, `parentId`, `publishedAt`, `slug`, `templateSchema`, `metadata` | Status set by lifecycle; version auto-incremented; `currentVersion`/`currentVersionId` were drift (no such column — version-chain anchor is `(slug, version)`). |
| TemplateElement | `id`, `createdAt`, `updatedAt`, `deletedAt`, `templateId` | templateId comes from the URL/parent, not the input body. |
| TemplateVariable | `id`, `createdAt`, `updatedAt`, `deletedAt`, `templateId` | Same as element. |
| CertificateCategory | `id`, `createdAt`, `updatedAt`, `deletedAt` | parentId IS included (caller sets parent). |
| RecipientGroup | `id`, `createdAt`, `updatedAt`, `deletedAt`, `createdBy`, `status` | createdBy set by service from auth context; status defaults to ACTIVE server-side. |
| RecipientGroupItem | `id`, `createdAt`, `updatedAt`, `deletedAt`, `groupId` | groupId comes from the parent URL. |
| CertificateVerification | N/A | Verifications are created internally by the generation pipeline, never submitted by callers. No SubmitInput. |

### 2.9 Filter, Sort, and Pagination Types

**Decision**: Each listable entity gets a filter type, sort type, and uses the shared cursor pagination types from `backend/types/shared/pagination.types.ts`.

**Listable entities**: Certificate, CertificateTemplate, CertificateCategory, RecipientGroup, CertificateVerification.

**Filter type pattern**: Each filter type is a flat interface with optional predicate fields. Nullable fields default to "no filter on this field". String fields use substring match (`ILIKE`). Date fields use range predicates (`from`/`to`). Enum fields use exact match.

**Filter type inventory**:
| Entity | Filter Type | Key Filter Fields |
|---|---|---|
| Certificate | `CertificateFilterInput` | `status?: CertificateStatus`, `studentId?: string`, `templateId?: string`, `recipientGroupId?: string`, `categoryId?: string`, `issuedAtFrom?: string`, `issuedAtTo?: string`, `search?: string` |
| CertificateTemplate | `TemplateFilterInput` | `status?: TemplateStatus`, `categoryId?: string`, `search?: string` |
| CertificateCategory | `CategoryFilterInput` | `parentId?: string \| null` (null = root categories only) |
| RecipientGroup | `RecipientGroupFilterInput` | `templateId?: string`, `search?: string` |
| CertificateVerification | `VerificationFilterInput` | `certificateId?: string`, `result?: CertificateVerificationResult`, `verifiedAtFrom?: string`, `verifiedAtTo?: string` |

**Sort type pattern**: Each entity gets a sort enum listing sortable columns and uses `OrderSortDirection` (existing `ASC`/`DESC` enum) for direction.

**Sort enum inventory**:
| Entity | Sort Enum | Sortable Columns |
|---|---|---|
| Certificate | `CertificateSortField` | `createdAt`, `issuedAt`, `studentName`, `templateName` |
| CertificateTemplate | `TemplateSortField` | `createdAt`, `updatedAt`, `name` |
| CertificateCategory | `CategorySortField` | `name`, `createdAt` |
| RecipientGroup | `RecipientGroupSortField` | `createdAt`, `name` |
| CertificateVerification | `VerificationSortField` | `verifiedAt` |

**Pagination types**: Reuse `PageInfo` from `backend/types/shared/pagination.types.ts`. Each listable entity's paginated result is `PaginatedResult<{Entity}ReturnType>` where `PaginatedResult<T> = { items: T[]; pageInfo: PageInfo; totalCount: number }`. If `PaginatedResult` does not already exist in shared types, define it in `backend/types/certificates/filter.types.ts` and export it; subsequent plans can import from there.

### 2.10 Permission Group Default Mappings

**Decision**: New AppPermission entries are assigned to existing system permission group slugs via default seed mappings. No new permission groups are created — the certificate feature uses existing role hierarchy.

**Permission group mapping matrix**:
| Permission Key | super_admin | academy_admin | staff_default | teacher_default | parent_default | student_default |
|---|---|---|---|---|---|---|
| `certificates.generate` | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| `certificates.manage` | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| `certificates.verify` | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| `certificates.view` | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| `certificates.revoke` | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| `certificates.bulk_generate` | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| `certificates.templates.manage` | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| `certificates.templates.publish` | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| `certificates.templates.view` | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| `certificates.categories.manage` | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| `certificates.recipient_groups.manage` | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
> *(Matrix mirrors the canonical 11 entries from requirements §4.1 REQ-PERM-001 exactly — no `recipient_groups.view`; that key was an earlier design invention with no corresponding `AppPermission` entry.)*


**Rationale**: Super admins and academy admins get full certificate management. Staff get view + verify (read-only access for support roles). Teachers can view templates and verify certificates (they need to confirm a student's certificate is valid). Parents and students have NO certificate permissions — parents and students access certificate data through student-scoped queries, not through certificate permissions directly. The public verification endpoint (`verifyCertificate`) has NO auth scope and does not require any permission.

### 2.11 i18n Namespace Design

**Decision**: The certificate feature owns translations under the `certificates` top-level namespace with sub-domains for permissions, enums, statuses, and errors. All translation keys are defined as typed function schemas in `shared/locale/` with implementations in `shared/locale/en/` and `shared/locale/ar/`.

**Namespace structure**:
| Namespace | File (type schema) | Purpose |
|---|---|---|
| `certificates.permissions` | Type schema `shared/locale/types/certificates/permissions.ts` + namespace registration `shared/locale/namespaces/certificates/permissions.ts` | Permission display labels (11 entries) |
| `certificates.enums` | `shared/locale/types/certificates/enums.ts` + `shared/locale/namespaces/certificates/enums.ts` | Enum display labels (11 enums × N values) |
| `certificates.statuses` | `shared/locale/types/certificates/statuses.ts` + `shared/locale/namespaces/certificates/statuses.ts` | Certificate status display labels |
| `certificates.errors.types` | `shared/locale/types/certificates/errors.types.ts` + `shared/locale/namespaces/certificates/errors.types.ts` | Type-level error messages |
| `certificates.errors.permissions` | `shared/locale/types/certificates/errors.permissions.ts` + `shared/locale/namespaces/certificates/errors.permissions.ts` | Permission-level error messages |

> **Reality-checked i18n layout** — the codebase uses per-domain SUB-DIRECTORIES, NOT flat `shared/locale/<domain>.<sub>.ts` files. Verified by inspecting existing structure: `shared/locale/{types,namespaces,en,ar}/{auth,common,dashboard,emails,errors,notifications,...}/`. The flat filename scheme proposed in the original design (`shared/locale/certificates.permissions.ts`) does NOT exist anywhere in the codebase — every locale layer organizes by domain sub-directory. Additionally: backend repo errors use the **single aggregate `ErrorsLabels` interface** at `shared/locale/types/errors/index.ts` (NOT per-domain type files) — see Plan 03 §11 for that backend errors integration; the `certificates.errors.*` namespaces defined here are for **frontend / service-layer message display**, not for backend repo parameter binding.

**Type schema pattern**: Each namespace file exports a TypeScript type (or const object typed against a schema interface) defining all keys as functions. Zero-arg keys are `() => string`. Parameterized keys are `(param: string) => string` or `(param: string, count: number) => string` for pluralization.

**English implementations**: Under `shared/locale/en/`, one file per namespace. Pluralization uses `one`/`other` CLDR forms. Values are template literal strings.

**Arabic implementations**: Under `shared/locale/ar/`, one file per namespace. Pluralization uses all 6 CLDR forms (`zero`, `one`, `two`, `few`, `many`, `other`) as required by the Arabic plural rules.

### 2.12 Barrel Export Registration

**Decision**: Two barrel registrations are required:
1. `backend/enum/index.ts` — add `export * from "./certificates";` to re-export certificate enums (verified pattern: existing barrel lines like `export * from "./billing"; export * from "./students";`)
2. `backend/types/index.ts` — add `export * from "./certificates";` to re-export certificate types (verified pattern: existing barrel lines like `export * from "./students"; export * from "./billing";`)

**Rationale**: The barrel pattern is mandatory in Siraj. All downstream consumers (repositories, services, Pothos) import from the top-level barrels (`@/backend/enum` and `@/backend/types`), not from deep paths. The barrel also serves as a compile-time check that all files in the sub-directory are syntactically valid. The sub-directory name used in the `export *` line MUST match the actual sub-directory name (`certificates`, not the abbreviated `cert`).

### 2.13 PG Enum Registration (Coordinator with Plan 1)

**Decision**: Plan 1 creates the PG enum columns in `backend/db/schema/enums.ts` using `createPgEnumFromEnum`. Plan 2 provides the TS enums. The TS enum definitions and the PG enum registrations must use the same string values.

**Coordination contract**: Plan 1's `enums.ts` will call `createPgEnumFromEnum("certificate_status", CertificateStatus)` where `CertificateStatus` is imported from `@/backend/enum/certificates/certificate.enum`. Plan 2 creates the TS enum first; Plan 1 references it. Since Plan 1 is a dependency, the TS enum files must be created before Plan 1's `enums.ts` can be updated. However, Plan 1 may use placeholder values until Plan 2 delivers the real enums. In practice, both plans are designed in parallel and the TS enum is the single source of truth.

### 2.14 AppPermission Enum Extension (Non-Breaking)

**Decision**: New permission entries are added to the existing `AppPermission` enum in `backend/enum/permissions/permission.enum.ts`. This is a non-breaking additive change — existing entries remain unchanged, and new entries are appended.

**Rationale**: The `AppPermission` enum is already registered as a PG enum (`app_permission`). Adding new values to a TS enum requires a corresponding PG enum migration to add the new values. Plan 1 handles the PG enum migration; Plan 2 handles the TS enum extension. The `filterKnownAppPermissions` helper automatically picks up new values from `Object.values(AppPermission)`.

**New entries** (canonical — match requirements §4.1 REQ-PERM-001; authoritative §5.1 lists the same 11 with descriptions):
| Enum Key | Enum Value (dot-path) |
|---|---|
| `CERTIFICATES_VIEW` | `certificates.view` |
| `CERTIFICATES_MANAGE` | `certificates.manage` |
| `CERTIFICATES_REVOKE` | `certificates.revoke` |
| `CERTIFICATES_VERIFY` | `certificates.verify` |
| `CERTIFICATES_TEMPLATES_VIEW` | `certificates.templates.view` |
| `CERTIFICATES_TEMPLATES_MANAGE` | `certificates.templates.manage` |
| `CERTIFICATES_TEMPLATES_PUBLISH` | `certificates.templates.publish` |
| `CERTIFICATES_CATEGORIES_MANAGE` | `certificates.categories.manage` |
| `CERTIFICATES_RECIPIENT_GROUPS_MANAGE` | `certificates.recipient_groups.manage` |
| `CERTIFICATES_GENERATE` | `certificates.generate` |
| `CERTIFICATES_BULK_GENERATE` | `certificates.bulk_generate` |

---

## 3. Interface Specifications

### 3.1 Certificate Types (`backend/types/certificates/certificate.types.ts`)

#### `CertificateSelectType`

**Source**: `typeof certificates.$inferSelect` (import from `@/backend/db/schema`)
**Shape**: All columns of the `certificates` table, with PG enum columns typed as `string` (raw inference).
**Usage**: Consumed by `CertificateRepository` (Plan 3) for raw row typing.

#### `CertificateInsertType`

**Source**: `typeof certificates.$inferInsert`
**Shape**: All columns of the `certificates` table, with optional fields marked as `?`. PG enum columns typed as `string`.
**Usage**: Used internally by the repository for `db.insert(certificates).values(...)`.

#### `CertificateReturnType`

**Construction**: `Omit<CertificateSelectType, "deletedAt" | "idempotencyKey"> & { ... }`  *(Note: Plan 0 certificate schema names the FK `createdBy` / `issuedBy`, NOT `createdByUserId` — the Omit set reflects Plan 0's actual column names; the earlier `createdByUserId` reference was column-name drift that would break `$inferSelect` typing.)*
**Re-applied enums**:
- `status: CertificateStatus` (replaces raw `string`)
- `generationStatus: CertificateGenerationStatus` (replaces raw `string`)
**Resolved properties** (optional):
- `template?: CertificateTemplateReturnType | null`
- `elements?: TemplateElementReturnType[] | null`
- `verification?: CertificateVerificationReturnType | null`
**Usage**: Returned by `CertificateRepository.findById`, consumed by services (Plan 4) and Pothos object ref (Plan 5).

#### `CertificateSubmitInput`

**Construction**: `Omit<CertificateInsertType, "id" | "createdAt" | "updatedAt" | "deletedAt" | "idempotencyKey" | "createdBy" | "issuedBy" | "status" | "generationStatus" | "verificationCode" | "issuedAt" | "expiresAt" | "revokedAt" | "revokedReason" | "revokedBy" | "pdfStoragePath" | "pdfGeneratedAt" | "generationError">`  *(Inferred columns dropped until `certificates.$inferInsert` reflects all real Plan 01 columns: `fileUrl`/`fileSize`/`version`/`createdByUserId` do NOT exist on this table — those were drift.)*
**Shape**: Only caller-provided fields: `templateId`, `studentId`, `recipientGroupId` (nullable for single-issue, set for bulk), `variableValues` (jsonb snapshot override — nullable), `idempotencyKey` (nullable, client-supplied dedup key for retries). Recipient name/email live on the `students` join (the certificate does NOT store `recipientName`/`recipientEmail` directly — Plan 01 schema resolves them through `studentId` → `students.name`/`students.email`); `expiryDate` is NOT a `certificates` column (expiry is derived at issue time from the template's `defaultValidityPeriod` — see Plan 04); `resolution` is NOT a certificate column/enum — removed.
**Usage**: Pothos input ref (Plan 5), Zod validation in service (Plan 4).

### 3.2 Template Types (`backend/types/certificates/template.types.ts`)

#### `CertificateTemplateSelectType`

**Source**: `typeof certificateTemplates.$inferSelect`

#### `CertificateTemplateInsertType`

**Source**: `typeof certificateTemplates.$inferInsert`

#### `CertificateTemplateReturnType`

**Construction**: `Omit<CertificateTemplateSelectType, "deletedAt" | "createdBy" | "updatedBy"> & { ... }`  *(Plan 01 `certificate_templates` columns are `createdBy`/`updatedBy` uuid FKs to `users.id` — NOT `createdByUserId`; the `currentVersion`/`currentVersionId` field is also column drift — version-chain state is expressed via the self-ref `parentId` + `(slug, version)` unique index, not a `currentVersion` column.)*
**Re-applied enums**:
- `status: CertificateTemplateStatus`
- `orientation: CertificateOrientation`
- `backgroundType: CertificateBackgroundType`
**Resolved properties**:
- `elements?: TemplateElementReturnType[] | null`
- `variables?: TemplateVariableReturnType[] | null`
- `category?: CertificateCategoryReturnType | null`

#### `CertificateTemplateSubmitInput`

**Omitted**: `id`, `createdAt`, `updatedAt`, `deletedAt`, `createdBy`, `updatedBy`, `status`, `version`, `parentId`, `publishedAt`, `slug` (system-generated), `templateSchema`, `metadata`
**Shape**: `name`, `nameAr` (nullable), `description`, `descriptionAr` (nullable), `categoryId` (nullable), `orientation`, `width`, `height`, `backgroundType`, `backgroundColor` (nullable), `backgroundImageId` (nullable), `fontFamily`, `fontColor` (nullable), `fontSize` (nullable), `titleText`, `titleTextAr` (nullable), `defaultValidityPeriod` (nullable).  *(Real column names per Plan 01 REQ-01-020: `width`/`height` not `widthPx`/`heightPx`; `backgroundImageId` not `backgroundImageUrl`/`backgroundImageStorageId`; `fontFamily` is the canonical column name.)*

> **REMOVED — `template_versions` table does NOT exist in Plan 01.** Version history on `certificate_templates` is expressed via the self-referential `parentId` chain + the `(slug, version)` unique index (Plan 01). There is no separate `templateVersions` table — drop this type entirely. If a version-snapshot projection is needed, derive it from `with: { childVersions: true }` on `certificateTemplates` (Plan 01 relation §6.2 `childVersions`).

### 3.3 Template Element Types (`backend/types/certificates/template-element.types.ts`)

#### `TemplateElementSelectType`

**Source**: `typeof templateElements.$inferSelect`

#### `TemplateElementInsertType`

**Source**: `typeof templateElements.$inferInsert`

#### `TemplateElementReturnType`

**Construction**: `Omit<TemplateElementSelectType, "deletedAt"> & { ... }`
**Re-applied enums**:
- `type: TemplateElementType`
  *(The invented `source: TemplateElementSource` enum does NOT exist in Plan 01 — element placement uses `x`, `y`, `zIndex`, `rotation`, `width`, `height`, `fontSize`, `color`, `alignment`, `fontFamily`, `content`, `variableId`, `properties` columns directly; there is no `source` column. Removed.)*
**Resolved properties**: `templateName?: string | null` (optional, from template join — used by element list screens).

#### `TemplateElementSubmitInput`

**Omitted**: `id`, `createdAt`, `updatedAt`, `templateId` (no `deletedAt` on a CASCADE-deleted child table)
**Shape**: `type`, `label`, `x`, `y`, `zIndex`, `rotation`, `width`, `height`, `fontSize`, `color`, `alignment`, `fontFamily`, `content` (nullable), `variableId` (nullable, SET NULL on delete), `properties` (JSONB, nullable — element-specific config for image/qr_code/shape types per Plan 01 REQ-01-046/047).

### 3.4 Template Variable Types (`backend/types/certificates/template-variable.types.ts`)

#### `TemplateVariableSelectType`

**Source**: `typeof templateVariables.$inferSelect`

#### `TemplateVariableInsertType`

**Source**: `typeof templateVariables.$inferInsert`

#### `TemplateVariableReturnType`

**Construction**: `Omit<TemplateVariableSelectType, "deletedAt"> & { ... }`
**Re-applied enums**:
- `type: TemplateVariableType`
**Resolved properties**: None.

#### `TemplateVariableSubmitInput`

**Omitted**: `id`, `createdAt`, `updatedAt`, `deletedAt`, `templateId`
**Shape**: `key`, `label`, `type`, `defaultValue`, `options` (string array for select type), `isRequired`.

### 3.5 Category Types (`backend/types/certificates/category.types.ts`)

#### `CategorySelectType`

**Source**: `typeof certificateCategories.$inferSelect`

#### `CategoryInsertType`

**Source**: `typeof certificateCategories.$inferInsert`

#### `CertificateCategoryReturnType`

**Construction**: `Omit<CategorySelectType, "deletedAt"> & { ... }`
**Resolved properties**:
- `parent?: CertificateCategoryReturnType | null`
- `children?: CertificateCategoryReturnType[] | null`
- `templateCount?: number | null`
**No re-applied enums** (categories have no enum columns).

#### `CategorySubmitInput`

**Omitted**: `id`, `createdAt`, `updatedAt`, `deletedAt`
**Shape**: `name`, `parentId` (nullable, for root categories), `displayOrder`.

#### `CategoryTreeNodeType`

**Construction**: `CertificateCategoryReturnType & { children: CategoryTreeNodeType[] }`
**Purpose**: Used by `getTree` query to represent the nested category hierarchy.
**Usage**: Returned by `CategoryService.getTree()` (Plan 4) and the `certificateCategories` query (Plan 5).

### 3.6 Recipient Group Types (`backend/types/certificates/recipient-group.types.ts`)

#### `RecipientGroupSelectType`

**Source**: `typeof recipientGroups.$inferSelect`

#### `RecipientGroupInsertType`

**Source**: `typeof recipientGroups.$inferInsert`

#### `RecipientGroupReturnType`

**Construction**: `Omit<RecipientGroupSelectType, "deletedAt" | "createdBy"> & { ... }`  *(FK is `createdBy` → `users.id`, not `createdByUserId` — Plan 01 REQ-01-080.)*
**Re-applied enums**:
- `status: CertificateRecipientGroupStatus`
**Resolved properties**:
- `items?: RecipientGroupItemReturnType[] | null`
- `template?: CertificateTemplateReturnType | null`

#### `RecipientGroupSubmitInput`

**Omitted**: `id`, `createdAt`, `updatedAt`, `deletedAt`, `createdBy`, `status` (service-managed lifecycle)
**Shape**: `name`, `templateId`, `description`. *(`status` defaults to `ACTIVE` server-side.)*

#### `RecipientGroupItemSelectType`

**Source**: `typeof recipientGroupItems.$inferSelect`

#### `RecipientGroupItemReturnType`

**Construction**: `Omit<RecipientGroupItemSelectType, "deletedAt"> & { ... }`
**Re-applied enums**:
- `status: CertificateRecipientItemStatus`
**Resolved properties**:
- `student?: StudentReturnType | null` (from `students` join — Plan 01 relation `student`)
- `variableValues?: Record<string, string | number | boolean | null> | null` (from the `recipient_group_item_variable_values` junction table)

#### `RecipientGroupItemSubmitInput`

**Omitted**: `id`, `createdAt`, `updatedAt`, `deletedAt` (CASCADE child has no `deletedAt`), `groupId`, `status`, `certificateId` (server-managed)
**Shape**: `studentId`. *(Variable values are submitted via a separate `RecipientGroupItemVariableValueSubmitInput` keyed by `(groupItemId, variableId)` — see Plan 04; not flattened into the item input.)*

### 3.7 Verification Types (`backend/types/certificates/verification.types.ts`)

#### `CertificateVerificationSelectType`

**Source**: `typeof certificateVerifications.$inferSelect`

#### `CertificateVerificationReturnType`

**Construction**: `Omit<CertificateVerificationSelectType, "deletedAt"> & { ... }`
**Re-applied enums**:
- `verificationMethod: CertificateVerificationMethod`
- `verificationResult: CertificateVerificationResult`  *(Column names per Plan 01 REQ-01-130: `verificationMethod` and `verificationResult` — the earlier short `result` field name was drift; `CertificateVerificationResult` is the canonical enum name.)*
**Resolved properties**: None (verification logs are flat records).

**No SubmitInput**: Verifications are created internally by the generation pipeline (Plan 4). No external input type.

#### `PublicVerificationResultType`

**Purpose**: The return type of the public `verifyCertificate` query (Plan 5). Contains only public-safe fields — no internal IDs, no user IDs, no audit data.
**Shape**:
- `certificateHolderName: string`
- `templateName: string`
- `issueDate: string` (ISO 8601)
- `expiryDate: string | null`
- `effectiveStatus: "valid" | "revoked" | "expired"` (plain string union, not an enum — the public API uses a simplified status)
- `revocationReason: string | null`
- `verifiedAt: string` (ISO timestamp)

**Rationale for plain string union**: The public verification endpoint is consumed by external verifiers (employers, institutions) who don't have access to the GraphQL enum types. A plain string union in the type definition is clearer for external consumers and doesn't require enum registration in Pothos (Plan 5 registers it as a separate `CertificateVerificationStatus` enum for the GraphQL surface).

### 3.8 Generation Types (`backend/types/certificates/generation.types.ts`)

#### `GenerateCertificateInput`

**Shape**:
- `templateId: string`
- `studentId: string | null` (null for ad-hoc; resolved name/email via `students.name`/`students.email` join — there is NO `recipientName`/`recipientEmail` column on `certificates`)
- `recipientGroupId: string | null` (when generating as part of a batch)
- `variableValues: Record<string, string | number | boolean | null>`
- `userId: string` (the caller, for permission check — maps to `certificates.createdBy`)
- `idempotencyKey: string | null` (client dedup key — Plan 03 REQ-CERT-001)

> **Removed drift**: `recipientName`/`recipientEmail` (no such columns on `certificates` — Resolve via `studentId` → `students`); `expiryDate` (NOT a `certificates` column — derived at issue time from `certificate_templates.defaultValidityPeriod`, computed into `certificates.expiresAt` server-side).

**Usage**: Consumed by `CertificateGenerationService.generateCertificate` (Plan 4).

#### `GenerateBatchInput`

**Shape**:
- `templateId: string`
- `recipientGroupId: string`
- `userId: string`

**Usage**: Consumed by `CertificateBatchService.generateBatch` (Plan 4).

#### `BatchGenerationResultType`

**Shape**:
- `total: number`
- `succeeded: number`
- `failed: number`
- `alreadyExisted: number`
- `failures: { recipientId: string; reason: string }[]`

**Usage**: Returned by `CertificateBatchService.generateBatch` (Plan 4), surfaced via Pothos object ref (Plan 5).

### 3.9 Filter & Sort Types (`backend/types/certificates/filter.types.ts`)

#### `CertificateFilterInput`

**Shape**: `{ status?: CertificateStatus; studentId?: string; templateId?: string; recipientGroupId?: string; categoryId?: string; issuedAtFrom?: string; issuedAtTo?: string; search?: string }`

#### `TemplateFilterInput`

**Shape**: `{ status?: TemplateStatus; categoryId?: string; search?: string }`

#### `CategoryFilterInput`

**Shape**: `{ parentId?: string | null }` (null = root categories only, undefined = all)

#### `RecipientGroupFilterInput`

**Shape**: `{ templateId?: string; search?: string }`

#### `VerificationFilterInput`

**Shape**: `{ certificateId?: string; result?: CertificateVerificationResult; verifiedAtFrom?: string; verifiedAtTo?: string }`

#### Sort Enums

Each sort enum is a TypeScript enum with one entry per sortable column:
- `CertificateSortField { CREATED_AT = "created_at"; ISSUED_AT = "issued_at"; STUDENT_NAME = "student_name"; TEMPLATE_NAME = "template_name" }`
- `TemplateSortField { CREATED_AT = "created_at"; UPDATED_AT = "updated_at"; NAME = "name" }`
- `CategorySortField { NAME = "name"; CREATED_AT = "created_at" }`
- `RecipientGroupSortField { CREATED_AT = "created_at"; NAME = "name" }`
- `VerificationSortField { VERIFIED_AT = "verified_at" }`

#### `PaginatedResult<T>`

**Shape**: `{ items: T[]; pageInfo: PageInfo; totalCount: number }`
**Usage**: Generic pagination wrapper imported from `backend/types/shared/pagination.types.ts` if already defined there; otherwise defined here and exported for cert-specific use. The `PageInfo` type (`{ hasNextPage: boolean; hasPreviousPage: boolean; endCursor: string | null; startCursor: string | null }`) comes from the shared pagination types.

---

## 4. Enum Definitions

### 4.1 Certificate Lifecycle Enums (`backend/enum/certificates/certificate.enum.ts`)

> **Canonical source of truth**: the 11 enum definitions below mirror Plan 01 requirements §3.1 (REQ-01-150) verbatim in **name, casing, and values**. The earlier design variants (`TemplateStatus`/`VerificationResult` short names, invented `CertificateResolution` and `TemplateElementSource` enums, drifted element/variable value sets, lowercase-vs-uppercase) are SUPERSEDED — typings on `ReturnType` (`reApplyEnums`) and on the PG enum registry in Plan 01's `enums.ts` MUST reference these exact TS enum names so that `createPgEnumFromEnum("snake_case", <Enum>)` derives `Object.values(<Enum>)` consistently. Casing note: TS enum KEYS are `UPPER_SNAKE`, VALUES are lowercase-snake (matching the pgEnum values); this is internally consistent across the 11 enums even though some legacy Siraj enums (e.g. `StudentStatus`) use UPPER values — both conventions coexist in the codebase, the.helper `createPgEnumFromEnum` derives from `Object.values`.

#### `CertificateTemplateStatus`

| Key | Value |
|---|---|
| `DRAFT` | `draft` |
| `REVIEW` | `review` |
| `PUBLISHED` | `published` |
| `ARCHIVED` | `archived` |

#### `CertificateOrientation`

| Key | Value |
|---|---|
| `LANDSCAPE` | `landscape` |
| `PORTRAIT` | `portrait` |

#### `CertificateBackgroundType`

| Key | Value |
|---|---|
| `COLOR` | `color` |
| `IMAGE` | `image` |
| `GRADIENT` | `gradient` |

#### `TemplateElementType`

| Key | Value |
|---|---|
| `STATIC_TEXT` | `static_text` |
| `DATA_TEXT` | `data_text` |
| `DATA_DATE` | `data_date` |
| `IMAGE` | `image` |
| `QR_CODE` | `qr_code` |
| `SHAPE` | `shape` |

#### `TemplateVariableType`

| Key | Value |
|---|---|
| `TEXT` | `text` |
| `NUMBER` | `number` |
| `DATE` | `date` |
| `SELECT` | `select` |

#### `CertificateRecipientGroupStatus`

| Key | Value |
|---|---|
| `ACTIVE` | `active` |
| `INACTIVE` | `inactive` |
| `COMPLETED` | `completed` |

#### `CertificateRecipientItemStatus`

| Key | Value |
|---|---|
| `PENDING` | `pending` |
| `PROCESSING` | `processing` |
| `ISSUED` | `issued` |
| `FAILED` | `failed` |
| `SKIPPED` | `skipped` |

#### `CertificateStatus`

| Key | Value |
|---|---|
| `DRAFT` | `draft` |
| `PENDING` | `pending` |
| `ISSUED` | `issued` |
| `REVOKED` | `revoked` |
| `EXPIRED` | `expired` |

#### `CertificateGenerationStatus`

| Key | Value |
|---|---|
| `PENDING` | `pending` |
| `PROCESSING` | `processing` |
| `COMPLETED` | `completed` |
| `FAILED` | `failed` |

#### `CertificateVerificationMethod`

| Key | Value |
|---|---|
| `QR_CODE` | `qr_code` |
| `LINK` | `link` |
| `MANUAL` | `manual` |

#### `CertificateVerificationResult`

| Key | Value |
|---|---|
| `VALID` | `valid` |
| `INVALID` | `invalid` |
| `REVOKED` | `revoked` |
| `EXPIRED` | `expired` |
| `NOT_FOUND` | `not_found` |

#### `FontFamily` (TS-only union, NOT a pgEnum)

> Per Plan 01 REQ-01-020, `certificate_templates.fontFamily` is a plain `text` column with default `'Cairo'`. There is **no** `font_family` pgEnum in Plan 01's registry. Plan 02 therefore defines a *TypeScript union* (not an `enum` consumed by `createPgEnumFromEnum`) to constrain the values client-side; the column stays `text` for forward-compatibility and to avoid a costly `ALTER TYPE` migration each time a font is added.
> ```ts
> export type FontFamily = "Amiri" | "Cairo" | "Tajawal" | "Noto Naskh" | "Inter" | "Roboto" | "System Default";
> ```

#### Status-transition const objects (alongside the enums, same file)

- `ALLOWED_TEMPLATE_STATUS_TRANSITIONS: Record<CertificateTemplateStatus, CertificateTemplateStatus[]>`
  - `DRAFT → REVIEW | PUBLISHED`; `REVIEW → PUBLISHED | DRAFT`; `PUBLISHED → ARCHIVED`; `ARCHIVED → DRAFT` (reactivate).  Matches Plan 01 CHECK requirements REQ-01-026/027.
- `ALLOWED_STATUS_TRANSITIONS: Record<CertificateStatus, CertificateStatus[]>`
  - `DRAFT → PENDING`; `PENDING → ISSUED | FAILED`; `ISSUED → REVOKED | EXPIRED`; `REVOKED →` (terminal); `EXPIRED →` (terminal). Matches Plan 01 CHECK REQ-01-117..121.

### 4.3 Enum Display Labels — IN i18n, NOT co-located in enum files

> **Reality-checked**: TS enum files in `backend/enum/certificates/certificate.enum.ts` contain ONLY the `enum` definitions above plus the `ALLOWED_*_TRANSITIONS` const objects — NO inline Arabic/English display metadata is permitted in `backend/enum/` (verified pattern: `backend/enum/students/student-lifecycle.enum.ts` is bare; `backend/enum/AGENTS.md` forbids inline i18n). The enum display labels for all 11 enums (cover every value across all 11 enums) live exclusively in the i18n system described in §2.11:

1. **Frontend display**: the `certificates.enums` sub-namespace (see §2.11) — typed function schemas in `shared/locale/types/certificates/enums.ts` + implementations in `shared/locale/en/certificates/enums.ts` and `shared/locale/ar/certificates/enums.ts`. One key per `(enum,value)` pair (e.g. `certificates.enums.certificate_status.draft`, `certificates.enums.template_status.review`).
2. **Permission seed data** (Plan 01) reads display metadata from the `permissions` DB row's `description`/`category` `LocalizedString` JSONB columns — NOT from the TS enum files. The taxonomy that maps each enum value to a `permissions` row is the `permissions` seed migration, not the enum source.
3. **Error messages** reference enum values by their token (stable enum value string), and resolve a human display name via the i18n `certificates.enums.*` namespace at render time. Do NOT bake display strings into error throw sites.

---


## 5. Permission Definitions

### 5.1 AppPermission Extension

The existing `AppPermission` enum in `backend/enum/permissions/permission.enum.ts` is extended with 11 new entries. The extension is additive — no existing entries are modified or removed.

**New entries** (appended after existing entries — canonical per requirements §4.1 REQ-PERM-001, all rooted under the `certificates.*` namespace to match the verified Siraj dot-path convention `entity.action` / `entity.subentity.action`, e.g. `billing.create_invoice`, `students.edit`):

| Enum Key | Value | Description for `permissions` table |
|---|---|---|
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

### 5.2 Permission Seed Data

Each new permission entry must have a row in the `permissions` table with:
- `key`: the dot-path value (e.g., `certificates.generate` — canonical `certificates.*` root, see §5.1)
- `description`: JSONB `LocalizedString` with `ar` and `en` keys sourced from the i18n `certificates.permissions` namespace (see §2.11). The value parsed by `key` is the literal `AppPermission` enum string (the `permissions` table uses the dot-path as the natural key — see verified `backend/db/schema/permissions/permissions.ts`; there is no separate `resource`/`action` column — that was an earlier design invention).
- `category`: JSONB `LocalizedString` with the permission category display name (`certificates.*` / `certificates.templates.*` / `certificates.categories.*` / `certificates.recipient_groups.*` / `certificates.generate, certificates.bulk_generate` — five categories per requirements §5).
- `isSystem`: `true` (all certificate permissions are system permissions)

### 5.3 Permission Group Default Mappings

The `permission_groups` table (seeded in Plan 1) maps system group slugs to their default permission keys. The certificate permissions are added to existing groups via seed updates:

| System Group Slug | Added Permissions |
|---|---|
| `super_admin` | All 11 certificate permissions |
| `academy_admin` | All 11 certificate permissions |
| `staff_default` | `certificates.verify`, `certificates.view`, `certificates.templates.view` |
| `teacher_default` | `certificates.verify`, `certificates.view`, `certificates.templates.view` |
| `parent_default` | (none) |
| `student_default` | (none) |

**Implementation**: Plan 1's seed scripts are updated to include these mappings. Plan 2 provides the permission keys (this plan) and the i18n labels for the display names. The seed data update is a coordination point between Plan 1 and Plan 2.

### 5.4 Permission Hierarchy Rules

- `certificates.manage` implies `certificates.view` (manage grants view).
- `certificates.bulk_generate` implies `certificates.generate` (bulk grants single).
- `certificates.manage` does NOT imply `certificates.revoke` — revocation is a separate destructive action.
- `certificates.templates.manage` implies `certificates.templates.view`.
> The invented `recipient_group.view` permission has NO corresponding `AppPermission` entry (see requirements §4.1 — recipient groups have only `certificates.recipient_groups.manage`); therefore this implication rule is removed. `certificates.recipient_groups.manage` is granted directly to roles that need it.
- Super admins (`isSuperAdmin: true`) bypass all permission checks (handled by the ScopeAuth plugin: `ctx.isSuperAdmin || ctx.permissions.includes(key)`).

---

## 6. i18n Design

### 6.1 Type Schema Files

Each i18n namespace has a type schema file in `shared/locale/` that defines the shape (function signatures per key). These are consumed by `getServerTranslations` and `useAppTranslation` to provide compile-time type safety.

#### `shared/locale/types/certificates/permissions.ts` (type schema) + `shared/locale/namespaces/certificates/permissions.ts` (namespace registration)

**Exported type**: `CertificatePermissionLabels`
**Keys** (11 entries, one per permission):
- Each key is `() => string` (no parameters needed — permission labels are static strings).
- Key naming: `certGenerate`, `certManage`, `certVerify`, `certView`, `certRevoke`, `certBatchGenerate`, `templateManage`, `templateView`, `categoryManage`, `recipientGroupManage`, `recipientGroupView`.
- Each function returns a localized display name for the permission (e.g., "Generate Certificates" / "إنشاء الشهادات").

#### `shared/locale/types/certificates/enums.ts` + `shared/locale/namespaces/certificates/enums.ts`

**Exported type**: `CertificateEnumLabels`
**Keys**: One key per enum value, grouped by enum. All keys are `() => string`.
- `certificateStatusPending`, `certificateStatusIssued`, `certificateStatusRevoked`, `certificateStatusExpired`, `certificateStatusFailed`
- `certificateResolutionLow`, `certificateResolutionMedium`, `certificateResolutionHigh`, `certificateResolutionArchival`
- `verificationResultValid`, `verificationResultRevoked`, `verificationResultExpired`, `verificationResultNotFound`
- `templateStatusDraft`, `templateStatusPublished`, `templateStatusArchived`
- `templateElementTypeText`, `templateElementTypeImage`, `templateElementTypeSignature`, `templateElementTypeQrCode`, `templateElementTypeBorder`, `templateElementTypeDateTime`
- `templateElementSourceStudent`, `templateElementSourceVariable`, `templateElementSourceCertificate`
- `templateVariableTypeText`, `templateVariableTypeNumber`, `templateVariableTypeDate`, `templateVariableTypeBoolean`, `templateVariableTypeSelect`
- `templateOrientationLandscape`, `templateOrientationPortrait`

#### `shared/locale/types/certificates/statuses.ts` + `shared/locale/namespaces/certificates/statuses.ts`

**Exported type**: `CertificateStatusLabels`
**Keys**: Status display labels for UI components showing certificate status badges.
- `pending`, `issued`, `revoked`, `expired`, `failed` — each `() => string`.
- These differ from enum labels in that they are user-facing display strings (e.g., "Pending" vs the technical "pending" enum value label).

#### `shared/locale/types/certificates/errors.permissions.ts` + `shared/locale/namespaces/certificates/errors.permissions.ts`

**Exported type**: `CertificatePermissionErrors`
**Keys**: Permission-related error messages.
- `insufficientPermissions: (permission: string) => string` — "You do not have permission to {permission}" / "ليس لديك صلاحية {permission}"
- `permissionDenied: () => string` — generic denial
- `cannotRevokeWithoutReason: () => string` — revocation requires a reason

#### `shared/locale/types/certificates/errors.types.ts` + `shared/locale/namespaces/certificates/errors.types.ts`

**Exported type**: `CertificateTypeErrors`
**Keys**: Type validation error messages used when types are misused or invalid.
- `invalidCertificateStatus: (status: string) => string` — "Invalid certificate status: {status}"
- `invalidTemplateStatus: (status: string) => string`
- `invalidElementType: (type: string) => string`
- `invalidVariableType: (type: string) => string`
- `invalidResolution: (resolution: string) => string`
- `invalidVerificationResult: (result: string) => string`

### 6.2 English Implementations (`shared/locale/en/`)

One implementation file per namespace, matching the type schema signatures:
- `shared/locale/en/certificates/permissions.ts` — returns English strings.
- `shared/locale/en/certificates/enums.ts` — returns English enum labels.
- `shared/locale/en/certificates/statuses.ts` — returns English status labels.
- `shared/locale/en/certificates/errors.permissions.ts` — returns English error messages with interpolation.
- `shared/locale/en/certificates/errors.types.ts` — returns English type error messages.

> **Reality-checked**: verified existing English locale impls are organized per-domain under `shared/locale/en/{auth,common,dashboard,emails,errors,notifications,...}/`. There is no flat-file layout.

### 6.3 Arabic Implementations (`shared/locale/ar/`)

Mirror the English implementations with Arabic translations:
- `shared/locale/ar/certificates/permissions.ts`
- `shared/locale/ar/certificates/enums.ts`
- `shared/locale/ar/certificates/statuses.ts`
- `shared/locale/ar/certificates/errors.permissions.ts`
- `shared/locale/ar/certificates/errors.types.ts`

### 6.4 Namespace Registration

The compile-time i18n system requires each namespace to be registered in the central locale configuration. The certificate namespaces are added to:
- `shared/locale/namespaces/index.ts` — register the new certificate namespaces via `defineNamespace` (`shared/locale/namespaces/define-namespace.ts` — verified: uses `defineNamespace(id, { load: { en, ar } })` registration pattern mirroring existing namespaces like `auth`, `common`, `errors`).
- `shared/locale/types/index.ts` (the central type registry) — re-export the new certificate type schemas.
- The server-side `getServerTranslations(locale)` and client `useAppTranslation()` must be able to resolve `certificates.permissions`, `certificates.enums`, etc. as valid namespaces.

**Coordination**: This plan adds the namespace type schemas and locale implementations. The central locale registration is a shared infrastructure file — Plan 2 adds the cert namespaces alongside existing ones. The implementation must verify no key conflicts with existing namespaces.

---

## 7. Error Handling Design

### 7.1 Type-Level Errors

Type-level errors occur when:
1. An invalid enum value is provided to a type cast (caught at compile time by TypeScript).
2. A required field is missing from a `SubmitInput` (caught at compile time).
3. A filter field has the wrong type (caught at compile time).

These are compile-time errors and do not need runtime error messages. The i18n `certificates.errors.types` namespace is for runtime type validation failures (e.g., when parsing external JSON or validating Zod output in Plan 4).

### 7.2 Permission-Level Errors

Permission errors are runtime errors thrown by services (Plan 4) when a user lacks required permissions. The error message uses `certificates.errors.permissions` namespace keys.

**Pattern**: Services receive `tErrors: CertificatePermissionErrors` (bound to the user's locale) and throw `Error(tErrors.insufficientPermissions(tPermissions.certGenerate()))` where `tPermissions` is from the `certificates.permissions` namespace.

**Rationale**: This matches the existing Siraj pattern where services receive localized error functions as explicit parameters, keeping them SSR-safe and testable. The service never imports translation functions directly — it receives them from the caller.

### 7.3 No GraphQLError in Types Layer

The types layer does not throw errors. It provides type definitions only. Errors are thrown at the service layer (Plan 4) and propagated through the GraphQL resolver layer (Plan 5). The types layer's only error surface is the i18n error key schemas, which define the shape of error messages but do not throw them.

---

## 8. Data Model References

### 8.1 Plan 1 Schema Dependencies

This plan depends on the following tables and PG enums from Plan 1:

**Tables**:
- `certificates` — provides `$inferSelect` and `$inferInsert` for `CertificateSelectType`/`CertificateInsertType`
- `certificateTemplates` — for template types
- `templateElements` — for element types
- `templateVariables` — for variable types
- *(removed `templateVersions` — there is no `template_versions` table in Plan 01; version-chain state lives on `certificate_templates` via the self-ref `parentId` + `(slug, version)` unique index)*
- `certificateCategories` — for category types
- `recipientGroups` — for recipient group types
- `recipientGroupItems` — for group item types
- `recipientGroupItemVariableValues` — for variable value map (junction table)
- `certificateVerifications` — for verification types

**PG Enums** (from `backend/db/schema/enums.ts` — the canonical 11 registered via `createPgEnumFromEnum`; matches Plan 01 requirements §3.1 REQ-01-150 exactly):
- `certificate_template_status` — `CertificateTemplateStatus`
- `certificate_orientation` — `CertificateOrientation`
- `certificate_background_type` — `CertificateBackgroundType`
- `certificate_element_type` — `TemplateElementType`
- `certificate_variable_type` — `TemplateVariableType`
- `certificate_recipient_group_status` — `CertificateRecipientGroupStatus`
- `certificate_recipient_item_status` — `CertificateRecipientItemStatus`
- `certificate_status` — `CertificateStatus`
- `certificate_generation_status` — `CertificateGenerationStatus`
- `certificate_verification_method` — `CertificateVerificationMethod`
- `certificate_verification_result` — `CertificateVerificationResult`
- `app_permission` — extended with 11 new values

> **Removed**: the invented `certificate_resolution` and `template_element_source` enums (no such columns/enums in Plan 01) and the short `template_status`/`template_orientation`/`template_element_type` PG-enum names (all real PG enums in Plan 01 use the `certificate_` prefix per REQ-01-152; matched names above).

### 8.2 Cross-Plan Type Flow

| Plan | Consumes from Plan 2 | Produces for Plan 2 |
|---|---|---|
| Plan 1 (DB Schema) | TS enums (for PG enum creation) | Drizzle table definitions (for $inferSelect/$inferInsert) |
| Plan 3 (Repository) | SelectType, InsertType, ReturnType, Filter types | Repository methods return ReturnType shapes |
| Plan 4 (Services) | ReturnType, SubmitInput, Generate types, Permission checks | Service methods return ReturnType |
| Plan 5 (GraphQL) | ReturnType, SubmitInput, Enum registrations, AppPermission keys | GraphQL schema (codegen) |

---

## 9. AGENTS.md References

### 9.1 Applicable AGENTS.md Files

| File | Rules Applied |
|---|---|
| `AGENTS.md` (root) | Path aliases (`@/*`), logging rules, i18n rules (compile-time TS system), type definition pattern |
| `backend/types/AGENTS.md` | Single Canonical Object Type Pattern, naming convention (`{Entity}SelectType`/`InsertType`/`ReturnType`/`SubmitInput`), `Omit`-and-extend contract, barrel export pattern |
| `backend/enum/AGENTS.md` | One enum file per logical domain, TS `enum` (not const objects), `createPgEnumFromEnum` mapping, GraphQL enum registration guidance, barrel export pattern |
| `shared/AGENTS.md` | Layer rules (no imports from frontend/backend/app), i18n compile-time system, function-per-key pattern, namespace organization |

### 9.2 Applicable Instruction Files

| File | Rules Applied |
|---|---|
| `.agents/instructions/backend.instructions.md` | Backend coding conventions, import ordering, no console.log, error handling patterns |

### 9.3 Key Rules Enforced

1. **Single Canonical Object Type**: Each entity has exactly one `SelectType`, one `InsertType`, one `ReturnType`, and one `SubmitInput`. No duplicate or ad-hoc type definitions.
2. **Omit-and-Extend Contract**: `ReturnType` always `Omit`s forbidden fields and `&`-extends with re-applied enums and resolved properties.
3. **No Local Types in Consumers**: Services (Plan 4) and Pothos (Plan 5) import types from `@/backend/types/certificates` — never define local type alternatives.
4. **TS Enums (not const objects)**: All enums use TypeScript `enum` keyword with string values.
5. **Backend-Only Enums**: `backend/enum/certificates/` files must not be imported by frontend code. Frontend uses GraphQL codegen enums.
6. **Shared Layer Purity**: `shared/locale/` files for cert namespaces must not import from `@/backend/**` or `@/frontend/**`.
7. **i18n Function-Per-Key**: Every translation key is a typed function. Zero-arg keys are `() => string`. Parameterized keys match their usage.

---

## 10. Knowledge Transfer Protocol

### 10.1 What Plan 3 (Repository) Needs to Know

- All `SelectType` and `InsertType` types are importable from `@/backend/types/certificates`.
- The `ReturnType` shapes define what repository methods must return — repos map raw DB rows to `ReturnType` by assigning enum values and attaching resolved properties from joins.
- Filter types define the parameter shapes for `findMany` methods.
- Sort enums define the allowed sort columns for `findMany` methods.
- The `PaginatedResult<T>` wrapper type defines the return shape for paginated queries.

### 10.2 What Plan 4 (Services) Needs to Know

- `SubmitInput` types define the input shape for service methods.
- `ReturnType` types define the output shape for service methods.
- `GenerateCertificateInput`, `GenerateBatchInput`, and `BatchGenerationResultType` are in `backend/types/certificates/generation.types.ts`.
- `PublicVerificationResultType` is in `backend/types/certificates/verification.types.ts` — the public verification endpoint returns this, not the full `CertificateReturnType`.
- `AppPermission` keys are used for `PermissionsService.hasPermission(userId, AppPermission.CERT_GENERATE)` checks.
- The `CertificatePermissionErrors` i18n type is used for permission error messages.
- Services receive `tErrors` as an explicit parameter — they never import translation functions directly.

### 10.3 What Plan 5 (GraphQL API) Needs to Know

- `ReturnType` types are the basis for Pothos `objectRef<{Entity}ReturnType>("{Entity}")` definitions.
- `SubmitInput` types are the basis for Pothos `inputRef<{Entity}SubmitInput>("{Entity}Input")` definitions.
- All 11 cert enums must be registered in `backend/graphql/pothos/shared/enum.pothos.ts` via `gqlSchemaBuilder.enumType(Enum, { name })`. (`FontFamily` is NOT a pgEnum and is exposed as a plain GraphQL `String` with a TS-union guarded resolver, per §4.1.)
- The 11 new `AppPermission` entries are already registered (the enum is already wired in Pothos) — no additional Pothos registration needed for permissions.
- `PublicVerificationResultType` uses a simplified status (`"valid" | "revoked" | "expired"`) — Plan 5 should register a `CertificateVerificationStatus` GraphQL enum for this if needed, or expose it as a plain string field.
- Filter and sort types are used as Pothos input types for list queries.
- `BatchGenerationResultType` is a Pothos object type (not an entity — it has no DB table).

### 10.4 Handoff Checklist

Before marking Plan 2 as complete, verify:
- [ ] All 8 entity type quads (SelectType, InsertType, ReturnType, SubmitInput) are defined and exported.
- [ ] All 11 enums are defined in `backend/enum/certificates/` (matching Plan 01's 11 pgEnums).
- [ ] 11 new `AppPermission` entries are appended to the existing enum.
- [ ] Permission group default mappings are documented (for Plan 1 seed scripts).
- [ ] Filter, sort, and pagination types are defined for all 5 listable entities.
- [ ] All 5 i18n type schema files exist in `shared/locale/`.
- [ ] All 5 English implementation files exist in `shared/locale/en/`.
- [ ] All 5 Arabic implementation files exist in `shared/locale/ar/`.
- [ ] `backend/enum/index.ts` barrel includes `export * from "./certificates"`.
- [ ] `backend/types/index.ts` barrel includes `export * from "./certificates"`.
- [ ] `backend/enum/certificates/index.ts` sub-barrel exists and re-exports both enum files.
- [ ] `backend/types/certificates/index.ts` sub-barrel exists and re-exports all type files.
- [ ] `tsgo` passes with no errors.
- [ ] `biome:check` passes with no errors.
- [ ] `lint` passes with no errors on all created files.

---

## Reality Check Notes

> Added by codebase-reality verification pass on 2026-08-02. Verified against the actual state of `/home/ahmed/Projects/siraj-cert/`.

### Verified correct (no changes needed)
- **Type directory `backend/types/certificates/`** — matches the verified full-domain sub-directory naming used by `backend/types/students/`, `backend/types/billing/`, `backend/types/teachers/`. ✓
- **Enum directory `backend/enum/certificates/`** — matches verified `backend/enum/billing/`, `backend/enum/students/` structure (each with its own `index.ts` barrel). ✓
- **Billing canonical `{Entity}SelectType/InsertType/ReturnType/SubmitInput` type contract** — confirmed at `backend/types/billing/billing.types.ts:26` (`InvoiceReturnType = Omit<...>`), `:50` (`PaymentReturnType`), etc. Plan 02 adopts this over the older `{Entity}Entity`/`{Entity}` variant used by `students/teachers/storage`. ✓
- **Per-entity `.types.ts` file split** — defensible given 8 entities; `backend/types/students/` uses both `student.types.ts` and `student-lifecycle.types.ts`. ✓
- **ReturnType-naming standardization** — corrected all `TemplateReturnType` → `CertificateTemplateReturnType` and `CategoryReturnType` → `CertificateCategoryReturnType` to match billing's strict `{TableName}ReturnType` derivation (`InvoiceReturnType`, `CurrencyExchangeRateReturnType`). ✓
- **`AppPermission` location** — confirmed at `backend/enum/permissions/permission.enum.ts` (NOT a flat `backend/enum/permissions.ts`); uses dot-path values like `BILLING_CREATE_INVOICE = "billing.create_invoice"`. ✓
- **`permissions` table schema** — `key: appPermissionEnum("key")`, `description: jsonb().$type<LocalizedString>()`, `category: jsonb().$type<LocalizedString>()` (verified `backend/db/schema/permissions/permissions.ts`). Permission display metadata is stored on the DB row, NOT inline in the enum. ✓

### Corrections applied
1. **§2.2 type-sub-directory path** — changed `backend/types/cert/` → `backend/types/certificates/` throughout (originally used the abbreviated `cert/` short form which does NOT exist anywhere in the codebase; would not match the existing barrel-re-export convention `export * from "./students"; export * from "./billing";`).
2. **§2.3 enum-sub-directory path** — changed `backend/enum/cert/` → `backend/enum/certificates/` throughout; added explicit `backend/enum/certificates/index.ts` sub-barrel wiring; removed the spurious "enum metadata pattern" advice (`backend/enum/` TS enums are bare `export enum X {...}` plus optional `ALLOWED_*_TRANSITIONS` const — verified `backend/enum/students/student-lifecycle.enum.ts`; display labels live in `shared/locale/`).
3. **§2.12 barrel registrations** — corrected both `export * from "./cert"` occurrences to `export * from "./certificates"` so the barrel line sub-directory name matches the actual sub-directory being created.
4. **ReturnType naming standardization** — swept `TemplateReturnType` → `CertificateTemplateReturnType` (×8 occurrences minus the 2 already correctly named) and `CategoryReturnType` → `CertificateCategoryReturnType` (×11) to match billing's strict `{TableName}ReturnType` convention.
5. **§6 namespace file layout** — replaced the invented flat-file scheme (`shared/locale/certificates.permissions.ts`, `shared/locale/en/certificates.enums.ts`, etc.) with the codebase's actual per-domain sub-directory layout:
   - Type schemas → `shared/locale/types/certificates/<sub>.ts`
   - Namespace registration → `shared/locale/namespaces/certificates/<sub>.ts`
   - English impls → `shared/locale/en/certificates/<sub>.ts`
   - Arabic impls → `shared/locale/ar/certificates/<sub>.ts`
   Verified by inspecting `shared/locale/{types,namespaces,en,ar}/{auth,common,dashboard,emails,errors,notifications,...}/` — flat-file placement does NOT exist anywhere.
6. **§6 central registration wiring** — replaced "(or equivalent central registration file)" with the verified files: `shared/locale/namespaces/define-namespace.ts` + `shared/locale/namespaces/index.ts` (registration via `defineNamespace(id, { load })`) and `shared/locale/types/index.ts`.
7. **§6 cross-reference to Plan 03** — clarified that the **backend repo errors** layer uses the single aggregate `ErrorsLabels` interface at `shared/locale/types/errors/index.ts` (NOT per-domain type files); the `certificates.errors.*` namespaces defined here are for **frontend/service display**, not for backend repo parameter binding.

### Caveats / cross-plan inconsistencies flagged (NOT silently resolved)
- **Enum count mismatch**: Plan 01's `enums.ts` registry will receive 11 pgEnums (`CertificateTemplateStatus`, `CertificateOrientation`, `CertificateBackgroundType`, `CertificateElementType`, `CertificateVariableType`, `CertificateRecipientGroupStatus`, `CertificateRecipientItemStatus`, `CertificateStatus`, `CertificateGenerationStatus`, `CertificateVerificationMethod`, `CertificateVerificationResult`). But this Plan 02 design §2.1 / §4 lists 8 enums and additionally invents `CertificateResolution` and `TemplateElementSource` plus `FontFamily` — these 3 extra enums have NO corresponding pgEnum in Plan 01. **Recommend**: either remove the 3 extras from Plan 02's design, OR add corresponding pgEnums to Plan 01 (preferred: add `certificate_resolution`, `template_element_source`, and `font_family` to Plan 01's `enums.ts`; otherwise the `reApplyEnums` step in §3.1/§3.3 will reference nonexistent types).
- **Permission key naming inconsistency**: this design's prose / Plan 02 tasks previously mixed two naming schemes — the short-form `CERT_TEMPLATE_MANAGE` etc. (older draft) vs. the dotted `certificates.templates.manage` form documented in `requirements.md` §4 REQ-PERM-001..011. The dotted form is canonical (matches the existing `BILLING_CREATE_INVOICE = "billing.create_invoice"` convention in `permission.enum.ts`). tasks.md T09 has been corrected to use ONLY the dotted form. requirements.md uses the dotted form (no change needed). design.md §5 prose should be reviewed to confirm consistency.
- **`requirements.md` REQ-ENUM-001 says "8 certificate-domain TS enums"** but Plan 01 lists 11 — these counts must be reconciled. The 8-vs-11 difference appears to be because some enums (RecipientGroupStatus, RecipientItemStatus, VerificationMethod, GenerationStatus) are considered "lifecycle sub-enums" vs. "domain-enums" — pick one taxonomy and apply consistently across Plans 01, 02, 03.
- **`requirements.md` REQ-TYPE-021 lists `FontFamily` as one of the re-applied enums** for `CertificateTemplateReturnType`, and design §3.2 also re-applies `FontFamily`. But there is no `FontFamily` pgEnum in Plan 01, and no `font_family` PG enum specified. **Recommend**: Plan 01 should add a `font_family` pgEnum (plain text column would lose type safety), or Plan 02/03 should treat font as a free-string column with a TS-side union-literal type.

### Reference files verified (read-only)
- `backend/types/billing/billing.types.ts` — canonical `{Entity}SelectType/InsertType/ReturnType/SubmitInput` pattern.
- `backend/types/students/student.types.ts` — older `{Entity}Entity`/`{Entity}` pattern (rejected).
- `backend/enum/permissions/permission.enum.ts` — `AppPermission` location + dot-path convention.
- `backend/db/schema/permissions/permissions.ts` — permissions table (`key`, `description`, `category` JSONB columns).
- `backend/enum/students/student-lifecycle.enum.ts` — bare `export enum X {...}` + `ALLOWED_STATUS_TRANSITIONS` const pattern (no inline metadata).
- `backend/enum/billing/index.ts` — sub-barrel pattern (re-exports per-enum files).
- `shared/locale/namespaces/define-namespace.ts` — namespace registration helper for frontend/i18n.
- `shared/locale/{types,namespaces,en,ar}/` directory layouts — verified per-domain sub-directory convention.
- `shared/locale/types/errors/index.ts` (308 lines) && `shared/locale/en/errors/index.ts` — backend errors `ErrorsLabels` aggregate pattern (referenced by Plan 03).

---

## SWE Expert Review Notes

### Issues found and fixed (this pass) — Plan 02 was the most diverged plan

1. **[CRITICAL — Enum count + name + value triple mismatch]** Requirements/design/tasks disagreed on the certificate enum set: requirements §3.1 said "8 enums", design §4 listed 8 (with invented `CertificateResolution`/`TemplateElementSource` and short-named `TemplateStatus`/`VerificationResult`), tasks T01 listed 11 but with WRONG values (`NONE/SOLID_COLOR`, `QUEUED/RENDERING`, `MANUAL_ENTRY`, `PENDING/READY/GENERATING`). Plan 01 §3.1 is the authoritative source of truth (11 pgEnums via `createPgEnumFromEnum`). **Fixed all three files** to the canonical 11 with byte-matching values (`COLOR/IMAGE/GRADIENT`, `ACTIVE/INACTIVE/COMPLETED`, `PENDING/PROCESSING/COMPLETED/FAILED`, `QR_CODE/LINK/MANUAL`, …) and the `Certificate…` names that the `createPgEnumFromEnum("certificate_<domain>", <Enum>)` registration in Plan 01 keys off.
2. **[CRITICAL — Permission naming divergence]** Requirements (§4.1) used `certificates.*` dot-roots (canonical, matches verified `billing.create_invoice`/`students.edit`); design used short `cert.*`/`template.*`/`category.*`/`recipient_group.*` roots + a `cert.batch_generate` value + an extra `recipient_group.view` key. **Fixed**: design §2.4, §2.10 matrix, §2.14, §5.1, §5.3, §5.4, plus tasks T09/T10, now uniformly use the requirements-canonical 11 `certificates.*` keys; `batch_generate`→`bulk_generate`; the extra `recipient_group.view` removed (no `AppPermission` counterpart). Matrix de-duplicated to exactly 11 rows matching REQ-PERM-001.
3. **[CRITICAL — Type-layer column drift vs Plan 01]** Certificate types referenced ~12 nonexistent/misnamed columns: `createdByUserId` (should be `createdBy`/`updatedBy`), `widthPx/heightPx` (`width/height`), `backgroundImageUrl`/`backgroundImageStorageId` (`backgroundImageId`), `currentVersion`/`currentVersionId` (no such column — version chain is `(slug, version)` self-ref), `recipientName`/`recipientEmail` (no such `certificates` columns — resolved via `studentId`→`students` join), `resolution` (no column/enum), `fileUrl`/`fileSize` (no such columns — `pdfStoragePath` is the real one), `expiryDate` (not a column — terminal `expiresAt` derived from `template.defaultValidityPeriod`). **Fixed**: §3.1 `CertificateReturnType`/`CertificateSubmitInput`, §3.2 `CertificateTemplateReturnType`/`SubmitInput`, §3.3 `TemplateElementReturnType`/`SubmitInput` (dropped invented `source: TemplateElementSource`), §3.6 `RecipientGroupReturnType`/`SubmitInput`, §3.7 verification (`result`→`verificationResult`, added `verificationMethod` enum), §3.8 `GenerateCertificateInput` now reference only Plan 01-real columns.
4. **[HIGH — Nonexistent table]** §3.2 `TemplateVersionSelectType`/`TemplateVersionReturnType` referenced a `template_versions` table. **Fixed**: the type block is removed (with an explanatory note) — versions live on `certificate_templates` via `parentId` + `(slug, version)` unique.
5. **[HIGH — Invented enums]** `CertificateResolution` and `TemplateElementSource` had NO corresponding pgEnum in Plan 01 and NO real column on certificates/elements. **Fixed**: dropped everywhere (§2.6 re-application map, §4 enum section, §7 PG-enum dependency list, tasks T01). `FontFamily` reclassified from "8th enum" to a TS-only union (no `font_family` pgEnum) — unblocks Plan 01↔02 parity.
6. **[HIGH — i18n layout contradiction]** Tasks T12 created flat `shared/locale/certificates.permissions.ts` files; design §2.11 already marked this as wrong (verified per-domain sub-directory layout). **Fixed tasks T12** to create the verified per-domain sub-directory layout (`shared/locale/{types,namespaces,en,ar}/certificates/*.ts`). Also clarified the split between Plan 02's frontend/service display namespaces and Plan 03's backend `ErrorsLabels` aggregate extension at `shared/locale/types/errors/index.ts` + `shared/locale/en/errors/index.ts`.
7. **[MEDIUM — Inline-metadata contradiction]** Tasks T09 verification line said "Each has Arabic/English metadata" while T09 step 3 said "DO NOT add inline metadata". **Fixed** to a non-contradictory "NO inline metadata in enum file".
8. **[MEDIUM — Enum label count]** §6 i18n said "all 8 enums" and "30+ keys"; §7.2 AC-ENUM-01 said "8 enums". **Fixed** to 11 / ~50 keys.
9. **[MEDIUM — Permission seed field]** §5.2 listed a `resource`/`action` pseudo-column on the `permissions` table. **Fixed**: verified `permissions` table uses the dot-path `key` as natural key — no `resource`/`action` columns exist; metadata is in `description`/`category` JSONB.

### Reality-check mismatches corrected
- `backend/db/drizzleRelations.ts` uses `defineRelations` (NOT legacy `relations()`) — does not affect this plan, but the version-chain note now references the `(slug, version)` index correctly.
- `shared/locale/{types,namespaces,en,ar}/` per-domain sub-directory layout (verified against `shared/locale/en/errors/index.ts` and `shared/locale/en/{auth,common,dashboard,…}/`) — tasks T12 paths replaced.
- `shared/locale/types/errors/index.ts` is the single aggregate `ErrorsLabels` interface (~308 lines, per-domain sub-interfaces) + `shared/locale/en/errors/index.ts` is the flat aggregate — explicitly NOT edited by Plan 02 (Plan 03 owns the backend errors binding).
- `backend/enum/` files contain NO inline display metadata (verified `backend/enum/students/student-lifecycle.enum.ts`) — enforced in requirements §3.3 (REQ-ENUM-020..022 clarified), design §4.3, tasks T01 step 3.
- `backend/enum/permissions/permission.enum.ts` uses dot-path VALUES (`billing.create_invoice`) — Plan 02's `certificates.*` roots match this convention; `filterKnownAppPermissions(Object.values(AppPermission))` picks up new values automatically (verified).

### Architectural concerns (remaining, flagged for human review)
- **Enum KEY casing divergence**: the 11 new cert enums use `UPPER_SNAKE` keys with lowercase-snake VALUES (e.g. `DRAFT="draft"`); existing `StudentStatus` uses UPPER values (`REGULAR="REGULAR"`). Both patterns coexist in the codebase and the helper `createPgEnumFromEnum` derives from `Object.values`, so this is internally consistent per-enum and safe. **Flagged**: confirm the casing choice is documented as the new convention for the certificate domain (do not retrofit `StudentStatus`).
- **Pothos enumType registration** (design AC line ~1007): the 11 TS enums must each be registered via `gqlSchemaBuilder.enumType(<Enum>, {name})` in `backend/graphql/pothos/shared/enum.pothos.ts`. `FontFamily` is NOT a Pothos enum — expose as a GraphQL `String` guarded by the TS union in the resolver. **Flagged**: confirm the Pothos builder accommodates per-enum registration with the matching name string (`CertificateTemplateStatus` etc.) and that the typename clash with PG-enum registration is handled.
- **Permission hierarchy atom labor**: `certificates.manage` grants `certificates.view` and `certificates.bulk_generate` grants `certificates.generate` (seed-time implications) — this is not enforced by the enum itself; the service-layer `hasPermission` resolver (Plan 04) must implement the implication DAG. **Flagged**: add the implication function in Plan 04 alongside the permission checker.
- **`getVersionChain(slug)` now has a column** to operate on (Plan 01 added `slug`), but the type layer should expose a `TemplateVersionChainReturnType` that aggregates `[CertificateTemplateReturnType,...]` slices by `slug` ordered by `version` — currently not defined in §3.2. **Flagged**: add a chain-projection type in Plan 02 §3.2 or defer to Plan 03 repository query.
- **Soft-delete type extension**: Plan 02 does not touch `Types.SoftDeletableTableName` — that's Plan 03's job. But the `Omit<…, "deletedAt">` in §3.x ReturnType assumes `deletedAt` exists on every soft-deletable entity (it does on `certificates`/`certificate_templates`/`certificate_recipient_groups`/`certificate_categories` per Plan 01; absent on cascade-deleted children — verified correct).

### Remaining risks flagged for human review
1. Confirm `reApplyEnums` (the local helper that re-typizes enum columns on `ReturnType`) is invoked in §3.1/§3.2 with the canonical 11 enum identifiers once Plan 02's enum file lands; otherwise `$inferSelect` will keep enum columns as raw `string`.
2. **`CertificateRecipientGroupItemReturnType.resolved.student`** depends on `StudentReturnType` existing in `backend/types/students/` (not yet verified exported from the top-level `@/backend/types` barrel — the students type domain may use a different exported symbol name). **Flagged**: verify the exact exported name before wiring the join.
3. The `permissions` table seed rows for the 11 new keys must be added in Plan 01's seed/fixture — Plan 02 only provides the enum + i18n labels; the seed loop ownership is a cross-plan coordination point listed in §8.3 but the actual insert lives in Plan 01's migration tasks. Confirm Plan 01's T14 migration includes the 11 seed inserts.
