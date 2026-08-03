# Requirements: Certificate GraphQL API (Plan 05)

## Document Information

- **Feature Name**: Certificate GraphQL API Layer
- **Target Directory**: `.ai/draft_plans/cert/plans/05-graphql-api`
- **Outcome Directory**: `.ai/draft_plans/cert/plans/05-graphql-api/outcome`
- **Version**: 1.0
- **Date**: 2025-01-20
- **Author**: Siraj Development Team
- **Stakeholders**: Backend team, Frontend team, Certificate feature team
- **Related Documents**:
  - Analysis: `.ai/draft_plans/cert/siraj_analysis/04-services-graphql-patterns.md` (sections C–G)
  - Analysis: `.ai/draft_plans/cert/cgvs_analysis/03-graphql-api.md` (operation reference)
  - Analysis: `.ai/draft_plans/cert/siraj_analysis/02-types-enums-patterns.md` (type patterns & permissions)
  - Dependencies: Plan 02 (Types & Permissions) — `backend/types/certificates/` and `backend/enum/certificates/`
  - Dependencies: Plan 04 (Services & Business Logic) — `backend/services/certificates/`

## Introduction

The certificate GraphQL API layer exposes all certificate domain operations to frontend clients via Pothos code-first schema definitions. This plan covers the creation of GraphQL object types, input types, query resolvers, mutation resolvers, DataLoader batch resolvers, enum registration, and barrel registration — all following Siraj's established Pothos patterns (code-first, `loadableObjectRef`, `inputRef`, centralized backend types, `authScopes.permission`, `requireAuth`, `ctx.t()` for localized errors).

The API serves two distinct audiences:
1. **Authenticated staff** (admins, supervisors, teachers) who manage templates, generate certificates, and manage recipient groups — gated by `CERTIFICATES_*` permissions.
2. **Public visitors** who verify certificate authenticity via a `verifyCertificate` query — no auth required, returns limited certificate information.

### Feature Summary

Create 7 Pothos files in `backend/graphql/pothos/certificates/`, register 8 certificate enums in `backend/graphql/pothos/shared/enum.pothos.ts`, register query and mutation barrels in `backend/graphql/query/index.ts` and `backend/graphql/mutation/index.ts`, register Pothos barrel in `backend/graphql/pothos/index.ts`, and run GraphQL code generation (`bun run generate:gqlSchema` + `bun codegen`).

### Business Value

- Exposes certificate management operations to the frontend via typed, secure GraphQL API
- Enables public certificate verification without authentication (trust-building for certificate holders)
- Prevents N+1 queries via DataLoader batch resolvers for template elements, variables, and recipient groups
- Enforces permission-based access control at the schema level via `authScopes`

### Scope

**In Scope:**
- Pothos object types: Certificate, CertificateList, CertificateTemplate, CertificateTemplateElement, CertificateTemplateVariable, CertificateVerificationResult, CertificateRecipientGroup
- Pothos input types matching `SubmitInput` types from Plan 02
- Query resolvers: `certificates`, `certificate`, `certificateTemplates`, `certificateTemplate`, `verifyCertificate` (public), `certificateCategories`, `certificateRecipientGroups`
- Mutation resolvers: `createCertificateTemplate`, `updateCertificateTemplate`, `publishCertificateTemplate`, `archiveCertificateTemplate`, `generateCertificate`, `revokeCertificate`, `verifyCertificateByCode` (public), `createRecipientGroup`, `updateRecipientGroup`, `deleteRecipientGroup`
- DataLoader batch resolvers for template elements, variables, and recipient groups
- Enum registration in `pothos/shared/enum.pothos.ts`
- Barrel registration in `query/index.ts`, `mutation/index.ts`, and `pothos/index.ts`
- GraphQL code generation (`bun run generate:gqlSchema` + `bun codegen`)

**Out of Scope:**
- Database schema or migrations (Plan 01)
- Type definitions or enums themselves (Plan 02)
- Repository layer (Plan 03)
- Service layer business logic (Plan 04)
- Frontend views, stores, or components (Plan 07+)
- GraphQL integration tests (Plan 10)
- PDF rendering engine (Plan 06)

### Glossary

| Term | Definition |
|------|------------|
| `loadableObjectRef` | Pothos helper that creates a DataLoader-backed object type, batching single-entity loads by ID |
| `inputRef` | Pothos helper that creates a GraphQL input type from a centralized TypeScript type |
| `authScopes.permission` | ScopeAuth plugin scope that checks `AppPermission` enum value; super_admin auto-allowed via builder callback |
| `requireAuth(ctx)` | Utility that extracts `userId` from context or throws `tErrors.unauthorized` |
| `ctx.t()` | Context-bound translation function yielding localized error labels |
| Public query | A query field with no `authScopes` defined — accessible without authentication |

---

## Requirements

### Requirement 0: Execution Outcome Protocol & Task Progress Tracking

**User Story:** As an AI agent or developer, I want persistent task outcome tracking and progress updates, so that subsequent tasks do not repeat past research or analysis.

#### Acceptance Criteria

1. WHEN an executing agent starts any task THEN system SHALL read ALL existing outcome files in `.ai/draft_plans/cert/plans/05-graphql-api/outcome/` to absorb prior research, search results, and pitfalls.
2. WHEN an executing agent completes any task THEN system SHALL write a new outcome document under `.ai/draft_plans/cert/plans/05-graphql-api/outcome/<task-id>-outcome.md` detailing research findings, implementation details, pattern decisions, and carry-over points.
3. WHEN an executing agent completes any subtask THEN system SHALL update the corresponding task checkbox `[ ]` -> `[x]` in `tasks.md`.
4. WHEN any file is modified THEN system SHALL execute per-file verification (`tsgo` + `biome` + `lint-queue`) on that specific file.
5. WHEN any subtask is completed THEN system SHALL execute `bun tsgo`, `bun biome:check`, and `bun run lint` globally, exiting with zero errors and zero warnings.

---

### Requirement 1: Certificate Object Type with DataLoader

**User Story:** As a frontend developer, I want a `Certificate` GraphQL object type backed by DataLoader, so that querying certificates by ID avoids N+1 database queries.

#### Acceptance Criteria

1. WHEN the `Certificate` object type is defined THEN system SHALL use `gqlSchemaBuilder.loadableObjectRef<CertificateReturnType, string>("Certificate", { load, sort })` with `load` delegating to `CertificateRepository.loadByIds(ids)` and `sort` by `c => c.id`.
2. WHEN the `Certificate` object type is implemented THEN system SHALL expose an `id` field (non-nullable string) on every instance for Apollo cache normalization.
3. WHEN the `Certificate` object type is implemented THEN system SHALL expose fields: `id`, `verificationCode`, `status` (CertificateStatusPothosEnum), `resolution` (CertificateResolutionPothosEnum, nullable), `studentId`, `templateId`, `recipientGroupId`, `issueDate` (DateTime), `revokedAt` (DateTime, nullable), `revocationReason` (string, nullable), `fileUrl` (string, nullable — resolved via StorageService signed URL), `createdAt` (DateTime), `updatedAt` (DateTime, nullable), `version` (int).
4. WHEN a certificate's `fileUrl` field is resolved THEN system SHALL call the storage service to generate a signed URL for the certificate's `filePath` column.
5. WHEN the `Certificate` object type is defined THEN system SHALL import types from `@/backend/types` (`CertificateReturnType`) — never define ad-hoc types in Pothos files.

