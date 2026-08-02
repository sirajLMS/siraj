# Plan 05 — GraphQL API: Design

> **Feature**: Certificate Module — GraphQL API (Pothos Types, Queries, Mutations, DataLoader)
> **Plan #**: 05
> **Dependencies**: Plan 2 (Types & Permissions), Plan 4 (Services)
> **Architecture Position**: Layer 5 — GraphQL resolvers sitting above services, below client components

---

## 1. Architecture Position

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Frontend (Apollo Client)                          │
│  Queries & Mutations → frontend/common/graphql/sharedDocuments/      │
└──────────────────────────┬──────────────────────────────────────────┘
                           │  GraphQL (HTTP)
                           ▼
┌──────────────────────────────────────────────────────────────────────┐
│                  Pothos Schema (THIS PLAN)                            │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐            │
│  │ Object Types │  │ Query/Mutation│  │ DataLoader Refs  │           │
│  │ (9 types)    │  │ (10Q + 24M)  │  │ (batch by ID)    │           │
│  └──────┬──────┘  └──────┬───────┘  └────────┬─────────┘           │
│         │                │                    │                      │
│         └────────────────┼────────────────────┘                      │
│                          ▼                                            │
│                  Auth Scope Guards                                    │
│                  (AppPermission checks)                              │
└──────────────────────────┬───────────────────────────────────────────┘
                           │  Service calls
                           ▼
┌──────────────────────────────────────────────────────────────────────┐
│                  Services Layer (Plan 4)                              │
│  CertificateService, TemplateService, CategoryService, etc.          │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 2. Design Goals

1. **Single Canonical Type Per Entity** — Exactly one Pothos object type per entity, backed by `ReturnType` from Plan 2 — no local type definitions
2. **Auth Scope Everywhere** — Every query and mutation declares required permissions using Pothos auth scopes referencing `AppPermission` entries from Plan 2
3. **N+1 Prevention** — `loadableObjectRef` with DataLoader for Certificate and CertificateTemplate; field-level batching for nested relations
4. **Public Verification** — Separate unauthenticated query endpoint for `/verify/[code]` with rate limiting
5. **Error Mapping** — All service errors mapped to GraphQL-compatible error extensions with translated messages
6. **i18n in Resolvers** — Resolver context provides `ctx.t()` for translating error messages per request locale

---

## 3. Key Design Decisions

### Decision 1: loadableObjectRef for Top-Level Entities
**Context**: Certificate and CertificateTemplate are queried individually by ID frequently (list → detail navigation, DataLoader cascade).
**Options**:
1. Plain `objectRef` with field resolvers — Simpler, but N+1 risk when lists resolve template/certificate relations
2. `loadableObjectRef` with batch load — Prevents N+1, integrates with Pothos DataLoader plugin
**Decision**: Use `loadableObjectRef` for Certificate and CertificateTemplate; plain `objectRef` for all other entities (loaded as lists from parent, never individually batched).
**Rationale**: Only Certificate and Template have list→detail access patterns with potential N+1. Elements, variables, verifications are always loaded as child lists.

### Decision 2: Public Verification Endpoint as Separate Query
**Context**: Public verification must work without authentication, but all other cert queries require auth scopes.
**Options**:
1. Regular query with conditional auth scope — Fragile, hard to audit
2. Separate query field with no auth scope + rate limiting middleware — Clean, explicit
**Decision**: Separate `certificateVerify_public(code)` query with no auth scope, wrapped in rate-limiting middleware.
**Rationale**: Explicit unauthenticated endpoint is easier to audit and test. Rate limiting prevents abuse.

### Decision 3: Enum Registration in Shared Pothos File
**Context**: 11 certificate enums need Pothos enum registration.
**Options**:
1. Register in each Pothos type file — Duplicates, potential conflicts
2. Register all in `backend/graphql/pothos/shared/enum.pothos.ts` — Single source, matches Siraj pattern
**Decision**: Register all cert enums in `backend/graphql/pothos/shared/enum.pothos.ts` (the existing enum registration file).
**Rationale**: Follows existing Siraj pattern — all enums registered in one shared file.

### Decision 4: Mutation Error Shape
**Context**: Service layer throws typed errors (NotFoundError, PermissionError, ValidationError, ConflictError). GraphQL needs consistent error shape.
**Options**:
1. Catch-all error wrapper — Lose error type information
2. Map service errors to GraphQL error extensions with code + message + locale — Structured, client can pattern-match
**Decision**: Map each service error type to a GraphQL error extension with `{ code: string, message: string, field?: string }`. Message is translated via `ctx.t()`.

---

## 4. Object Type Catalog

