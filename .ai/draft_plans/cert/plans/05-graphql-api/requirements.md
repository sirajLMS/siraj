# Plan 05 — GraphQL API: Requirements

## Document Info

| Field | Value |
|-------|-------|
| **Feature** | Certificate GraphQL API (Pothos types, queries, mutations, DataLoader, auth scopes) |
| **Plan #** | 05 |
| **Dependencies** | Plan 2 (Types & Permissions), Plan 4 (Services) |
| **Stakeholders** | Backend team, frontend team (consuming GraphQL API) |
| **Related Docs** | `MASTER_ARCHITECTURE.md`, `siraj_analysis/04-services-graphql-patterns.md` (§C–§D), `cgvs_analysis/03-graphql-api.md`, `siraj_analysis/09-auth-permissions.md` (§9–§10) |

---

## 1. Introduction

### Overview

This plan defines the GraphQL API surface for the certificate feature. It creates Pothos object types for all certificate entities, exposes queries and mutations with auth-scope gating, implements DataLoader batching for N+1 prevention, and provides a public verification endpoint. All types are backed by canonical `*ReturnType` and `*SubmitInput` types from `backend/types/` (defined in Plan 2), and resolvers delegate to certificate services (defined in Plan 4).

### Business Value

- Frontend certificate management UI (Plans 8–19) needs a typed GraphQL API for templates, categories, recipient groups, certificates, and verification.
- The public verification endpoint enables external parties to validate certificate authenticity without authentication.
- DataLoader batching prevents N+1 queries when list views resolve template elements, variables, category trees, and certificate relationships.

### Scope

| In Scope | Out of Scope |
|----------|-------------|
| Pothos object types for 9 certificate entities | Service layer business logic (Plan 4) |
| 10 GraphQL queries with auth scopes | Repository layer methods (Plan 3) |
| 24 GraphQL mutations with auth scopes | PDF rendering (Plan 6) |
| DataLoader batching for all per-object field resolvers | Storage/file management (Plan 7) |
| Enum registration in `shared/enum.pothos.ts` | Frontend UI components (Plans 8–19) |
| Input type definitions (Pothos `inputRef`) | GraphQL document files (frontend plans) |
| Public verification endpoint with rate limiting | Authentication/session management |
| Error code mapping and translated messages | Notification/audit side-effects (Plan 4) |
| Barrel wiring (`pothos/index.ts`, `query/index.ts`, `mutation/index.ts`) | Cache invalidation helpers (Plan 4) |
| Schema generation + codegen | Seed data |

---

## 2. Requirements

### REQ-05-001: Pothos Object Types — Single Canonical Per Entity

**WHEN** the GraphQL schema is built, **THE SYSTEM SHALL** expose exactly one canonical Pothos object type per certificate entity, backed by `{Entity}ReturnType` from `backend/types/`.

**Object Type Catalog:**

| GraphQL Type | Underlying Type | Key Fields | DataLoader Strategy |
|---|---|---|---|
| `Certificate` | `CertificateReturnType` | id, status, verificationCode, issueDate, expiryDate, recipientName, template, student, pdfUrl, revokedReason, revokedAt | `loadableObjectRef` (batch load by ID) |
| `CertificateTemplate` | `CertificateTemplateReturnType` | id, name, status, dimensions, orientation, background, font, elements, variables, category, version, createdAt | `loadableObjectRef` (batch load by ID) |
| `TemplateElement` | `TemplateElementReturnType` | id, type, position {x, y, width, height}, zIndex, rotation, type-specific fields (text content, image url, QR data, shape) | Plain `objectRef` (loaded as list from parent) |
| `TemplateVariable` | `TemplateVariableReturnType` | id, name, type, defaultValue, required, type-specific fields | Plain `objectRef` (loaded as list from parent) |
| `CertificateCategory` | `CertificateCategoryReturnType` | id, name, parent, children, templateCount | Plain `objectRef` with field-level batching |
| `RecipientGroup` | `RecipientGroupReturnType` | id, name, description, template, items, studentCount | Plain `objectRef` with field-level batching |
| `RecipientGroupItem` | `RecipientGroupItemReturnType` | id, group, student, variableValues | Plain `objectRef` (loaded as list from parent) |
| `CertificateVerification` | `CertificateVerificationReturnType` | id, certificate, ip, userAgent, timestamp, result | Plain `objectRef` |

**Acceptance Criteria:**
- Each entity has exactly one Pothos object type (no `SimpleDefinition` local types).
- All types import their underlying type from `@/backend/types`.
- `id` field is exposed as non-null `String` on every object type (Apollo cache normalization).
- `Certificate` and `CertificateTemplate` use `loadableObjectRef` with batch `load` callback.
- Enum fields (status, type, result) reference registered Pothos enums from `shared/enum.pothos.ts`.

---

### REQ-05-002: Enum Registration

**WHEN** certificate enums are defined in `backend/enum/`, **THE SYSTEM SHALL** register each enum exactly once in `backend/graphql/pothos/shared/enum.pothos.ts` using the enum-object form.