#### Additional Details
- **Priority**: High
- **Complexity**: Medium
- **Dependencies**: Plan 02 (`CertificateReturnType`), Plan 03 (`CertificateRepository.loadByIds`), Plan 04 (StorageService)
- **Assumptions**: `CertificateRepository.loadByIds(ids: string[]): Promise<(CertificateReturnType | null)[]>` exists from Plan 03.

---

### Requirement 2: Certificate List & Pagination Object Types

**User Story:** As a frontend developer, I want a paginated certificate list response type, so that I can display certificate lists with page metadata.

#### Acceptance Criteria

1. WHEN the `CertificatesWithFiltersResponse` object type is defined THEN system SHALL use `gqlSchemaBuilder.objectRef<CertificatesWithFiltersResponse>("CertificatesWithFiltersResponse")` with fields `data` (list of `[CertificatePothosObject]`) and `pageInfo` (PageInfoObject).
2. WHEN the `CertificateFilterArgs` input type is defined THEN system SHALL use `gqlSchemaBuilder.inputRef<CertificateFilterArgs>("CertificateFilterArgs")` with fields matching the centralized type: `status` (CertificateStatusPothosEnum, nullable), `templateId` (string, nullable), `studentId` (string, nullable), `search` (string, nullable), `issuedFrom` (DateTime, nullable), `issuedTo` (DateTime, nullable).
3. WHEN a certificate list query is executed THEN system SHALL accept `PaginationArgs`, `CertificateFilterArgs`, and an optional `orderBy` clause.
4. WHEN the PageInfoObject is referenced THEN system SHALL import it from `@/backend/graphql/pothos/shared/pagination.objects` — not redefine it.

#### Additional Details
- **Priority**: High
- **Complexity**: Medium
- **Dependencies**: Plan 02 (`CertificatesWithFiltersResponse`, `CertificateFilterArgs`, `CertificateOrderByClause`)

---

### Requirement 3: Certificate Template Object Types

**User Story:** As a frontend developer, I want certificate template GraphQL object types, so that I can query and manage certificate template designs and their elements/variables.

#### Acceptance Criteria

1. WHEN the `CertificateTemplate` object type is defined THEN system SHALL use `gqlSchemaBuilder.loadableObjectRef<CertificateTemplateReturnType, string>("CertificateTemplate", { load, sort })` with `load` delegating to `CertificateTemplateRepository.loadByIds(ids)` and `sort` by `t => t.id`.
2. WHEN the `CertificateTemplate` object type is implemented THEN system SHALL expose: `id`, `name` (string — localized display), `description` (string, nullable), `status` (TemplateStatusPothosEnum), `orientation` (CertificateOrientationPothosEnum), `width` (int), `height` (int), `backgroundColor` (string, nullable), `fontFamily` (string, nullable), `categoryId` (string, nullable), `createdByUserId` (string), `version` (int), `createdAt` (DateTime), `updatedAt` (DateTime, nullable), `publishedAt` (DateTime, nullable).
3. WHEN the `CertificateTemplateElement` object type is defined THEN system SHALL use `gqlSchemaBuilder.objectRef<CertificateTemplateElementReturnType>("CertificateTemplateElement")` (no DataLoader — elements are loaded via batch field resolver).
4. WHEN the `CertificateTemplateElement` object type is implemented THEN system SHALL expose: `id`, `templateId`, `elementType` (TemplateElementTypePothosEnum), `label` (string, nullable), `content` (string, nullable), `xPosition` (float), `yPosition` (float), `width` (float, nullable), `height` (float, nullable), `rotation` (float, nullable), `fontSize` (int, nullable), `fontWeight` (string, nullable), `color` (string, nullable), `imageFileId` (string, nullable), `zIndex` (int), `createdAt` (DateTime), `updatedAt` (DateTime, nullable).
5. WHEN the `CertificateTemplateVariable` object type is defined THEN system SHALL use `gqlSchemaBuilder.objectRef<CertificateTemplateVariableReturnType>("CertificateTemplateVariable")` (no DataLoader — variables loaded via batch field resolver).
6. WHEN the `CertificateTemplateVariable` object type is implemented THEN system SHALL expose: `id`, `templateId`, `variableKey` (string), `variableType` (TemplateVariableTypePothosEnum), `label` (string, nullable), `defaultValue` (string, nullable), `required` (boolean), `options` (list of strings, nullable), `minValue` (float, nullable), `maxValue` (float, nullable), `createdAt` (DateTime), `updatedAt` (DateTime, nullable).
7. WHEN all template object types are defined THEN each SHALL expose an `id` field (non-nullable string) for Apollo cache normalization.
8. WHEN any template object type is defined THEN system SHALL import types from `@/backend/types` — never define ad-hoc types in Pothos files.

#### Additional Details
- **Priority**: High
- **Complexity**: Medium
- **Dependencies**: Plan 02 (`CertificateTemplateReturnType`, `CertificateTemplateElementReturnType`, `CertificateTemplateVariableReturnType`), Plan 03 (`CertificateTemplateRepository.loadByIds`)
- **Assumptions**: Template element and variable return types exist in `backend/types/certificates/` from Plan 02.

---

### Requirement 4: Certificate Verification Result Object Type

**User Story:** As a frontend developer, I want a `CertificateVerificationResult` object type, so that the public verification page can display certificate validity status and limited certificate information.

#### Acceptance Criteria

1. WHEN the `CertificateVerificationResult` object type is defined THEN system SHALL use `gqlSchemaBuilder.objectRef<CertificateVerificationResultReturnType>("CertificateVerificationResult")`.
2. WHEN the `CertificateVerificationResult` object type is implemented THEN system SHALL expose ONLY: `valid` (boolean, non-nullable), `status` (CertificateVerificationStatusPothosEnum, non-nullable), `certificateTitle` (string, nullable — only when valid), `recipientName` (string, nullable — only when valid), `issueDate` (DateTime, nullable — only when valid), `templateName` (string, nullable — only when valid), `verificationCode` (string, non-nullable — echoes the queried code).
3. WHEN the verification result is for a not-found or revoked certificate THEN system SHALL NOT expose sensitive fields (studentId, templateId, fileUrl) — only `valid`, `status`, and `verificationCode`.
4. WHEN the `CertificateVerificationResult` object type is defined THEN system SHALL import the return type from `@/backend/types` (`CertificateVerificationResultReturnType`).

#### Additional Details
- **Priority**: High
- **Complexity**: Low
- **Dependencies**: Plan 02 (`CertificateVerificationResultReturnType`), Plan 04 (`CertificateVerificationService.verifyCertificate`)
- **Assumptions**: The verification service returns a DTO with only public-safe fields.