| GraphQL Type | Underlying Type | Key Fields | Load Strategy |
|---|---|---|---|
| `Certificate` | `CertificateReturnType` | id, status, verificationCode, generatedAt, revokedAt, revokedReason, expireDate, pdfUrl, template, student, verifications | `loadableObjectRef` |
| `CertificateTemplate` | `TemplateReturnType` | id, name, nameAr, description, status, orientation, widthPx, heightPx, backgroundType, backgroundColor, fontFamily, version, category, elements, variables, createdAt | `loadableObjectRef` |
| `TemplateElement` | `TemplateElementReturnType` | id, type, label, content, x, y, width, height, rotation, zIndex, fontSize, fontWeight, color, fontFamily, textAlign, imageUrl, shapeType, variable | Plain `objectRef` |
| `TemplateVariable` | `TemplateVariableReturnType` | id, name, nameAr, key, type, defaultValue, required, selectOptions, description | Plain `objectRef` |
| `CertificateCategory` | `CategoryReturnType` | id, name, nameAr, description, descriptionAr, parentId, sortOrder, parent, children, templates | Plain `objectRef` |
| `RecipientGroup` | `RecipientGroupReturnType` | id, name, nameAr, description, status, totalRecipients, generatedCount, template, items | Plain `objectRef` |
| `RecipientGroupItem` | `RecipientGroupItemReturnType` | id, status, errorMessage, group, student, certificate, variableValues | Plain `objectRef` |
| `CertificateVerification` | `CertificateVerificationReturnType` | id, method, result, ipAddress, userAgent, verifiedAt, certificate | Plain `objectRef` |
| `TemplateStylePreset` | `TemplateStylePresetReturnType` | id, name, nameAr, fontFamily, fontFamilyAr, primaryColor, secondaryColor, backgroundColor, fontSize, fontWeight, textAlign, isSystem | Plain `objectRef` |

---

## 5. Query Catalog

| Query | Auth Scope | Return Type | Description |
|---|---|---|---|
| `certificateList` | `CERT_VIEW` | `[Certificate]` paginated | List certificates with filters, sort, pagination |
| `certificateById` | `CERT_VIEW` | `Certificate` | Single certificate by ID |
| `certificateVerifyPublic` | None (rate-limited) | `CertificateVerificationResult` | Public verification by code |
| `certTemplateList` | `CERT_TEMPLATE_VIEW` | `[CertificateTemplate]` paginated | List templates with filters |
| `certTemplateById` | `CERT_TEMPLATE_VIEW` | `CertificateTemplate` | Single template by ID |
| `certCategoryTree` | `CERT_TEMPLATE_VIEW` | `[CertificateCategory]` | Full category tree (hierarchical) |
| `recipientGroupList` | `CERT_RECIPIENT_GROUP_MANAGE` | `[RecipientGroup]` paginated | List recipient groups |
| `recipientGroupById` | `CERT_RECIPIENT_GROUP_MANAGE` | `RecipientGroup` | Single recipient group by ID |
| `templateStylePresetList` | `CERT_TEMPLATE_VIEW` | `[TemplateStylePreset]` | List style presets |
| `certificateVerificationLog` | `CERT_VERIFY` | `[CertificateVerification]` paginated | Verification log for a certificate |

---

## 6. Mutation Catalog

### Template Mutations
| Mutation | Auth Scope | Input | Return |
|---|---|---|---|
| `createCertificateTemplate` | `CERT_TEMPLATE_MANAGE` | `TemplateSubmitInput` | `CertificateTemplate` |
| `updateCertificateTemplate` | `CERT_TEMPLATE_MANAGE` | `{ id, patch: Partial<TemplateSubmitInput> }` | `CertificateTemplate` |
| `publishCertificateTemplate` | `CERT_TEMPLATE_PUBLISH` | `{ id }` | `CertificateTemplate` |
| `archiveCertificateTemplate` | `CERT_TEMPLATE_PUBLISH` | `{ id }` | `CertificateTemplate` |
| `duplicateCertificateTemplate` | `CERT_TEMPLATE_MANAGE` | `{ id, newName }` | `CertificateTemplate` |
| `setTemplateElements` | `CERT_TEMPLATE_MANAGE` | `{ templateId, elements: [TemplateElementSubmitInput] }` | `[TemplateElement]` |
| `setTemplateVariables` | `CERT_TEMPLATE_MANAGE` | `{ templateId, variables: [TemplateVariableSubmitInput] }` | `[TemplateVariable]` |

### Category Mutations
| Mutation | Auth Scope | Input | Return |
|---|---|---|---|
| `createCertificateCategory` | `CERT_CATEGORY_MANAGE` | `CategorySubmitInput` | `CertificateCategory` |
| `updateCertificateCategory` | `CERT_CATEGORY_MANAGE` | `{ id, patch }` | `CertificateCategory` |
| `deleteCertificateCategory` | `CERT_CATEGORY_MANAGE` | `{ id }` | `Boolean` |
| `reorderCertificateCategories` | `CERT_CATEGORY_MANAGE` | `{ items: [{ id, sortOrder }] }` | `[CertificateCategory]` |