**Enums to Register:**

| Enum | Source | GraphQL Name |
|---|---|---|
| `CertificateStatus` | `backend/enum/cert/certificate.enum.ts` | `CertificateStatus` |
| `CertificateResolution` | `backend/enum/cert/certificate.enum.ts` | `CertificateResolution` |
| `CertificateVerificationResult` | `backend/enum/cert/certificate.enum.ts` | `CertificateVerificationResult` |
| `TemplateVariableType` | `backend/enum/cert/template.enum.ts` | `TemplateVariableType` |
| `TemplateElementSource` | `backend/enum/cert/template.enum.ts` | `TemplateElementSource` |
| `TemplateElementType` | `backend/enum/cert/template.enum.ts` | `TemplateElementType` |
| `TemplateStatus` | `backend/enum/cert/template.enum.ts` | `TemplateStatus` |
| `TemplateLayout` | `backend/enum/cert/template.enum.ts` | `TemplateLayout` |

**Acceptance Criteria:**
- No hardcoded enum value arrays in any `*.pothos.ts` file.
- Each enum is registered exactly once (no re-registration runtime errors).
- `bun run generate:gqlSchema` succeeds after registration.
- `bun codegen` produces frontend enum types.

---

### REQ-05-003: DataLoader Batching

**WHEN** field resolvers fetch related data per parent object, **THE SYSTEM SHALL** use Pothos DataLoader to batch requests and eliminate N+1 queries.

**DataLoader Strategy:**

| Field | Strategy | Batch Source |
|---|---|---|
| `Certificate` (by ID) | `loadableObjectRef` | `CertificateRepository.loadByIds(ids)` |
| `CertificateTemplate` (by ID) | `loadableObjectRef` | `TemplateRepository.loadByIds(ids)` |
| `CertificateTemplate.elements` | `t.field()` with manual batch | `TemplateRepository.loadElementsByTemplateIds(templateIds)` → `Map<string, TemplateElementReturnType[]>` |
| `CertificateTemplate.variables` | `t.field()` with manual batch | `TemplateRepository.loadVariablesByTemplateIds(templateIds)` → `Map<string, TemplateVariableReturnType[]>` |
| `CertificateTemplate.category` | `t.loadable()` | `CertificateCategoryRepository.loadByIds(categoryIds)` |
| `CertificateCategory.children` | `t.field()` with manual batch | `CertificateCategoryRepository.loadChildrenByParentIds(parentIds)` → `Map<string, CertificateCategoryReturnType[]>` |
| `CertificateCategory.parent` | `t.loadable()` | `CertificateCategoryRepository.loadByIds(parentIds)` |
| `Certificate.template` | `t.loadable()` | `TemplateRepository.loadByIds(templateIds)` |
| `Certificate.student` | `t.loadable()` | `StudentRepository.loadByIds(studentIds)` |
| `RecipientGroup.template` | `t.loadable()` | `TemplateRepository.loadByIds(templateIds)` |
| `RecipientGroup.items` | `t.field()` with manual batch | `RecipientGroupRepository.loadItemsByGroupIds(groupIds)` → `Map<string, RecipientGroupItemReturnType[]>` |
| `RecipientGroup.studentCount` | `t.loadable()` | `RecipientGroupRepository.loadStudentCountsByGroupIds(groupIds)` → `Map<string, number>` |

**Constraints:**
- `t.loadable()` is used for scalar/object fields (single return, not arrays).
- `t.field()` with manual batch is used for array/list fields (`t.loadable()` cannot return lists).
- Batch service/repository methods return `Map<string, T | null>` keyed by parent ID.

**Acceptance Criteria:**
- No N+1 queries when a list of templates is fetched with their elements, variables, and category.
- No N+1 queries when a list of certificates is fetched with their template and student.
- No N+1 queries when a category tree is resolved recursively.
- Batch repository methods use `inArray(column, ids)` with the transaction fallback pattern.

---

### REQ-05-004: Query Operations

**WHEN** a client requests certificate data, **THE SYSTEM SHALL** expose the following queries with auth-scope gating.

**Query Catalog:**