---

### Requirement 5: Certificate Recipient Group Object Type

**User Story:** As a frontend developer, I want a `CertificateRecipientGroup` GraphQL object type, so that I can manage groups of recipients for batch certificate generation.

#### Acceptance Criteria

1. WHEN the `CertificateRecipientGroup` object type is defined THEN system SHALL use `gqlSchemaBuilder.objectRef<CertificateRecipientGroupReturnType>("CertificateRecipientGroup")` (no DataLoader — loaded via query resolver or list field).
2. WHEN the `CertificateRecipientGroup` object type is implemented THEN system SHALL expose: `id`, `templateId`, `name` (string), `description` (string, nullable), `recipientCount` (int — resolved count), `createdAt` (DateTime), `updatedAt` (DateTime, nullable).
3. WHEN the `recipientCount` field is resolved THEN system SHALL call a batch service method `RecipientGroupService.getRecipientCounts(groupIds: string[]): Promise<Map<string, number>>` to avoid N+1 queries.
4. WHEN the `CertificateRecipientGroup` object type is defined THEN system SHALL import the return type from `@/backend/types` (`CertificateRecipientGroupReturnType`).

#### Additional Details
- **Priority**: Medium
- **Complexity**: Low
- **Dependencies**: Plan 02 (`CertificateRecipientGroupReturnType`), Plan 04 (`RecipientGroupService`)

---

### Requirement 6: Query — Certificates List (Paginated with Filters)

**User Story:** As an authenticated staff member with the `CERTIFICATES_LIST` permission, I want to query a paginated list of certificates with filters, so that I can browse and manage issued certificates.

#### Acceptance Criteria

1. WHEN the `certificates` query field is defined THEN system SHALL use `gqlSchemaBuilder.queryField("certificates", t => t.field({ ... }))`.
2. WHEN the `certificates` query is defined THEN system SHALL set `authScopes: { loggedIn: true }` — any authenticated user may list certificates (service layer enforces fine-grained permission).
3. WHEN the `certificates` query resolver is executed THEN system SHALL call `requireAuth(ctx)` at the top to extract the authenticated user ID.
4. WHEN the `certificates` query resolver is executed THEN system SHALL call `CertificateService.listCertificates(userId, args, ctx.t().errorsTranslations)` — delegating all business logic to the service.
5. WHEN the `certificates` query is defined THEN system SHALL accept args: `pagination` (PaginationArgsObject), `filter` (CertificateFilterArgsPothosObject, nullable), `orderBy` (CertificateOrderByClause list, nullable).
6. WHEN the `certificates` query is defined THEN system SHALL return type `CertificatesWithFiltersPothosObject` (non-nullable).
7. WHEN the resolver is executed THEN system SHALL obtain localized errors via `ctx.t().errorsTranslations` — never hardcode error strings.

#### Additional Details
- **Priority**: High
- **Complexity**: Medium
- **Dependencies**: Plan 04 (`CertificateService.listCertificates`)
- **Pattern**: Mirrors `students` query field pattern from `student.pothos.ts`.

---

### Requirement 7: Query — Certificate by ID

**User Story:** As an authenticated staff member, I want to query a single certificate by its ID, so that I can view certificate details.

#### Acceptance Criteria

1. WHEN the `certificate` query field is defined THEN system SHALL use `gqlSchemaBuilder.queryField("certificate", t => t.field({ ... }))`.
2. WHEN the `certificate` query is defined THEN system SHALL set `authScopes: { loggedIn: true }`.
3. WHEN the `certificate` query resolver is executed THEN system SHALL call `requireAuth(ctx)` first, then delegate to `CertificateService.getCertificateById(userId, args.id, ctx.t().errorsTranslations)`.
4. WHEN the `certificate` query is defined THEN system SHALL accept arg `id` (string, required) and return type `CertificatePothosObject` (nullable — returns null if not found).
5. WHEN the resolver is executed THEN system SHALL obtain localized errors via `ctx.t().errorsTranslations`.

#### Additional Details
- **Priority**: High
- **Complexity**: Low
- **Dependencies**: Plan 04 (`CertificateService.getCertificateById`)
- **Pattern**: Mirrors `invoicePaymentSubmission` query from `billing-management.pothos.ts`.

---

### Requirement 8: Query — Certificate Templates List (Paginated)

**User Story:** As an authenticated staff member, I want to query a paginated list of certificate templates, so that I can browse and manage template designs.

#### Acceptance Criteria

1. WHEN the `certificateTemplates` query field is defined THEN system SHALL use `gqlSchemaBuilder.queryField("certificateTemplates", t => t.field({ ... }))`.
2. WHEN the `certificateTemplates` query is defined THEN system SHALL set `authScopes: { loggedIn: true }`.
3. WHEN the `certificateTemplates` query resolver is executed THEN system SHALL call `requireAuth(ctx)` first, then delegate to `CertificateTemplateService.listTemplates(userId, args, ctx.t().errorsTranslations)`.
4. WHEN the `certificateTemplates` query is defined THEN system SHALL accept args: `pagination` (PaginationArgsObject), `filter` (CertificateTemplateFilterArgsPothosObject, nullable), `orderBy` (list, nullable).
5. WHEN the `certificateTemplates` query is defined THEN system SHALL return type `CertificateTemplatesWithFiltersPothosObject` (non-nullable).
6. WHEN the resolver is executed THEN system SHALL obtain localized errors via `ctx.t().errorsTranslations`.

#### Additional Details
- **Priority**: High
- **Complexity**: Medium
- **Dependencies**: Plan 04 (`CertificateTemplateService.listTemplates`)
- **Pattern**: Mirrors `students` query pattern.

---

### Requirement 9: Query — Certificate Template by ID

**User Story:** As an authenticated staff member, I want to query a single certificate template by its ID, so that I can view or edit template details including elements and variables.

#### Acceptance Criteria

1. WHEN the `certificateTemplate` query field is defined THEN system SHALL use `gqlSchemaBuilder.queryField("certificateTemplate", t => t.field({ ... }))`.
2. WHEN the `certificateTemplate` query is defined THEN system SHALL set `authScopes: { loggedIn: true }`.
3. WHEN the `certificateTemplate` query resolver is executed THEN system SHALL call `requireAuth(ctx)` first, then delegate to `CertificateTemplateService.getTemplateById(userId, args.id, ctx.t().errorsTranslations)`.
4. WHEN the `certificateTemplate` query is defined THEN system SHALL accept arg `id` (string, required) and return type `CertificateTemplatePothosObject` (nullable).
5. WHEN the resolver is executed THEN system SHALL obtain localized errors via `ctx.t().errorsTranslations`.

#### Additional Details
- **Priority**: High
- **Complexity**: Low
- **Dependencies**: Plan 04 (`CertificateTemplateService.getTemplateById`)
- **Pattern**: Mirrors `certificate` query pattern.

---