### Recipient Group Mutations
| Mutation | Auth Scope | Input | Return |
|---|---|---|---|
| `createRecipientGroup` | `CERT_RECIPIENT_GROUP_MANAGE` | `RecipientGroupSubmitInput` | `RecipientGroup` |
| `updateRecipientGroup` | `CERT_RECIPIENT_GROUP_MANAGE` | `{ id, patch }` | `RecipientGroup` |
| `deleteRecipientGroup` | `CERT_RECIPIENT_GROUP_MANAGE` | `{ id }` | `Boolean` |
| `addRecipientGroupItems` | `CERT_RECIPIENT_GROUP_MANAGE` | `{ groupId, studentIds: [string] }` | `RecipientGroup` |
| `removeRecipientGroupItems` | `CERT_RECIPIENT_GROUP_MANAGE` | `{ groupId, itemIds: [string] }` | `RecipientGroup` |
| `setRecipientItemVariableValue` | `CERT_RECIPIENT_GROUP_MANAGE` | `{ itemId, variableId, value }` | `RecipientGroupItemVariableValue` |

### Certificate Mutations
| Mutation | Auth Scope | Input | Return |
|---|---|---|---|
| `generateCertificate` | `CERT_GENERATE` | `{ templateId, studentId, variableOverrides }` | `Certificate` |
| `generateCertificatesBatch` | `CERT_GENERATE` | `{ groupId }` | `BatchGenerationResult` |
| `revokeCertificate` | `CERT_REVOKE` | `{ id, reason }` | `Certificate` |
| `revokeCertificatesBatch` | `CERT_REVOKE` | `{ ids: [string], reason }` | `[Certificate]` |

### Style Preset Mutations
| Mutation | Auth Scope | Input | Return |
|---|---|---|---|
| `createTemplateStylePreset` | `CERT_STYLE_PRESET_MANAGE` | `TemplateStylePresetSubmitInput` | `TemplateStylePreset` |
| `updateTemplateStylePreset` | `CERT_STYLE_PRESET_MANAGE` | `{ id, patch }` | `TemplateStylePreset` |
| `deleteTemplateStylePreset` | `CERT_STYLE_PRESET_MANAGE` | `{ id }` | `Boolean` |

---

## 7. File Organization

### Pothos Type Files
```
backend/graphql/pothos/certificates/
├── index.ts                           # Barrel: export all types, queries, mutations
├── certificate.pothos.ts              # Certificate object type
├── certificateTemplate.pothos.ts      # CertificateTemplate object type
├── templateElement.pothos.ts          # TemplateElement object type
├── templateVariable.pothos.ts          # TemplateVariable object type
├── category.pothos.ts                 # CertificateCategory object type
├── recipientGroup.pothos.ts           # RecipientGroup object type
├── recipientGroupItem.pothos.ts       # RecipientGroupItem object type
├── verification.pothos.ts             # CertificateVerification object type
├── stylePreset.pothos.ts              # TemplateStylePreset object type
├── inputs.pothos.ts                   # All input types (inputRef definitions)
├── queries.pothos.ts                  # All 10 queries
└── mutations.pothos.ts                 # All 24 mutations
```

### Modifications to Existing Files
| File | Change |
|---|---|
| `backend/graphql/pothos/shared/enum.pothos.ts` | Add 11 cert enum registrations |
| `backend/graphql/pothos/query/index.ts` | Import `./certificates/queries.pothos` |
| `backend/graphql/pothos/mutation/index.ts` | Import `./certificates/mutations.pothos` |
| `backend/graphql/pothos/index.ts` | Import `./certificates/index` for type registration |

### DataLoader Files
```
backend/graphql/pothos/certificates/
├── certificate.dataLoader.ts          # loadableObjectRef batch loader
└── certificateTemplate.dataLoader.ts   # loadableObjectRef batch loader
```

---

## 8. Error Handling Design

### Service → GraphQL Error Mapping

| Service Error | GraphQL Error Code | HTTP Status Equivalent |
|---|---|---|
| `NotFoundError` | `CERT_NOT_FOUND` | 404 |
| `PermissionError` | `CERT_FORBIDDEN` | 403 |
| `ValidationError` | `CERT_VALIDATION_ERROR` | 400 |
| `ConflictError` | `CERT_CONFLICT` | 409 |
| `TemplateInUseError` | `CERT_TEMPLATE_IN_USE` | 409 |
| `GenerationFailedError` | `CERT_GENERATION_FAILED` | 500 |

### Error Extension Shape
```
{
  code: "CERT_NOT_FOUND",
  message: "Certificate not found",
  field: "id" // optional
}
```