| Query | Args | Return Type | Auth Scope | Service Delegation |
|---|---|---|---|---|
| `certificates` | `input: CertificateListInput` | `CertificateListResponse!` | `CERTIFICATES_VIEW` | `CertificateService.list(input, userId, tErrors, locale)` |
| `certificate` | `id: ID!` | `Certificate` (nullable) | `CERTIFICATES_VIEW` | `CertificateService.getById(id, userId, tErrors, locale)` |
| `certificateTemplates` | `input: TemplateListInput` | `TemplateListResponse!` | `CERTIFICATES_TEMPLATES_VIEW` | `TemplateService.list(input, userId, tErrors, locale)` |
| `certificateTemplate` | `id: ID!` | `CertificateTemplate` (nullable) | `CERTIFICATES_TEMPLATES_VIEW` | `TemplateService.getById(id, userId, tErrors, locale)` |
| `certificateCategories` | — | `[CertificateCategory!]!` | `CERTIFICATES_TEMPLATES_VIEW` | `TemplateService.getCategoryTree(userId, tErrors, locale)` |
| `recipientGroups` | `input: RecipientGroupListInput` | `RecipientGroupListResponse!` | `CERTIFICATES_RECIPIENT_GROUPS_MANAGE` | `RecipientGroupService.list(input, userId, tErrors, locale)` |
| `recipientGroup` | `id: ID!` | `RecipientGroup` (nullable) | `CERTIFICATES_RECIPIENT_GROUPS_MANAGE` | `RecipientGroupService.getById(id, userId, tErrors, locale)` |
| `verifyCertificate` | `code: String!` | `CertificateVerificationResult!` | **PUBLIC** (no auth scope) | `CertificateVerificationService.verify(code, tErrors, locale)` |
| `certificateGenerationStatus` | `batchId: ID!` | `CertificateGenerationStatus!` | `CERTIFICATES_GENERATE` | `CertificateGenerationService.getBatchStatus(batchId, userId, tErrors, locale)` |
| `certificateVerifications` | `input: CertificateVerificationListInput` | `CertificateVerificationListResponse!` | `CERTIFICATES_VIEW` | `CertificateService.listVerifications(input, userId, tErrors, locale)` |

**Acceptance Criteria:**
- Each query resolves by delegating to the certificate service layer (never calls repositories directly).
- `requireAuth(ctx)` is called at the top of every authenticated resolver (even with `authScopes`).
- `verifyCertificate` has NO `authScopes` definition — truly public.
- `ctx.locale` is propagated to all service calls.
- Paginated queries return a response type with `items`, `total`, `page`, `pageSize`, `hasMore`.
- `certificateCategories` returns the full tree (root categories with nested children resolved via DataLoader).

---

### REQ-05-005: Mutation Operations

**WHEN** a client modifies certificate data, **THE SYSTEM SHALL** expose the following mutations with auth-scope gating.

**Mutation Catalog — Template Management:**

| Mutation | Args | Return Type | Auth Scope | Service Delegation |
|---|---|---|---|---|
| `createCertificateTemplate` | `input: CreateTemplateInput!` | `CertificateTemplate!` | `CERTIFICATES_TEMPLATES_MANAGE`, `notImpersonating: true` | `TemplateService.create(userId, input, tErrors, locale)` |
| `updateCertificateTemplate` | `input: UpdateTemplateInput!` | `CertificateTemplate!` | `CERTIFICATES_TEMPLATES_MANAGE`, `notImpersonating: true` | `TemplateService.update(userId, input, tErrors, locale)` |
| `publishCertificateTemplate` | `id: ID!` | `CertificateTemplate!` | `CERTIFICATES_TEMPLATES_PUBLISH`, `notImpersonating: true` | `TemplateService.publish(userId, id, tErrors, locale)` |
| `archiveCertificateTemplate` | `id: ID!` | `CertificateTemplate!` | `CERTIFICATES_TEMPLATES_PUBLISH`, `notImpersonating: true` | `TemplateService.archive(userId, id, tErrors, locale)` |
| `cloneCertificateTemplate` | `id: ID!` | `CertificateTemplate!` | `CERTIFICATES_TEMPLATES_MANAGE`, `notImpersonating: true` | `TemplateService.clone(userId, id, tErrors, locale)` |

**Mutation Catalog — Template Elements:**

| Mutation | Args | Return Type | Auth Scope | Service Delegation |
|---|---|---|---|---|
| `createTemplateElement` | `input: CreateTemplateElementInput!` | `TemplateElement!` | `CERTIFICATES_TEMPLATES_MANAGE`, `notImpersonating: true` | `TemplateService.createElement(userId, input, tErrors, locale)` |
| `updateTemplateElement` | `input: UpdateTemplateElementInput!` | `TemplateElement!` | `CERTIFICATES_TEMPLATES_MANAGE`, `notImpersonating: true` | `TemplateService.updateElement(userId, input, tErrors, locale)` |
| `deleteTemplateElement` | `id: ID!` | `Boolean!` | `CERTIFICATES_TEMPLATES_MANAGE`, `notImpersonating: true` | `TemplateService.deleteElement(userId, id, tErrors, locale)` |
| `reorderTemplateElements` | `input: ReorderTemplateElementsInput!` | `[TemplateElement!]!` | `CERTIFICATES_TEMPLATES_MANAGE`, `notImpersonating: true` | `TemplateService.reorderElements(userId, input, tErrors, locale)` |

**Mutation Catalog — Template Variables:**