### Requirement 10: Query — Public Certificate Verification (No Auth)

**User Story:** As a public visitor with a verification code, I want to verify a certificate's authenticity, so that I can confirm the certificate is valid without needing to log in.

#### Acceptance Criteria

1. WHEN the `verifyCertificate` query field is defined THEN system SHALL use `gqlSchemaBuilder.queryField("verifyCertificate", t => t.field({ ... }))`.
2. WHEN the `verifyCertificate` query is defined THEN system SHALL NOT set any `authScopes` — this is a public query accessible without authentication.
3. WHEN the `verifyCertificate` query resolver is executed THEN system SHALL NOT call `requireAuth(ctx)` — no authenticated user is required.
4. WHEN the `verifyCertificate` query resolver is executed THEN system SHALL delegate to `CertificateVerificationService.verifyCertificate(args.verificationCode, ctx.t().errorsTranslations)`.
5. WHEN the `verifyCertificate` query is defined THEN system SHALL accept arg `verificationCode` (string, required) and return type `CertificateVerificationResultPothosObject` (non-nullable).
6. WHEN the verification result is returned THEN system SHALL NOT include sensitive fields (studentId, templateId, fileUrl, recipientGroupId) — only public-safe fields per Requirement 4.
7. WHEN the resolver is executed THEN system SHALL obtain localized errors via `ctx.t().errorsTranslations` — even public queries use context-bound translations.

#### Additional Details
- **Priority**: High
- **Complexity**: Low
- **Dependencies**: Plan 04 (`CertificateVerificationService.verifyCertificate`)
- **Pattern**: Public query — no authScopes, no requireAuth. Mirrors analysis §D.4.
- **Security**: Returns only `valid`, `status`, `certificateTitle`, `recipientName`, `issueDate`, `templateName`, `verificationCode`.

---

### Requirement 11: Query — Certificate Categories

**User Story:** As an authenticated staff member, I want to query certificate categories, so that I can categorize and organize certificate templates.

#### Acceptance Criteria

1. WHEN the `certificateCategories` query field is defined THEN system SHALL use `gqlSchemaBuilder.queryField("certificateCategories", t => t.field({ ... }))`.
2. WHEN the `certificateCategories` query is defined THEN system SHALL set `authScopes: { loggedIn: true }`.
3. WHEN the `certificateCategories` query resolver is executed THEN system SHALL call `requireAuth(ctx)` first, then delegate to `CertificateTemplateService.listCategories(userId, ctx.t().errorsTranslations)`.
4. WHEN the `certificateCategories` query is defined THEN system SHALL return type `[CertificateCategoryPothosObject]` (list, non-nullable).
5. WHEN the resolver is executed THEN system SHALL obtain localized errors via `ctx.t().errorsTranslations`.

#### Additional Details
- **Priority**: Medium
- **Complexity**: Low
- **Dependencies**: Plan 04 (`CertificateTemplateService.listCategories`)

---

### Requirement 12: Query — Certificate Recipient Groups

**User Story:** As an authenticated staff member, I want to query certificate recipient groups, so that I can manage groups of recipients for batch certificate generation.

#### Acceptance Criteria

1. WHEN the `certificateRecipientGroups` query field is defined THEN system SHALL use `gqlSchemaBuilder.queryField("certificateRecipientGroups", t => t.field({ ... }))`.
2. WHEN the `certificateRecipientGroups` query is defined THEN system SHALL set `authScopes: { loggedIn: true }`.
3. WHEN the `certificateRecipientGroups` query resolver is executed THEN system SHALL call `requireAuth(ctx)` first, then delegate to `RecipientGroupService.listRecipientGroups(userId, args, ctx.t().errorsTranslations)`.
4. WHEN the `certificateRecipientGroups` query is defined THEN system SHALL accept arg `templateId` (string, nullable) and return type `[CertificateRecipientGroupPothosObject]` (list).
5. WHEN the resolver is executed THEN system SHALL obtain localized errors via `ctx.t().errorsTranslations`.

#### Additional Details
- **Priority**: Medium
- **Complexity**: Low
- **Dependencies**: Plan 04 (`RecipientGroupService.listRecipientGroups`)

---

### Requirement 13: Mutation — Create Certificate Template

**User Story:** As an administrator with the `CERTIFICATES_TEMPLATES_MANAGE` permission, I want to create a new certificate template, so that I can design certificate layouts for issuance.

#### Acceptance Criteria

1. WHEN the `createCertificateTemplate` mutation field is defined THEN system SHALL use `gqlSchemaBuilder.mutationField("createCertificateTemplate", t => t.field({ ... }))`.
2. WHEN the `createCertificateTemplate` mutation is defined THEN system SHALL set `authScopes: { permission: AppPermission.CERTIFICATES_TEMPLATES_MANAGE, notImpersonating: true }`.
3. WHEN the `createCertificateTemplate` mutation resolver is executed THEN system SHALL call `requireAuth(ctx)` first, then delegate to `CertificateTemplateService.createTemplate(userId, args.input, ctx.t().errorsTranslations)`.
4. WHEN the `createCertificateTemplate` mutation is defined THEN system SHALL accept arg `input` (CreateCertificateTemplateInputRef, required) and return type `CertificateTemplatePothosObject`.
5. WHEN the input type is defined THEN system SHALL use `gqlSchemaBuilder.inputRef<CreateCertificateTemplateSubmitInput>("CreateCertificateTemplateInput")` with fields matching the centralized type from Plan 02.
6. WHEN the resolver is executed THEN system SHALL obtain localized errors via `ctx.t().errorsTranslations`.
7. WHEN the super_admin user invokes this mutation THEN system SHALL auto-allow via the `authScopes.permission` callback — no explicit super_admin check needed in the resolver.

#### Additional Details
- **Priority**: High
- **Complexity**: Medium
- **Dependencies**: Plan 02 (`CreateCertificateTemplateSubmitInput`), Plan 04 (`CertificateTemplateService.createTemplate`)
- **Pattern**: Mirrors `createManualInvoice` mutation from `billing-management.pothos.ts`.

---

### Requirement 14: Mutation — Update Certificate Template

**User Story:** As an administrator with the `CERTIFICATES_TEMPLATES_MANAGE` permission, I want to update a certificate template, so that I can modify template designs.

#### Acceptance Criteria

1. WHEN the `updateCertificateTemplate` mutation field is defined THEN system SHALL use `gqlSchemaBuilder.mutationField("updateCertificateTemplate", t => t.field({ ... }))`.
2. WHEN the mutation is defined THEN system SHALL set `authScopes: { permission: AppPermission.CERTIFICATES_TEMPLATES_MANAGE, notImpersonating: true }`.
3. WHEN the resolver is executed THEN system SHALL call `requireAuth(ctx)` first, then delegate to `CertificateTemplateService.updateTemplate(userId, args.input, ctx.t().errorsTranslations)`.
4. WHEN the mutation is defined THEN system SHALL accept arg `input` (UpdateCertificateTemplateInputRef, required) containing `id` and partial update fields, and return type `CertificateTemplatePothosObject` (nullable).
5. WHEN the input type is defined THEN system SHALL use `gqlSchemaBuilder.inputRef<UpdateCertificateTemplateSubmitInput>("UpdateCertificateTemplateInput")`.
6. WHEN the resolver is executed THEN system SHALL obtain localized errors via `ctx.t().errorsTranslations`.