Messages are translated via `ctx.t().errorsTranslations` at resolver level using i18n keys defined in Plan 2.

---

## 9. i18n Design

### Resolver i18n Access
Each resolver accesses translations via `const tErrors = ctx.t().errorsTranslations` — `ctx.t()` returns the full `Translations` object already bound to `ctx.locale`; access the `.errorsTranslations` property. Resolvers pass `tErrors` into services (POD per Plan 04). Error keys are defined in Plan 2's i18n schema (`shared/locale/namespaces/errors/` — actual path per codebase layout, NOT flat files).

### Public Verification i18n
The public verification query returns a result object (not errors) with translated status messages:
- `valid`: Certificate is valid and has not been revoked
- `invalid`: No certificate found with this verification code
- `revoked`: Certificate was revoked on {date}
- `expired`: Certificate expired on {date}

Translation keys for verification results live in `shared/locale/certificates.verification.ts` (en/ar implementations).

---

## 10. UX/Navigation Specification

### New Routes & URLs
| Route | Purpose | Permission |
|---|---|---|
| `/[locale]/(dashboard)/certificates` | Certificate list and management | `CERT_VIEW` |
| `/[locale]/(dashboard)/certificates/[id]` | Certificate detail | `CERT_VIEW` |
| `/[locale]/(dashboard)/certificates/templates` | Template list | `CERT_TEMPLATE_VIEW` |
| `/[locale]/(dashboard)/certificates/templates/[id]` | Template editor | `CERT_TEMPLATE_EDITOR_ACCESS` |
| `/[locale]/(dashboard)/certificates/categories` | Category management | `CERT_TEMPLATE_VIEW` |
| `/[locale]/(dashboard)/certificates/recipients` | Recipient groups | `CERT_RECIPIENT_GROUP_MANAGE` |
| `/[locale]/verify/[code]` | Public verification page | None (public) |

### Sidebar Navigation
- New sidebar group: "Certificates"
- Children: Templates, Categories, Recipients, Certificates
- Order: after existing domain groups, before system settings

### Role-Based Access Matrix
| Feature | SUPER_ADMIN | ACADEMY_ADMIN | TEACHER | SUPERVISOR | STUDENT | GUEST |
|---|---|---|---|---|---|---|
| View certificates | ✅ | ✅ | ✅ | ✅ | ✅ (own) | ❌ |
| Generate certificates | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Revoke certificates | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage templates | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Public verify | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 11. Outcome & Knowledge Transfer Protocol

- **Before Execution**: Read all files in `.ai/plans/cert-graphql-api/outcome/`
- **After Execution**: Write `.ai/plans/cert-graphql-api/outcome/<task-id>-outcome.md`
- **Progress Tracking**: Update `[ ]` → `[x]` in tasks.md

---

## Acceptance Criteria Summary

| AC | Requirement |
|---|---|
| AC-01 | 9 Pothos object types, one per entity, backed by ReturnType |
| AC-02 | All 11 cert enums registered in shared enum.pothos.ts |
| AC-03 | 10 queries with correct auth scopes |
| AC-04 | 24 mutations with correct auth scopes |
| AC-05 | DataLoader batch loading for Certificate and CertificateTemplate |
| AC-06 | Public verification endpoint with rate limiting |
| AC-07 | Error mapping with translated messages |
| AC-08 | Schema generation + codegen successful |
| AC-09 | All i18n error keys resolvable per request locale |
| AC-10 | Barrel exports wired into root Pothos index |

---

## Reality Check Notes

> Verified against the actual codebase at `/home/ahmed/Projects/siraj-cert/` on 2026-08-02.

### Verified Correct
- **Pothos domain-folder layout `backend/graphql/pothos/certificates/`** ✅ — matches codebase convention (`backend/graphql/pothos/{students, billing, classes, scheduling, …}/`). Plan's `certificates/` folder with `certificate.pothos.ts`, `certificateTemplate.pothos.ts`, etc. follows the singular-object-file-in-plural-domain-folder pattern (cf. `students/student.pothos.ts`).
- **Pothos file naming `{entity}.pothos.ts`** ✅ — matches exactly.
- **Top-level type-wiring into `backend/graphql/pothos/index.ts`** ✅ — confirmed: that file is a barrel `export * from "@/backend/graphql/pothos/<domain>"` (19 entries). Plan's §7 "Modifications to Existing Files" row 4 (`backend/graphql/pothos/index.ts`) is correct.
- **`backend/graphql/pothos/shared/enum.pothos.ts`** ✅ — exists; confirmed at `backend/graphql/pothos/shared/enum.pothos.ts`. Enum registration flow matches both `backend/graphql/AGENTS.md` and `backend/graphql/pothos/AGENTS.md` CRITICAL RULE: enums MUST be a real TS `enum` in `backend/enum/`, registered once via `gqlSchemaBuilder.enumType(MyEnum, { name })`, referenced by importing the Pothos enum from `shared/enum.pothos`. Plan's §3 Decision 3 relies on Plan 1 defining the enums in `backend/enum/` — that dependency is correctly stated in T01.
- **`loadableObjectRef` pattern** ✅ — matches `backend/graphql/pothos/students/student.pothos.ts` (`gqlSchemaBuilder.loadableObjectRef<Student, string>("Student", { load: async ids => StudentRepository.loadByIds(ids), sort })`). Decision 1 is consistent.
- **Type backing `gqlSchemaBuilder.objectRef<{Entity}ReturnType>("...")`** ✅ — matches Single Canonical Object Type pattern in `backend/graphql/AGENTS.md`.
- **`backend/graphql/gqlContext.ts` context: `locale`, `user`, `t`** ✅ — confirmed. `BaseContext.t` is `() => Translations`, `locale: string`, `user.id`. §1 i18n design intent correct.