| Mutation | Args | Return Type | Auth Scope | Service Delegation |
|---|---|---|---|---|
| `createTemplateVariable` | `input: CreateTemplateVariableInput!` | `TemplateVariable!` | `CERTIFICATES_TEMPLATES_MANAGE`, `notImpersonating: true` | `TemplateService.createVariable(userId, input, tErrors, locale)` |
| `updateTemplateVariable` | `input: UpdateTemplateVariableInput!` | `TemplateVariable!` | `CERTIFICATES_TEMPLATES_MANAGE`, `notImpersonating: true` | `TemplateService.updateVariable(userId, input, tErrors, locale)` |
| `deleteTemplateVariable` | `id: ID!` | `Boolean!` | `CERTIFICATES_TEMPLATES_MANAGE`, `notImpersonating: true` | `TemplateService.deleteVariable(userId, id, tErrors, locale)` |

**Mutation Catalog — Categories:**

| Mutation | Args | Return Type | Auth Scope | Service Delegation |
|---|---|---|---|---|
| `createCertificateCategory` | `input: CreateCategoryInput!` | `CertificateCategory!` | `CERTIFICATES_CATEGORIES_MANAGE`, `notImpersonating: true` | `TemplateService.createCategory(userId, input, tErrors, locale)` |
| `updateCertificateCategory` | `input: UpdateCategoryInput!` | `CertificateCategory!` | `CERTIFICATES_CATEGORIES_MANAGE`, `notImpersonating: true` | `TemplateService.updateCategory(userId, input, tErrors, locale)` |
| `deleteCertificateCategory` | `id: ID!` | `Boolean!` | `CERTIFICATES_CATEGORIES_MANAGE`, `notImpersonating: true` | `TemplateService.deleteCategory(userId, id, tErrors, locale)` |
| `reorderCertificateCategories` | `input: ReorderCategoriesInput!` | `[CertificateCategory!]!` | `CERTIFICATES_CATEGORIES_MANAGE`, `notImpersonating: true` | `TemplateService.reorderCategories(userId, input, tErrors, locale)` |

**Mutation Catalog — Recipient Groups:**

| Mutation | Args | Return Type | Auth Scope | Service Delegation |
|---|---|---|---|---|
| `createRecipientGroup` | `input: CreateRecipientGroupInput!` | `RecipientGroup!` | `CERTIFICATES_RECIPIENT_GROUPS_MANAGE`, `notImpersonating: true` | `RecipientGroupService.create(userId, input, tErrors, locale)` |
| `updateRecipientGroup` | `input: UpdateRecipientGroupInput!` | `RecipientGroup!` | `CERTIFICATES_RECIPIENT_GROUPS_MANAGE`, `notImpersonating: true` | `RecipientGroupService.update(userId, input, tErrors, locale)` |
| `deleteRecipientGroup` | `id: ID!` | `Boolean!` | `CERTIFICATES_RECIPIENT_GROUPS_MANAGE`, `notImpersonating: true` | `RecipientGroupService.delete(userId, id, tErrors, locale)` |
| `addRecipientGroupItem` | `input: AddRecipientGroupItemInput!` | `RecipientGroupItem!` | `CERTIFICATES_RECIPIENT_GROUPS_MANAGE`, `notImpersonating: true` | `RecipientGroupService.addItem(userId, input, tErrors, locale)` |
| `removeRecipientGroupItem` | `id: ID!` | `Boolean!` | `CERTIFICATES_RECIPIENT_GROUPS_MANAGE`, `notImpersonating: true` | `RecipientGroupService.removeItem(userId, id, tErrors, locale)` |
| `updateRecipientVariableValue` | `input: UpdateRecipientVariableValueInput!` | `RecipientGroupItem!` | `CERTIFICATES_RECIPIENT_GROUPS_MANAGE`, `notImpersonating: true` | `RecipientGroupService.updateVariableValue(userId, input, tErrors, locale)` |

**Mutation Catalog — Certificate Generation & Revocation:**

| Mutation | Args | Return Type | Auth Scope | Service Delegation |
|---|---|---|---|---|
| `generateCertificate` | `input: GenerateCertificateInput!` | `Certificate!` | `CERTIFICATES_GENERATE`, `notImpersonating: true` | `CertificateGenerationService.generate(userId, input, tErrors, locale)` |
| `generateCertificateBatch` | `input: GenerateCertificateBatchInput!` | `CertificateBatchResult!` | `CERTIFICATES_BULK_GENERATE`, `notImpersonating: true` | `CertificateGenerationService.generateBatch(userId, input, tErrors, locale)` |
| `revokeCertificate` | `input: RevokeCertificateInput!` | `Certificate!` | `CERTIFICATES_REVOKE`, `notImpersonating: true` | `CertificateService.revoke(userId, input, tErrors, locale)` |

**Acceptance Criteria:**
- `requireAuth(ctx)` at the top of every mutation resolver.
- All mutations use `{ permission: AppPermission.X, notImpersonating: true }` auth scope combination.
- Resolvers obtain `tErrors` via `ctx.t().errorsTranslations` and `locale` via `ctx.locale`.
- Resolvers never contain business logic — they delegate to services and propagate errors.
- Mutation return types match the service return types from Plan 4.

---

### REQ-05-006: Input Type Definitions

**WHEN** mutations accept complex input, **THE SYSTEM SHALL** define Pothos input types backed by `{Entity}SubmitInput` from `backend/types/`.