#### Additional Details
- **Priority**: High
- **Complexity**: Medium
- **Dependencies**: Plan 02 (`UpdateCertificateTemplateSubmitInput`), Plan 04 (`CertificateTemplateService.updateTemplate`)
- **Pattern**: Mirrors `partiallyUpdateStudent` pattern — partial update with `id` and optional fields.

---

### Requirement 15: Mutation — Publish Certificate Template

**User Story:** As an administrator with the `CERTIFICATES_TEMPLATES_MANAGE` permission, I want to publish a certificate template, so that it becomes available for certificate generation.

#### Acceptance Criteria

1. WHEN the `publishCertificateTemplate` mutation field is defined THEN system SHALL use `gqlSchemaBuilder.mutationField("publishCertificateTemplate", t => t.field({ ... }))`.
2. WHEN the mutation is defined THEN system SHALL set `authScopes: { permission: AppPermission.CERTIFICATES_TEMPLATES_MANAGE, notImpersonating: true }`.
3. WHEN the resolver is executed THEN system SHALL call `requireAuth(ctx)` first, then delegate to `CertificateTemplateService.publishTemplate(userId, args.id, args.expectedVersion, ctx.t().errorsTranslations)`.
4. WHEN the mutation is defined THEN system SHALL accept args `id` (string, required) and `expectedVersion` (int, nullable — optimistic concurrency), and return type `CertificateTemplatePothosObject`.
5. WHEN the resolver is executed THEN system SHALL obtain localized errors via `ctx.t().errorsTranslations`.

#### Additional Details
- **Priority**: High
- **Complexity**: Low
- **Dependencies**: Plan 04 (`CertificateTemplateService.publishTemplate`)
- **Pattern**: Mirrors `approvePaymentProof` mutation pattern with `expectedVersion`.

---

### Requirement 16: Mutation — Archive Certificate Template

**User Story:** As an administrator with the `CERTIFICATES_TEMPLATES_MANAGE` permission, I want to archive a certificate template, so that it is no longer available for new certificate generation but preserved for historical reference.

#### Acceptance Criteria

1. WHEN the `archiveCertificateTemplate` mutation field is defined THEN system SHALL use `gqlSchemaBuilder.mutationField("archiveCertificateTemplate", t => t.field({ ... }))`.
2. WHEN the mutation is defined THEN system SHALL set `authScopes: { permission: AppPermission.CERTIFICATES_TEMPLATES_MANAGE, notImpersonating: true }`.
3. WHEN the resolver is executed THEN system SHALL call `requireAuth(ctx)` first, then delegate to `CertificateTemplateService.archiveTemplate(userId, args.id, args.expectedVersion, ctx.t().errorsTranslations)`.
4. WHEN the mutation is defined THEN system SHALL accept args `id` (string, required) and `expectedVersion` (int, nullable), and return type `CertificateTemplatePothosObject`.
5. WHEN the resolver is executed THEN system SHALL obtain localized errors via `ctx.t().errorsTranslations`.

#### Additional Details
- **Priority**: Medium
- **Complexity**: Low
- **Dependencies**: Plan 04 (`CertificateTemplateService.archiveTemplate`)
- **Pattern**: Mirrors `deleteInvoice` mutation pattern.

---

### Requirement 17: Mutation — Generate Certificate

**User Story:** As an administrator with the `CERTIFICATES_GENERATE` permission, I want to generate a certificate from a template for a recipient group, so that certificates can be issued in batch or individually.

#### Acceptance Criteria

1. WHEN the `generateCertificate` mutation field is defined THEN system SHALL use `gqlSchemaBuilder.mutationField("generateCertificate", t => t.field({ ... }))`.
2. WHEN the mutation is defined THEN system SHALL set `authScopes: { permission: AppPermission.CERTIFICATES_GENERATE, notImpersonating: true }`.
3. WHEN the resolver is executed THEN system SHALL call `requireAuth(ctx)` first, then delegate to `CertificateGenerationService.generateCertificate(userId, args.input, ctx.t().errorsTranslations, ctx.locale)`.
4. WHEN the mutation is defined THEN system SHALL accept arg `input` (GenerateCertificateInputRef, required) with fields: `templateId` (string, required), `recipientGroupId` (string, required), `idempotencyKey` (string, nullable — auto-derived if absent).
5. WHEN the input type is defined THEN system SHALL use `gqlSchemaBuilder.inputRef<GenerateCertificateSubmitInput>("GenerateCertificateInput")`.
6. WHEN the mutation is defined THEN system SHALL return type `CertificatePothosObject`.
7. WHEN the resolver is executed THEN system SHALL pass `ctx.locale` to the service for localized PDF rendering.
8. WHEN the resolver is executed THEN system SHALL obtain localized errors via `ctx.t().errorsTranslations`.

#### Additional Details
- **Priority**: High
- **Complexity**: Medium
- **Dependencies**: Plan 02 (`GenerateCertificateSubmitInput`), Plan 04 (`CertificateGenerationService.generateCertificate`)
- **Pattern**: Mirrors `createManualInvoice` mutation — includes `idempotencyKey` for deduplication.

---

### Requirement 18: Mutation — Revoke Certificate

**User Story:** As an administrator with the `CERTIFICATES_REVOKE` permission, I want to revoke a certificate, so that its verification status changes to REVOKED and the public verification page reflects this.

#### Acceptance Criteria

1. WHEN the `revokeCertificate` mutation field is defined THEN system SHALL use `gqlSchemaBuilder.mutationField("revokeCertificate", t => t.field({ ... }))`.
2. WHEN the mutation is defined THEN system SHALL set `authScopes: { permission: AppPermission.CERTIFICATES_REVOKE, notImpersonating: true }`.
3. WHEN the resolver is executed THEN system SHALL call `requireAuth(ctx)` first, then delegate to `CertificateService.revokeCertificate(userId, args.id, args.reason, args.expectedVersion, ctx.t().errorsTranslations)`.
4. WHEN the mutation is defined THEN system SHALL accept args: `id` (string, required), `reason` (string, nullable), `expectedVersion` (int, nullable).
5. WHEN the mutation is defined THEN system SHALL return type `CertificatePothosObject`.
6. WHEN the resolver is executed THEN system SHALL obtain localized errors via `ctx.t().errorsTranslations`.

#### Additional Details
- **Priority**: High
- **Complexity**: Low
- **Dependencies**: Plan 04 (`CertificateService.revokeCertificate`)
- **Pattern**: Mirrors `rejectPaymentProof` mutation pattern.

---

### Requirement 19: Mutation — Create Recipient Group