### Corrections Made
- **`ctx.t("certificates.errors")` → `ctx.t().errorsTranslations`** — WRONG pattern in design §8 and §9, tasks T09/T11. Actual codebase (verified in 30+ resolver sites across `backend/graphql/pothos/{scheduling,billing,auth,system,permissions}/...`) universally uses `const tErrors = ctx.t().errorsTranslations;`. `ctx.t()` takes NO namespace argument; it returns the full `Translations` object keyed by `ctx.locale`. Fixed all 4 occurrences in design.md and tasks.md. Cross-check: requirements.md (lines 222, 358) already used the correct `ctx.t().errorsTranslations` form — now design/tasks align with requirements.
- **i18n path `shared/locale/certificates.permissions.ts` / `shared/locale/certificates.errors.ts` (flat files)** — WRONG. Actual `shared/locale` layout uses subdirectories: `shared/locale/namespaces/{errors,auth,...}/`, `shared/locale/types/{errors,...}/`, `shared/locale/en/`, `shared/locale/ar/`. Corrected design §9 to reference `shared/locale/namespaces/errors/`. The flat-file naming should follow the established `define-namespace.ts` / `errors.namespace.ts` pattern (see `shared/locale/namespaces/errors/errors.namespace.ts`).
- **sharedDocuments path** — tasks T13 referenced `frontend/common/graphql/sharedDocuments/certificates.documents.ts` (flat). Actual convention is a **domain subfolder**: `sharedDocuments/{domain}/{entity}.documents.ts` (e.g. `students/student.documents.ts`, `billing/billing-management.documents.ts`, `scheduling/schedule.documents.ts`). Corrected to `sharedDocuments/certificates/certificates.documents.ts`.

### Status (verified, intentionally not changed)
- **`backend/graphql/pothos/query/index.ts` and `mutation/index.ts` wiring** — both directories exist (`backend/graphql/pothos/query/`, `backend/graphql/pothos/mutation/`) with their own `index.ts`. Plan's separate wiring of queries and mutations into these files (§7 rows 2 & 3) is correct and complementary to the top-level `pothos/index.ts` wiring (row 4). ✅
- **Permission scope names (`CERT_VIEW`, `CERT_TEMPLATE_MANAGE`, etc.)** — important: requirements.md uses a DIFFERENT pluralised naming (`CERTIFICATES_VIEW`, `CERTIFICATES_TEMPLATES_MANAGE`, …) than design.md/tasks.md (`CERT_VIEW`, `CERT_TEMPLATE_MANAGE`, …). These come from Plan 2 (Types & Permissions) which is the canonical source for `AppPermission` enum values. This inconsistency is a Plan 2 / nomenclature concern, NOT a codebase-reality mismatch — flagged here but NOT auto-corrected since the authoritative enum lives in Plan 2 / `backend/enum/`.

---

## SWE Expert Review Notes

> Second-pass architectural + codebase-reality review (2026-08-02). Supersedes
> spec body where conflicts are noted below. Treat the corrections below as
> binding constraints on implementation.

### A. Blocking internal contradictions (must resolve before any task)