**Input Type Catalog:**

| Input Type | Underlying Type | Key Fields |
|---|---|---|
| `CertificateListInput` | `CertificateListInput` | page, pageSize, search, status (filter), studentId (filter), templateId (filter), dateFrom, dateTo, sortBy, sortDir |
| `TemplateListInput` | `TemplateListInput` | page, pageSize, search, status (filter), categoryId (filter), sortBy, sortDir |
| `RecipientGroupListInput` | `RecipientGroupListInput` | page, pageSize, search, templateId (filter), sortBy, sortDir |
| `CertificateVerificationListInput` | `CertificateVerificationListInput` | page, pageSize, certificateId (filter), result (filter), dateFrom, dateTo |
| `CreateTemplateInput` | `CreateTemplateSubmitInput` | name, categoryId, dimensions (width, height), orientation, background (color/imagePath), font (family, size, color), description |
| `UpdateTemplateInput` | `UpdateTemplateSubmitInput` | id, name, categoryId, dimensions, orientation, background, font, description, expectedVersion |
| `CreateTemplateElementInput` | `CreateTemplateElementSubmitInput` | templateId, type, position {x, y, width, height}, zIndex, rotation, content (type-specific: text content, image url, QR data, shape type) |
| `UpdateTemplateElementInput` | `UpdateTemplateElementSubmitInput` | id, templateId, type, position, zIndex, rotation, content, expectedVersion |
| `ReorderTemplateElementsInput` | `ReorderTemplateElementsSubmitInput` | templateId, elementIds (ordered array) |
| `CreateTemplateVariableInput` | `CreateTemplateVariableSubmitInput` | templateId, name, type, defaultValue, required, options (for select type) |
| `UpdateTemplateVariableInput` | `UpdateTemplateVariableSubmitInput` | id, templateId, name, type, defaultValue, required, options, expectedVersion |
| `CreateCategoryInput` | `CreateCategorySubmitInput` | name, parentId (nullable) |
| `UpdateCategoryInput` | `UpdateCategorySubmitInput` | id, name, parentId, expectedVersion |
| `ReorderCategoriesInput` | `ReorderCategoriesSubmitInput` | categoryIds (ordered array) |
| `CreateRecipientGroupInput` | `CreateRecipientGroupSubmitInput` | name, description, templateId |
| `UpdateRecipientGroupInput` | `UpdateRecipientGroupSubmitInput` | id, name, description, expectedVersion |
| `AddRecipientGroupItemInput` | `AddRecipientGroupItemSubmitInput` | groupId, studentId, variableValues (map of variable name → value) |
| `UpdateRecipientVariableValueInput` | `UpdateRecipientVariableValueSubmitInput` | itemId, variableName, value |
| `GenerateCertificateInput` | `GenerateCertificateSubmitInput` | templateId, recipientGroupId, idempotencyKey (optional, auto-derived if absent) |
| `GenerateCertificateBatchInput` | `GenerateCertificateBatchSubmitInput` | templateId, recipientGroupIds (array), idempotencyKey (optional) |
| `RevokeCertificateInput` | `RevokeCertificateSubmitInput` | id, reason, expectedVersion |

**Acceptance Criteria:**
- Each input type uses `inputRef<{Entity}SubmitInput>` from `@/backend/types`.
- Required fields use `required: true`; optional fields use `required: false` or omit.
- `expectedVersion` fields enable optimistic concurrency control.
- `idempotencyKey` is optional on generation inputs (auto-derived by service if absent).
- No local type definitions in Pothos files — all imported from `@/backend/types`.

---

### REQ-05-007: Auth Scope Gating

**WHEN** a resolver is accessed, **THE SYSTEM SHALL** enforce auth scopes at the schema level and call `requireAuth(ctx)` at the resolver top.

**Auth Scope Matrix:**

| Permission Key | Operations Gated |
|---|---|
| `CERTIFICATES_VIEW` | `certificates`, `certificate`, `certificateVerifications` queries |
| `CERTIFICATES_TEMPLATES_VIEW` | `certificateTemplates`, `certificateTemplate`, `certificateCategories` queries |
| `CERTIFICATES_TEMPLATES_MANAGE` | Create/update template, element, variable mutations; clone template |
| `CERTIFICATES_TEMPLATES_PUBLISH` | Publish/archive template mutations |
| `CERTIFICATES_CATEGORIES_MANAGE` | Create/update/delete/reorder category mutations |
| `CERTIFICATES_RECIPIENT_GROUPS_MANAGE` | Recipient group CRUD, add/remove items, update variable values |
| `CERTIFICATES_GENERATE` | `generateCertificate` mutation, `certificateGenerationStatus` query |
| `CERTIFICATES_BULK_GENERATE` | `generateCertificateBatch` mutation |
| `CERTIFICATES_REVOKE` | `revokeCertificate` mutation |
| **PUBLIC (no auth)** | `verifyCertificate` query only |