**User Story:** As an administrator with the `CERTIFICATES_MANAGE` permission, I want to create a recipient group, so that I can batch-generate certificates for a group of recipients.

#### Acceptance Criteria

1. WHEN the `createRecipientGroup` mutation field is defined THEN system SHALL use `gqlSchemaBuilder.mutationField("createRecipientGroup", t => t.field({ ... }))`.
2. WHEN the mutation is defined THEN system SHALL set `authScopes: { permission: AppPermission.CERTIFICATES_MANAGE, notImpersonating: true }`.
3. WHEN the resolver is executed THEN system SHALL call `requireAuth(ctx)` first, then delegate to `RecipientGroupService.createRecipientGroup(userId, args.input, ctx.t().errorsTranslations)`.
4. WHEN the mutation is defined THEN system SHALL accept arg `input` (CreateRecipientGroupInputRef, required) and return type `CertificateRecipientGroupPothosObject`.
5. WHEN the input type is defined THEN system SHALL use `gqlSchemaBuilder.inputRef<CreateRecipientGroupSubmitInput>("CreateRecipientGroupInput")`.
6. WHEN the resolver is executed THEN system SHALL obtain localized errors via `ctx.t().errorsTranslations`.

#### Additional Details
- **Priority**: Medium
- **Complexity**: Medium
- **Dependencies**: Plan 02 (`CreateRecipientGroupSubmitInput`), Plan 04 (`RecipientGroupService.createRecipientGroup`)

---

### Requirement 20: Mutation — Update Recipient Group

**User Story:** As an administrator with the `CERTIFICATES_MANAGE` permission, I want to update a recipient group, so that I can modify its name, description, or recipient membership.

#### Acceptance Criteria

1. WHEN the `updateRecipientGroup` mutation field is defined THEN system SHALL use `gqlSchemaBuilder.mutationField("updateRecipientGroup", t => t.field({ ... }))`.
2. WHEN the mutation is defined THEN system SHALL set `authScopes: { permission: AppPermission.CERTIFICATES_MANAGE, notImpersonating: true }`.
3. WHEN the resolver is executed THEN system SHALL call `requireAuth(ctx)` first, then delegate to `RecipientGroupService.updateRecipientGroup(userId, args.input, ctx.t().errorsTranslations)`.
4. WHEN the mutation is defined THEN system SHALL accept arg `input` (UpdateRecipientGroupInputRef, required) with `id` and partial fields, and return type `CertificateRecipientGroupPothosObject`.
5. WHEN the input type is defined THEN system SHALL use `gqlSchemaBuilder.inputRef<UpdateRecipientGroupSubmitInput>("UpdateRecipientGroupInput")`.
6. WHEN the resolver is executed THEN system SHALL obtain localized errors via `ctx.t().errorsTranslations`.

#### Additional Details
- **Priority**: Medium
- **Complexity**: Medium
- **Dependencies**: Plan 02 (`UpdateRecipientGroupSubmitInput`), Plan 04 (`RecipientGroupService.updateRecipientGroup`)

---

### Requirement 21: Mutation — Delete Recipient Group

**User Story:** As an administrator with the `CERTIFICATES_MANAGE` permission, I want to delete a recipient group, so that I can remove unused groups.

#### Acceptance Criteria

1. WHEN the `deleteRecipientGroup` mutation field is defined THEN system SHALL use `gqlSchemaBuilder.mutationField("deleteRecipientGroup", t => t.field({ ... }))`.
2. WHEN the mutation is defined THEN system SHALL set `authScopes: { permission: AppPermission.CERTIFICATES_MANAGE, notImpersonating: true }`.
3. WHEN the resolver is executed THEN system SHALL call `requireAuth(ctx)` first, then delegate to `RecipientGroupService.deleteRecipientGroup(userId, args.id, args.expectedVersion, ctx.t().errorsTranslations)`.
4. WHEN the mutation is defined THEN system SHALL accept args `id` (string, required) and `expectedVersion` (int, nullable), and return type `DeleteRecipientGroupResultPothosObject` with `id` and `version`.
5. WHEN the resolver is executed THEN system SHALL obtain localized errors via `ctx.t().errorsTranslations`.

#### Additional Details
- **Priority**: Medium
- **Complexity**: Low
- **Dependencies**: Plan 04 (`RecipientGroupService.deleteRecipientGroup`)
- **Pattern**: Mirrors `deleteInvoice` result flattening pattern.

---

### Requirement 22: DataLoader Batch Resolvers for Template Relations

**User Story:** As a frontend developer, I want template elements and variables to be loaded via DataLoader batch resolvers, so that querying a template with its elements and variables avoids N+1 database queries.

#### Acceptance Criteria

1. WHEN a `CertificateTemplate` object's `elements` field is resolved THEN system SHALL use `t.field({ type: [CertificateTemplateElementPothosObject], resolve: ... })` (NOT `t.loadable()` — loadable cannot return lists).
2. WHEN the `elements` field resolver is executed THEN system SHALL call a batch service method `CertificateTemplateService.resolveElementsForTemplateIds(templateIds: string[]): Promise<Map<string, CertificateTemplateElementReturnType[]>>`.
3. WHEN a `CertificateTemplate` object's `variables` field is resolved THEN system SHALL use `t.field({ type: [CertificateTemplateVariablePothosObject], resolve: ... })`.
4. WHEN the `variables` field resolver is executed THEN system SHALL call a batch service method `CertificateTemplateService.resolveVariablesForTemplateIds(templateIds: string[]): Promise<Map<string, CertificateTemplateVariableReturnType[]>>`.
5. WHEN a `CertificateRecipientGroup` object's `recipients` field is resolved THEN system SHALL use `t.field({ type: [CertificateRecipientPothosObject], resolve: ... })` with a batch service method.
6. WHEN any batch resolver is defined THEN system SHALL use `Map<string, T[]>` return types from service methods — never raw arrays or individual lookups.

#### Additional Details
- **Priority**: High
- **Complexity**: Medium
- **Dependencies**: Plan 04 (batch service methods)
- **Pattern**: Analysis §C.7 and §E.3 — `t.loadable()` cannot return arrays; use `t.field()` for list-typed field resolvers with manual batch.
- **Reference**: `docs/graphql/dataloader-batching.md`

---

### Requirement 23: Enum Registration

**User Story:** As a developer, I want all certificate-related enums registered once in Pothos, so that GraphQL enum types are available for resolvers and clients.

#### Acceptance Criteria