1. **Two divergent query/mutation catalogs inside Plan 05 itself.** The
   `requirements.md` (REQ-05-004/005/007) and this `design.md` (§5 Query Catalog,
   §6 Mutation Catalog) DO NOT agree on field names, permissions, or service-method
   names:
   | Concern | `requirements.md` | `design.md` / `tasks.md` |
   |---|---|---|
   | List certificates query | `certificates` (`CERTIFICATES_VIEW`) → `CertificateService.list` | `certificateList` (`CERT_VIEW`) → `CertificateService.list` |
   | Single cert query | `certificate` | `certificateById` |
   | Public verify query | `verifyCertificate` | `certificateVerifyPublic` |
   | Perm names | `CERTIFICATES_*` pluralized | `CERT_*` short |
   | Service method names | `TemplateService.create/update/publish/...` (flat) | `TemplateManagementService.publish/archive/cloneTemplate` |
   | Element mutation name | `createTemplateElement` | `setTemplateElements` (whole-array set) |
   **Required:** pick ONE catalog as canonical and rewrite the other. Recommend the
   `design.md` short-form set (`CERT_*`, `certificateList`, `certificateVerifyPublic`,
   `setTemplateElements`) because (a) it aligns with the existing codebase enum
   convention (`TEACHER_VIEW_DASHBOARD`, `STORAGE_MANAGE`) and `achievements`/`grading`
   namespaces, and (b) `requirements.md`'s `createTemplateElement` per-element mutations
   are an N+1 churn pattern that the element editor (Plan 12) should avoid in favor of
   `setTemplateElements`. The `requirements.md` catalog must be rewritten to match.

2. **Service namespace names disagree with Plan 04.** Plan 04 defines
   `TemplateManagementService` + `TemplateElementService` + `TemplateVariableService`
   + `CategoryService` + `RecipientGroupService` + `CertificateGenerationService` /
   `Batch` / `Revocation` / `Verification` / `Expiry`. Plan 05's `requirements.md` calls
   them `CertificateService`, `TemplateService` — these namespaces DO NOT EXIST in
   Plan 04 and will fail to import/compile. **Required:** Plan 05 must import the exact
   namespaces from Plan 04's `backend/services/cert/index.ts` barrel:
   `CertificateGenerationService`, `CertificateBatchService`,
   `CertificateRevocationService`, `CertificateVerificationService`,
   `TemplateManagementService`, `TemplateElementService`, `TemplateVariableService`,
   `RecipientGroupService`, `CategoryService`. Plus the read-side methods Plan 04 must
   add (`list`, `listVerifications`, `getBatchStatus`, `retryRender` — see Plan 04 review).

3. **`generateCertificate` input field mismatch (cross-plan, blocking).** Plan 05's
   `GenerateCertificateInput` (REQ-05-006) = `{ templateId, recipientGroupId,
   idempotencyKey }`. Plan 04's `GenerateCertificateInput` REQUIRES `studentId`,
   `recipientName`, `recipientEmail`, `variableValues`, `expiryDate`. The GraphQL input
   cannot satisfy the service contract — the resolver would be passing an incomplete
   object. **Required:** Plan 05 `GenerateCertificateInput` must mirror Plan 04's full
   bag (or restrict single generation to group-driven items only). See Plan 04 review
   action #6.

4. **Public verification result shape mismatch.** Plan 05 (REQ-05-008) returns
   `{ result: VALID|REVOKED|NOT_FOUND|EXPIRED, certificate: {…nullable sub-object},
   verifiedAt, verificationId }`. Plan 04 throws `NotFoundError` on an unknown code.
   The Plan 05 shape is correct and is the safer public-API contract (no throw + no
   oracle enumeration). Plan 04 must adopt it. Plan 05 §9 "Public Verification i18n"
   translation keys (`valid`/`invalid`/`revoked`/`expired`) must add a `not_found` key
   to align with the enums `VALID|REVOKED|NOT_FOUND|EXPIRED` (currently `invalid`↔`NOT_FOUND`
   naming drift). Rename the i18n `invalid` key to `notFound` for clarity.

### B. Pothos pattern checks vs. real codebase (verified)

5. **`loadableObjectRef` form ✅** — matches `backend/graphql/pothos/students/student.pothos.ts`
   (`gqlSchemaBuilder.loadableObjectRef<Student, string>("Student", { load: async ids =>
   StudentRepository.loadByIds(ids), sort: s => s.id })`). Plan 05 Decision 1 is correct.
   Use the **`StudentRepository.loadByIds(ids)`** naming convention for cert batch
   loaders (`CertificateRepository.loadByIds`, `TemplateRepository.loadByIds`) and add
   those repo methods in Plan 3 if missing.

6. **Enum registration ✅** — `backend/graphql/pothos/shared/enum.pothos.ts` exists;
   pattern is `gqlSchemaBuilder.enumType(MyEnum, { name })` returning an exported
   `*PothosEnum`. The cert enums MUST be real TS `enum`s in `backend/enum/cert/*.enum.ts`
   (owned by Plan 1) BEFORE T01 can register them. Plan 05 T01 lists 11 enum names;
   `requirements.md` REQ-05-002 lists only 8. **Required:** requirements.md enum
   catalog must match the 11 in design/tasks (the 3 missing are
   `CertificateTemplateStatus`, `CertificateBackgroundType`, `CertificateGenerationStatus`
   — confirm exact names with Plan 1).