**Scope Combination Rules:**
- Mutations: `{ permission: AppPermission.X, notImpersonating: true }`
- Authenticated queries: `{ permission: AppPermission.X }`
- Public query (`verifyCertificate`): NO `authScopes` defined
- `superAdmin` scope implicitly passes all `permission` checks via the builder's `authScopes` resolver

**Acceptance Criteria:**
- Every mutation resolver has `notImpersonating: true` in its auth scope (prevents impersonated admin mutations).
- `verifyCertificate` has no auth scope — unauthenticated requests succeed.
- `requireAuth(ctx)` is called in every resolver except `verifyCertificate`.
- `ctx.user.id` is used for service-level authorization (per-actor data scoping).
- Super admins pass all permission checks automatically.

---

### REQ-05-008: Public Verification Endpoint

**WHEN** an unauthenticated client calls `verifyCertificate(code)`, **THE SYSTEM SHALL** return verification-safe data with no sensitive fields.

**Returned Fields (Verification-Safe):**
- `result` — enum: `VALID`, `REVOKED`, `NOT_FOUND`, `EXPIRED`
- `certificate` — nullable, containing ONLY: `id`, `verificationCode`, `status`, `issueDate`, `expiryDate`, `recipientName`, `templateName`
- `verifiedAt` — DateTime (server timestamp)
- `verificationId` — ID of the logged verification entry

**Fields NOT Returned (Security):**
- `studentId`, `studentEmail`, `studentPhone`
- `templateId`, `templateConfig`
- `pdfUrl`, `filePath`
- `revokedReason` (only status = REVOKED)
- `createdByUserId`

**Rate Limiting:**
- Rate limit per IP: 60 requests/minute (configurable via env)
- Rate limit per code: 10 requests/minute (prevents brute-force enumeration)
- Rate limit implementation: service-layer check via cache (Plan 4 service handles rate limiting; GraphQL layer passes `ctx.ipAddress`)

**Acceptance Criteria:**
- No `authScopes` on the `verifyCertificate` query field.
- `ctx.ipAddress` is passed to the verification service for rate limiting and logging.
- Returned data does not leak sensitive student or template configuration information.
- Verification log entry is created (IP, userAgent, timestamp, result) by the service.
- The `CertificateVerificationResult` Pothos object type exposes only the safe fields listed above.

---

### REQ-05-009: Error Handling

**WHEN** an error occurs during GraphQL resolution, **THE SYSTEM SHALL** produce translated error messages with appropriate error codes.

**Error Code Mapping:**

| Error Source | Error Code | Translation Key | Trigger |
|---|---|---|---|
| ScopeAuth (unauthenticated) | `UNAUTHENTICATED` | (builder handles automatically) | No valid session for gated query/mutation |
| ScopeAuth (forbidden) | `FORBIDDEN` | (builder handles automatically) | Authenticated but lacking permission |
| Service — entity not found | `CERTIFICATE_NOT_FOUND` | `errors.cert.certificateNotFound` | Certificate ID doesn't exist |
| Service — entity not found | `TEMPLATE_NOT_FOUND` | `errors.cert.templateNotFound` | Template ID doesn't exist |
| Service — entity not found | `CATEGORY_NOT_FOUND` | `errors.cert.categoryNotFound` | Category ID doesn't exist |
| Service — entity not found | `RECIPIENT_GROUP_NOT_FOUND` | `errors.cert.recipientGroupNotFound` | Recipient group ID doesn't exist |
| Service — validation | (no code) | `errors.cert.invalidTemplate` | Invalid template dimensions/config |
| Service — validation | (no code) | `errors.cert.invalidVariable` | Invalid variable definition |
| Service — generation | (no code) | `errors.cert.generationFailed` | PDF rendering or storage failure |
| Service — duplicate | (no code) | `errors.cert.duplicateCertificate` | Idempotency key collision |
| Service — revocation | (no code) | `errors.cert.alreadyRevoked` | Certificate already revoked |
| Service — status | (no code) | `errors.cert.templateNotPublished` | Attempt to generate from draft template |
| Service — rate limit | `RATE_LIMITED` | `errors.cert.verificationRateLimited` | Verification rate limit exceeded |

**Error Style:**
- Services throw `Error(tErrors.cert.*)` for validation/permission errors (Style 1).
- Services throw `NotFoundError("CERTIFICATE", tErrors.cert.certificateNotFound(id))` for entity not found (Style 2).
- Services NEVER throw `GraphQLError` — they stay SSR-clean.
- Resolvers obtain `tErrors` via `ctx.t().errorsTranslations` and never construct `GraphQLError` directly.
- The Apollo Server route layer wraps service errors into GraphQL errors automatically.

**Acceptance Criteria:**
- All error messages are localized (Arabic + English).
- `UNAUTHENTICATED` vs `FORBIDDEN` discrimination is handled by the builder's `unauthorizedError` callback.
- No hardcoded error strings in resolvers or services.
- Error messages use interpolated parameters (e.g., `certificateNotFound(id)` returns a string with the ID).