1. WHEN certificate enums are registered THEN system SHALL add them to `backend/graphql/pothos/shared/enum.pothos.ts` using the canonical `gqlSchemaBuilder.enumType(Enum, { name })` pattern — NOT hardcoded value arrays.
2. WHEN registering `CertificateStatus` THEN system SHALL export `CertificateStatusPothosEnum`.
3. WHEN registering `CertificateResolution` THEN system SHALL export `CertificateResolutionPothosEnum`.
4. WHEN registering `CertificateVerificationStatus` THEN system SHALL export `CertificateVerificationStatusPothosEnum`.
5. WHEN registering `TemplateStatus` THEN system SHALL export `TemplateStatusPothosEnum`.
6. WHEN registering `TemplateElementType` THEN system SHALL export `TemplateElementTypePothosEnum`.
7. WHEN registering `TemplateVariableType` THEN system SHALL export `TemplateVariableTypePothosEnum`.
8. WHEN registering `CertificateOrientation` THEN system SHALL export `CertificateOrientationPothosEnum`.
9. WHEN any enum is registered THEN system SHALL import the enum from `@/backend/enum` — never define enum values in the Pothos file.
10. WHEN all enums are registered THEN system SHALL NOT re-register them elsewhere — duplicate registration produces `"X" has already been declared` runtime error.

#### Additional Details
- **Priority**: High
- **Complexity**: Low
- **Dependencies**: Plan 02 (enum definitions in `backend/enum/certificates/`)
- **Pattern**: Mirrors existing 40+ enum registrations in `enum.pothos.ts` lines 49–253.

---

### Requirement 24: Input Types (All Submit Inputs)

**User Story:** As a developer, I want all certificate input types defined as `inputRef` using centralized backend types, so that GraphQL inputs match the service layer's `SubmitInput` types exactly.

#### Acceptance Criteria

1. WHEN any input type is defined THEN system SHALL use `gqlSchemaBuilder.inputRef<SubmitInputType>("InputName").implement({ fields: t => ({...}) })`.
2. WHEN an input type is defined THEN system SHALL import the base TypeScript type from `@/backend/types` — never define ad-hoc types in Pothos files.
3. WHEN an input field maps to a Pothos enum THEN system SHALL use `t.field({ type: SomeEnumPothos, required: boolean })` — not `t.string()` for enum-typed fields.
4. WHEN an input field is a `DateTime` THEN system SHALL use `t.field({ type: "DateTime", required: boolean })`.
5. WHEN an input field has `required: false` THEN system SHALL make it nullable in the Pothos input definition.
6. WHEN an input type includes `idempotencyKey` THEN system SHALL make it `required: false` (auto-derived on the server when absent, mirroring billing invoices).

#### Additional Details
- **Priority**: High
- **Complexity**: Medium
- **Dependencies**: Plan 02 (all `SubmitInput` types in `backend/types/certificates/`)
- **Pattern**: Mirrors `StudentCreateInputPothosObject` and `PartialStudentUpdateInputPothosObject` from `student.pothos.ts` lines 71–130.

---

### Requirement 25: Barrel Registration

**User Story:** As a developer, I want certificate queries and mutations registered in the query and mutation barrels, so that they are automatically side-effect imported by the schema assembly.

#### Acceptance Criteria

1. WHEN all certificate Pothos files are created THEN system SHALL create `backend/graphql/pothos/certificates/index.ts` barrel exporting all Pothos objects and input refs.
2. WHEN the Pothos barrel is created THEN system SHALL add `export * from "@/backend/graphql/pothos/certificates";` to `backend/graphql/pothos/index.ts`.
3. WHEN all certificate query files are created THEN system SHALL create `backend/graphql/query/certificates/index.ts` barrel with side-effect imports of each query file.
4. WHEN the query barrel is created THEN system SHALL add `import "./certificates";` to `backend/graphql/query/index.ts`.
5. WHEN all certificate mutation files are created THEN system SHALL create `backend/graphql/mutation/certificates/index.ts` barrel with side-effect imports of each mutation file.
6. WHEN the mutation barrel is created THEN system SHALL add `import "./certificates";` to `backend/graphql/mutation/index.ts`.
7. WHEN barrel registration is complete THEN system SHALL maintain alphabetical ordering in barrels (add `certificates` in the correct alphabetic position in each barrel).

#### Additional Details
- **Priority**: High
- **Complexity**: Low
- **Dependencies**: All certificate Pothos, query, and mutation files must be created first.
- **Pattern**: Mirrors billing/students barrel registration in `query/index.ts`, `mutation/index.ts`, and `pothos/index.ts`.

---

### Requirement 26: GraphQL Code Generation

**User Story:** As a developer, I want GraphQL code generation run after all schema changes, so that TypeScript types and SDL are up-to-date for the frontend.

#### Acceptance Criteria

1. WHEN all certificate Pothos files, enum registrations, and barrels are complete THEN system SHALL run `bun run generate:gqlSchema` to generate the GraphQL SDL from the Pothos schema.
2. WHEN the SDL generation completes THEN system SHALL run `bun codegen` to generate TypeScript types from the schema.
3. WHEN code generation is complete THEN system SHALL verify that the generated schema file includes all certificate types, queries, mutations, and enums.
4. WHEN code generation fails THEN system SHALL fix the Pothos definition causing the error and re-run code generation.

#### Additional Details
- **Priority**: High
- **Complexity**: Low
- **Dependencies**: All Pothos files, enums, and barrels must be complete.
- **Pattern**: Mandatory after any schema changes — see AGENTS.md "GraphQL Code Generation" section.

---

### Requirement 27: Feature 6 — Outcome Knowledge Base & Progress Tracking

**User Story:** As an AI agent executing this plan, I want persistent outcome documents and progress tracking, so that subsequent tasks and plans do not repeat analysis or encounter the same pitfalls.

#### Acceptance Criteria

1. WHEN an executing agent starts any subtask THEN system SHALL read ALL existing outcome files in `.ai/draft_plans/cert/plans/05-graphql-api/outcome/` to absorb prior research, pattern decisions, and pitfalls.
2. WHEN an executing agent completes any subtask THEN system SHALL write an outcome document at `.ai/draft_plans/cert/plans/05-graphql-api/outcome/<task-id>-outcome.md` containing: files created/modified, Pothos patterns applied, auth scope decisions, DataLoader batch method signatures, enum registration details, errors encountered and resolutions, and carry-over notes for subsequent plans.
3. WHEN an executing agent completes any subtask THEN system SHALL update the corresponding task checkbox `[ ]` -> `[x]` in `tasks.md`.
4. WHEN an executing agent encounters a Pothos pattern decision (e.g., choosing `objectRef` vs `loadableObjectRef` for a type) THEN system SHALL document the rationale in the outcome file.
5. WHEN an executing agent encounters a codegen error or schema registration conflict THEN system SHALL document the error, the root cause, and the fix in the outcome file.
6. WHEN all subtasks are complete THEN system SHALL write a final outcome summary listing all certificate GraphQL operations, object types, input types, and enums added to the schema.

#### Additional Details
- **Priority**: High
- **Complexity**: Low
- **Dependencies**: None — outcome directory should be created on first task execution.
- **Pattern**: Mirrors Requirement 0 from Plan 01 requirements. Enables cross-plan knowledge transfer.

---

## Constraints

### C1: Code-First Pothos Schema
All GraphQL types, queries, and mutations MUST be defined using code-first Pothos builders (`gqlSchemaBuilder.queryField`, `gqlSchemaBuilder.mutationField`, `gqlSchemaBuilder.objectRef`, `gqlSchemaBuilder.loadableObjectRef`, `gqlSchemaBuilder.inputRef`). No SDL-first definitions.