7. **`requireAuth(ctx)` ✅** — exists at `backend/graphql/utils/requireAuth.ts`:
   `export async function requireAuth(ctx: BaseContext): Promise<string> {
     if (!ctx.user?.id) { const tErrors = ctx.t().errorsTranslations; throw new Error(tErrors.unauthorized); }
     return ctx.user.id; }`. Plan 05's rule "call `requireAuth(ctx)` at the top of every
   authenticated resolver even with authScopes" is correct and matches the codebase
   (verified in `billing-management.pothos.ts`). The public `certificateVerifyPublic`
   resolver must NOT call `requireAuth`.

8. **`ctx.t().errorsTranslations` access ✅** — `BaseContext.t` is `() => Translations`
   and `Translations.errorsTranslations: ErrorsLabels` (`shared/locale/types/message.ts:259`).
   Use this exact form. **Important:** the returned `tErrors` is the shared `ErrorsLabels`
   type, NOT a `CertificateServiceErrors` type — see Plan 04 review correction #4. Resolvers
   pass the same `tErrors: ErrorsLabels` to services; cert-specific keys are namespaced on it.

9. **`gqlContext.ts` context shape ✅** — provides `user.id`, `permissions`,
   `isSuperAdmin`, `actorUserId`, `isImpersonating`, `locale`, `t`, `ipAddress`. Plan 05
   uses `ctx.user.id` + `ctx.locale` + `ctx.t().errorsTranslations` — all present. The
   `notImpersonating: true` auth-scope token maps to `ctx.isImpersonating === false` —
   confirm Pothos `authScopes({ notImpersonating: true })` is a configured scope in
   `gqlSchemaBuilder.ts` (alias for `!ctx.isImpersonating`); if not present there, it
   must be added there, not invented at field site.

### C. DataLoader correctness