---

### REQ-05-010: Response Wrapper Types

**WHEN** paginated list queries are executed, **THE SYSTEM SHALL** return wrapper response types with pagination metadata.

**Pagination Response Types:**

| Response Type | Fields | Used By |
|---|---|---|
| `CertificateListResponse` | items: `[Certificate!]!`, total: `Int!`, page: `Int!`, pageSize: `Int!`, hasMore: `Boolean!` | `certificates` query |
| `TemplateListResponse` | items: `[CertificateTemplate!]!`, total, page, pageSize, hasMore | `certificateTemplates` query |
| `RecipientGroupListResponse` | items: `[RecipientGroup!]!`, total, page, pageSize, hasMore | `recipientGroups` query |
| `CertificateVerificationListResponse` | items: `[CertificateVerification!]!`, total, page, pageSize, hasMore | `certificateVerifications` query |
| `CertificateVerificationResult` | result: `CertificateVerificationResult!`, certificate (nullable), verifiedAt: `DateTime!`, verificationId: `ID` | `verifyCertificate` query |
| `CertificateGenerationStatus` | batchId: `ID!`, total: `Int!`, completed: `Int!`, failed: `Int!`, status: `String!`, items: `[CertificateGenerationItem!]!` | `certificateGenerationStatus` query |
| `CertificateBatchResult` | batchId: `ID!`, total: `Int!`, succeeded: `Int!`, failed: `Int!`, errors: `[CertificateBatchError!]!` | `generateCertificateBatch` mutation |

**Acceptance Criteria:**
- All list response types include pagination metadata.
- `CertificateVerificationResult` exposes only verification-safe fields.
- `CertificateBatchResult` includes per-item error details for batch generation.
- `CertificateGenerationStatus` supports polling for batch progress.

---

### REQ-05-011: Barrel Wiring

**WHEN** certificate Pothos/query/mutation files are created, **THE SYSTEM SHALL** wire them into the three barrel index files.

**Barrel Files to Modify:**

| File | Addition |
|---|---|
| `backend/graphql/pothos/index.ts` | `export * from "@/backend/graphql/pothos/cert"` |
| `backend/graphql/query/index.ts` | `import "./cert"` (side-effect import) |
| `backend/graphql/mutation/index.ts` | `import "./cert"` (side-effect import) |

**New Barrel Files to Create:**

| File | Exports |
|---|---|
| `backend/graphql/pothos/cert/index.ts` | Re-exports all cert Pothos object types + input types |
| `backend/graphql/query/cert/index.ts` | Side-effect imports all cert query files |
| `backend/graphql/mutation/cert/index.ts` | Side-effect imports all cert mutation files |

**Acceptance Criteria:**
- After wiring, `bun run generate:gqlSchema` includes all certificate types/queries/mutations in the SDL.
- `bun codegen` generates frontend TypeScript types for all certificate GraphQL operations.
- HMR works in dev mode (new domain folders are picked up via barrel imports).

---

### REQ-05-012: Schema Generation & Codegen

**WHEN** all Pothos definitions are complete, **THE SYSTEM SHALL** run schema generation and codegen.

**Commands:**
- `bun run generate:gqlSchema` — generates SDL from Pothos schema
- `bun codegen` — generates frontend TypeScript types from SDL

**Acceptance Criteria:**
- SDL file includes all certificate object types, queries, mutations, input types, and enums.
- Codegen produces typed hooks for all queries and mutations.
- No schema compilation errors (duplicate type names, missing imports).

---

## 3. i18n Requirements

### Translation Namespace: `certificates`

All certificate GraphQL error messages use the `errors` namespace with `cert.*` sub-domain keys.

#### Error Translation Keys