### C2: Types from `backend/types/`
Every Pothos object and input type MUST reference the centralized type from `backend/types/certificates/` — `CertificateReturnType`, `CertificateTemplateReturnType`, `CertificateSubmitInput`, etc. Ad-hoc type definitions inside `*.pothos.ts` files are prohibited by `backend/graphql/AGENTS.md` and `backend/types/AGENTS.md`.

### C3: Auth Scopes with Permission Enum
All non-public resolvers MUST use `authScopes: { permission: AppPermission.X, notImpersonating: true }` for mutations and `authScopes: { loggedIn: true }` for queries. The public `verifyCertificate` query MUST have no `authScopes`. Super admin is auto-allowed by the builder's `authScopes.permission` callback — no explicit super_admin check in resolvers.

### C4: `requireAuth(ctx)` on All Non-Public Resolvers
Every resolver (except `verifyCertificate`) MUST call `const userId = await requireAuth(ctx)` at the top, even when `authScopes` already gate access — both must agree per analysis §E.7.

### C5: Localized Errors via `ctx.t()`
All resolvers MUST obtain localized error labels via `const tErrors = ctx.t().errorsTranslations` and pass them to service methods. Hardcoded error strings are prohibited.

### C6: `id` Field on Every Object Type
Every GraphQL object type MUST expose a non-nullable `id` string field for Apollo cache normalization.

### C7: No Business Logic in Resolvers
Resolvers MUST only authenticate, extract arguments, call services, and return results. All business logic (permission checks, validation, orchestration) stays in the service layer (Plan 04).

### C8: No Repository Calls in Resolvers
Resolvers MUST NOT call repository methods directly — only service methods. The service layer is the single entry point for data access.

### C9: DataLoader for Single-Entity Loads
Single-entity object types (`Certificate`, `CertificateTemplate`) MUST use `loadableObjectRef<T, string>` with `load` delegating to the repository's `loadByIds(ids)` batch method. List-typed field resolvers MUST use `t.field()` with manual batch service methods (not `t.loadable()` which cannot return lists).

### C10: Enum Registration Once
All certificate enums MUST be registered exactly once in `backend/graphql/pothos/shared/enum.pothos.ts`. Duplicate registration produces runtime errors. Hardcoded value arrays are prohibited.

### C11: No `GraphQLError` from Services
Services throw `DomainError`, `NotFoundError`, or `Error(tErrors.cert.*)` — never `GraphQLError`. Pothos and the errors plugin handle error formatting. Resolvers must not construct `GraphQLError` either.

### C12: Barrel Registration Mandatory
Certificate domain folders MUST be registered in the three barrels: `pothos/index.ts`, `query/index.ts`, `mutation/index.ts`. Without barrel registration, the schema does not include certificate operations (side-effect imports only).

---

## Non-Functional Requirements

### NFR1: Performance — DataLoader Batching
All field resolvers that load related entities (template elements, variables, recipient group recipients) MUST use batch service methods returning `Map<string, T[]>` to prevent N+1 queries when multiple parent entities are requested in the same query.

### NFR2: Security — Public Verification
The `verifyCertificate` query MUST NOT expose more information than necessary: `valid`, `status`, `certificateTitle`, `recipientName`, `issueDate`, `templateName`, `verificationCode`. Sensitive fields (`studentId`, `templateId`, `recipientGroupId`, `fileUrl`, `version`, `createdAt`) MUST NOT be included in the verification result.

### NFR3: Observability — Resolver Tracing
All certificate resolvers inherit Pothos tracing via the `TracingPlugin` configuration (root field tracing). No explicit tracing wrapping needed.

### NFR4: Type Safety
All Pothos objects and inputs MUST be backed by centralized TypeScript types from `backend/types/certificates/`. The `tsgo` type checker MUST pass with zero errors after all changes.

### NFR5: Lint & Format Compliance
All new files MUST pass `bun biome:check`, `bun run lint` (ESLint via lint queue), and `bun tsgo` with zero errors and zero warnings.

---

## Dependency Map

```
Plan 02 (Types & Permissions) ───────┐
  - CertificateReturnType             │
  - CertificateTemplateReturnType     │
  - CertificateVerificationResultReturnType │
  - All SubmitInput types             │
  - AppPermission.CERTIFICATES_*      │
  - All certificate enums (TS)        │
                                      │
Plan 03 (Repository Layer) ───────────┤
  - CertificateRepository.loadByIds   │
  - CertificateTemplateRepository.loadByIds │
                                      │
Plan 04 (Services & Business Logic) ──┤
  - CertificateService.*              │
  - CertificateTemplateService.*      │
  - CertificateGenerationService.*    │
  - CertificateVerificationService.* │
  - RecipientGroupService.*           │
  - Batch service methods             │
                                      ▼
                           Plan 05 (THIS PLAN)
  - Pothos object types               │
  - Pothos input types                │
  - Query resolvers                   │
  - Mutation resolvers                │
  - Enum registration                 │
  - Barrel registration               │
  - GraphQL code generation           │
                                      ▼
                           Plan 07+ (Frontend)
  - GraphQL documents                 │
  - Apollo hooks                      │
  - Views & stores                    │
```

---

## Summary Table

| # | Query / Mutation | Type | Auth Scope | Permission |
|---|------------------|------|------------|------------|
| R6 | `certificates` | Query | `loggedIn` | — |
| R7 | `certificate` | Query | `loggedIn` | — |
| R8 | `certificateTemplates` | Query | `loggedIn` | — |
| R9 | `certificateTemplate` | Query | `loggedIn` | — |
| R10 | `verifyCertificate` | Query | **Public** | — |
| R11 | `certificateCategories` | Query | `loggedIn` | — |
| R12 | `certificateRecipientGroups` | Query | `loggedIn` | — |
| R13 | `createCertificateTemplate` | Mutation | permission | `CERTIFICATES_TEMPLATES_MANAGE` |
| R14 | `updateCertificateTemplate` | Mutation | permission | `CERTIFICATES_TEMPLATES_MANAGE` |
| R15 | `publishCertificateTemplate` | Mutation | permission | `CERTIFICATES_TEMPLATES_MANAGE` |
| R16 | `archiveCertificateTemplate` | Mutation | permission | `CERTIFICATES_TEMPLATES_MANAGE` |
| R17 | `generateCertificate` | Mutation | permission | `CERTIFICATES_GENERATE` |
| R18 | `revokeCertificate` | Mutation | permission | `CERTIFICATES_REVOKE` |
| R19 | `createRecipientGroup` | Mutation | permission | `CERTIFICATES_MANAGE` |
| R20 | `updateRecipientGroup` | Mutation | permission | `CERTIFICATES_MANAGE` |
| R21 | `deleteRecipientGroup` | Mutation | permission | `CERTIFICATES_MANAGE` |

**Total: 7 queries + 9 mutations = 16 GraphQL operations**