10. **`loadableObjectRef` only handles single-object-by-ID**, not array fields. Plan
    05 §4 / REQ-05-003 correctly uses `t.field()` + manual batch for `elements`,
    `variables`, `children`, `items`. But `t.loadable()` for single-return relation
    fields (`Certificate.template`, `Certificate.student`, `RecipientGroup.template`)
    is correct only if the underlying repo exposes a batch `loadByIds(ids) -> (T|null)[]`
    (matching `loadableObjectRef`'s `sort`). **Required:** confirm Plan 3 emits
    `TemplateRepository.loadByIds`, `StudentRepository.loadByIds` (exists),
    `CertificateCategoryRepository.loadByIds`,
    `RecipientGroupRepository.loadStudentCountsByGroupIds` — these batch methods do not
    exist yet in Plan 3's scope per the cross-plan reading; flag to Plan 3 to add them
    and expose batch service methods per `backend/services/AGENTS.md`
    ("Batch Service Methods for DataLoader" rule).

11. **`CertificateTemplate.elements`/`variables` are child arrays but `CertificateTemplate`
    itself uses `loadableObjectRef`.** Mixing is valid but the child-list batch (`loadElementsByTemplateIds`)
    must be invoked from a `t.field` resolver using `ctx`'s DataLoader — so the resolver
    needs a per-request DataLoader instance (`ctx` must expose `dataLoader` or the
    builder's `dataloader` plugin must be enabled). Verify `gqlSchemaBuilder` has the
    Pothos `dataloaderPlugin` configured (Plan 2 / `gqlSchemaBuilder.ts` responsibility);
    if not, batching via `loadableObjectRef` will silently not batch. Flag to Plan 2.

12. **`superAdmin` auto-pass has to be wired.** Plan 05 §11 role matrix says
    `SUPER_ADMIN` ✅ everywhere. The real permission model uses
    `PermissionsService.hasPermission` (which itself lifts superAdmin) — but Pothos
    `authScopes({ permission: AppPermission.X })` must be defined to call
    `hasPermission`, or to consult `ctx.isSuperAdmin`/`ctx.permissions.includes(...)`.
    Confirm the `permission` authScope in `gqlSchemaBuilder.ts` does this (verified
    pattern in billing); if it short-circuits on `ctx.isSuperAdmin` then ✅.

### D. Public verification security

13. **Rate-limit placement: middleware-only is insufficient.** GraphQL middleware can
    be bypassed if the same service is reached from a server component / server action.
    The rate-limit (60 req/min/IP, 10 req/min/code) must ALSO be enforced inside
    `CertificateVerificationService.verifyCertificate` (see Plan 04 review #18) using the
    existing `backend/lib/ratelimit.ts` `RateLimiter`. Plan 05 keeps its middleware layer
    as defense-in-depth.

14. **Per-code rate limit (10/minute) prevents enumeration ✅** — good. But the
    `certificate` sub-object returned for `NOT_FOUND` must be `null` and the response
    must NOT differ in timing/size between "valid cert at unknown code" vs "unknown code"
    (constant-shape). Ensure the resolver returns the same JSON shape for every `result`
    value to avoid a timing/side-channel oracle.

15. **`verifyCertificate` must not include `revocationReason` raw text** — see Plan 04
    review #17. The plan-05 sub-object field list (id, verificationCode, status,
    issueDate, expiryDate, recipientName, templateName) correctly omits raw reason ✅;
    keep it that way and ensure Plan 04 reflects the same.

### E. Error mapping realism

16. **Plan 05 §8 error mapping table invents error types.** `PermissionError`,
    `TemplateInUseError`, `GenerationFailedError` do not exist in `backend/lib/errors.ts`
    (only `DomainError`/`NotFoundError`/`UnauthorizedError`/`ForbiddenError`). The
    dominant codebase convention is `throw new Error(tErrors.<key>(...))` — Plan 05
    must map based on (a) `error instanceof DomainError && error.code` OR (b) on a
    caller-supplied `error.code` property set by the service. **Required:** align with
    whatever Plan 04 settles on (Plan 04 review #5) — recommend `throw new Error(tErrors...)`
    + the service attaching an optional `error.code` string (e.g.
    `({ name: "ConflictError", code: "CERT_CONFLICT" })`) that the resolver copies to the
    GraphQL extension. Rewrite §8 to drop `TemplateInUseError`/`GenerationFailedError`.

### F. File-org / wiring realism

17. **`sharedDocuments/{domain}/{entity}.documents.ts` ✅** — confirmed convention
    (`sharedDocuments/billing/billing-management.documents.ts`,
    `sharedDocuments/auth/auth.documents.ts`). T13's `sharedDocuments/certificates/certificates.documents.ts`
    is correct. The earlier `requirements.md` flat-path reference has been corrected in
    the Reality Check Notes — keep the corrected path.

18. **`backend/graphql/pothos/index.ts` wiring ✅** — confirmed barrel
    (`export * from "@/backend/graphql/pothos/<domain>"`, 19 entries). §7 row 4 is
    correct. ALSO wire into `backend/graphql/pothos/query/index.ts` AND
    `mutation/index.ts` as separate statements (rows 2–3) — confirmed both directories
    exist with their own `index.ts`.

19. **`backend/graphql/pothos/schema.types.ts`** — confirmed nearly empty (just a
    commented-out `export *`). NOT the type-registration point for cert types; type
    registration happens purely via `backend/graphql/pothos/index.ts` barrel re-exports.
    Plan 05 must NOT modify `schema.types.ts`. Remove any implicit dependency on it.

### G. Remaining risks (accept and track)

- **`24 mutations` count is consistent** ✅ (7 + 4 + 6 + 4 + 3 = 24) — but only if the
  chosen catalog is the `design.md`/`tasks.md` one (see #1). The `requirements.md`
  catalog yields a different count (no `setTemplateVariables`, per-element mutations).
- **Field-level auth scope on `verificationCode` + `pdfUrl`** (T04 note) is a good idea
  but Pothos field-level `authScopes` must be supported by the builder config — verify
  or treat `pdfUrl` as a dedicated `signedUrl` resolver in Plan 7 instead of an exposed
  field on `Certificate`.
- **Pagination cursor vs offset inconsistency** — T09 says both `limit/offset` (default
  20, max 100) AND `after` cursor. Pick ONE (cursor pagination is the Siraj
  `loadableObjectRef` + `PageInfoObject` pattern from `students/student.pothos.ts`).
  Recommendation: cursor pagination + `PageInfoObject` to match the established pattern.
- **No subscription for batch progress** — Plan 05 exposes only `certificateGenerationStatus`
  polling. Acceptable for v1; flag for a future `certificateBatchProgress` subscription.

### Action checklist (implementer must reconcile)

1. Reconcile the two catalogs in `requirements.md` vs `design.md` — keep `design.md`'s, rewrite `requirements.md`.
2. Replace `CertificateService`/`TemplateService` with the real Plan 04 namespaces everywhere.
3. Make `GenerateCertificateInput` carry the full Plan 04 input bag.
4. Make `verifyCertificate` return the `result`-enum shape; stop throwing on unknown code; add `notFound` i18n key.
5. Requirements enum catalog must list all 11 enums (match design/tasks).
6. Verify / add `dataloaderPlugin`, `permission` + `notImpersonating` authScopes in `gqlSchemaBuilder.ts`.
7. Verify Plan 3 exposes the batch `loadByIds` / `loadElementsByTemplateIds` etc. repo methods.
8. Align §8 error mapping with the real `backend/lib/errors.ts` types and `throw new Error(tErrors...)` convention.
9. Use cursor pagination + `PageInfoObject` (drop offset/limit dualism).
10. Keep server-side verification rate-limit (in `CertificateVerificationService`) alongside GraphQL middleware.