| Key | English | Arabic | Parameters |
|---|---|---|---|
| `errors.cert.certificateNotFound` | `"Certificate not found: {id}"` | `"الشهادة غير موجودة: {id}"` | `id: string` |
| `errors.cert.templateNotFound` | `"Template not found: {id}"` | `"القالب غير موجود: {id}"` | `id: string` |
| `errors.cert.categoryNotFound` | `"Category not found: {id}"` | `"الفئة غير موجودة: {id}"` | `id: string` |
| `errors.cert.recipientGroupNotFound` | `"Recipient group not found: {id}"` | `"مجموعة المستلمين غير موجودة: {id}"` | `id: string` |
| `errors.cert.recipientGroupItemNotFound` | `"Recipient group item not found: {id}"` | `"عنصر مجموعة المستلمين غير موجود: {id}"` | `id: string` |
| `errors.cert.templateElementNotFound` | `"Template element not found: {id}"` | `"عنصر القالب غير موجود: {id}"` | `id: string` |
| `errors.cert.templateVariableNotFound` | `"Template variable not found: {id}"` | `"متغير القالب غير موجود: {id}"` | `id: string` |
| `errors.cert.invalidTemplate` | `"Invalid template configuration"` | `"تكوين القالب غير صالح"` | — |
| `errors.cert.invalidVariable` | `"Invalid variable definition"` | `"تعريف المتغير غير صالح"` | — |
| `errors.cert.generationFailed` | `"Certificate generation failed: {reason}"` | `"فشل إنشاء الشهادة: {reason}"` | `reason: string` |
| `errors.cert.duplicateCertificate` | `"Certificate already exists for this recipient"` | `"الشهادة موجودة بالفعل لهذا المستلم"` | — |
| `errors.cert.alreadyRevoked` | `"Certificate is already revoked"` | `"الشهادة ملغاة بالفعل"` | — |
| `errors.cert.templateNotPublished` | `"Template must be published before generating certificates"` | `"يجب نشر القالب قبل إنشاء الشهادات"` | — |
| `errors.cert.cannotDeleteCategoryWithTemplates` | `"Cannot delete category with assigned templates"` | `"لا يمكن حذف فئة تحتوي على قوالب"` | — |
| `errors.cert.cannotDeleteCategoryWithChildren` | `"Cannot delete category with child categories"` | `"لا يمكن حذف فئة تحتوي على فئات فرعية"` | — |
| `errors.cert.cannotArchivePublishedTemplate` | `"Cannot archive template with active certificates"` | `"لا يمكن أرشفة قالب به شهادات نشطة"` | — |
| `errors.cert.verificationRateLimited` | `"Too many verification attempts. Please try again later."` | `"محاولات تحقق كثيرة. يرجى المحاولة لاحقاً."` | — |
| `errors.cert.invalidVerificationCode` | `"Invalid verification code format"` | `"تنسيق رمز التحقق غير صالح"` | — |
| `errors.cert.batchGenerationPartialFailure` | `"Batch generation completed with {failed} of {total} failures"` | `"اكتمل إنشاء الدفعة مع {failed} من {total} إخفاقات"` | `failed: number, total: number` |

#### Pluralization Rules

| Key | English (one/other) | Arabic (zero/one/two/few/many/other) |
|---|---|---|
| `errors.cert.batchFailures` | `(count) => count === 1 ? "{count} failure" : "{count} failures"` | `(count) => { zero: "لا توجد إخفاقات", one: "إخفاق واحد", two: "إخفاقان", few: "{count} إخفاقات", many: "{count} إخفاقاً", other: "{count} إخفاق" }` |

#### File Locations

| Locale | Error Messages File |
|---|---|
| English | `shared/locale/messages/en/errors.cert.ts` |
| Arabic | `shared/locale/messages/ar/errors.cert.ts` |

**Acceptance Criteria:**
- Both `en` and `ar` locale files define all translation keys listed above.
- Interpolation functions accept typed parameters (e.g., `(id: string) => string`).
- Pluralization functions accept `(count: number) => string`.
- Keys are added to the `ErrorsLabels` type schema in `shared/locale/`.
- Services receive `tErrors: ErrorsLabels` and call `tErrors.cert.certificateNotFound(id)` for localized messages.

---

## 4. Outcome Knowledge Base & Progress Tracking

**WHEN** implementation of this plan is complete, **THE SYSTEM SHALL** record outcomes for future reference.

**Knowledge to Capture:**
- Pothos object type patterns for certificate entities (loadableObjectRef vs plain objectRef).
- DataLoader batch method naming and Map return convention for certificate field resolvers.
- Auth scope combinations used for certificate mutations (`permission + notImpersonating`).
- Public endpoint pattern (no authScopes, rate limiting via service, safe field subset).
- Error translation key naming convention (`errors.cert.*`).

**Progress Tracking:**
- Task completion status updates in `tasks.md`.
- Any deviations from the design documented with rationale.

---

## 5. Acceptance Criteria Summary

| # | Criterion |
|---|---|
| AC-1 | 9 Pothos object types defined, each backed by `{Entity}ReturnType` from `@/backend/types` |
| AC-2 | 8 certificate enums registered once each in `shared/enum.pothos.ts` |
| AC-3 | DataLoader batching eliminates N+1 for template.elements, template.variables, category.children, recipientGroup.items |
| AC-4 | 10 queries exposed with correct auth scopes (including 1 public) |
| AC-5 | 24 mutations exposed with `permission + notImpersonating` auth scopes |
| AC-6 | All input types backed by `{Entity}SubmitInput` from `@/backend/types` |
| AC-7 | `verifyCertificate` returns only verification-safe fields |
| AC-8 | All error messages translated (Arabic + English) via `errors.cert.*` keys |
| AC-9 | Barrel wiring complete in `pothos/index.ts`, `query/index.ts`, `mutation/index.ts` |
| AC-10 | `bun run generate:gqlSchema` + `bun codegen` succeed with no errors |
| AC-11 | `requireAuth(ctx)` called in every resolver except `verifyCertificate` |
| AC-12 | No business logic in resolvers — all delegation to service layer |
| AC-13 | No hardcoded enum values or local type definitions in `*.pothos.ts` files |
| AC-14 | No `GraphQLError` thrown from services (SSR-clean) |
