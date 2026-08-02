# Plan 05 — GraphQL API: Implementation Tasks

> **Prerequisites**: Plan 02 (Types & Permissions) and Plan 04 (Services & Business Logic) must be complete before starting any task in this plan.
>
> **Reference Documents**:
> - Requirements: `./requirements.md`
> - Design: `./design.md`
> - Analysis: `../siraj_analysis/04-services-graphql-patterns.md`
> - Pothos reference: `backend/graphql/pothos/billing/billing-management.pothos.ts`
> - Pothos reference: `backend/graphql/pothos/students/student.pothos.ts`
>
> **Instruction File**: Before starting ANY task, read `backend/graphql/AGENTS.md` and `.github/instructions/backend.instructions.md`. These contain mandatory rules for Pothos code: enum registration, single canonical object type, type definition pattern, no business logic in resolvers, DataLoader batch patterns.

---

## Task 1: Create Pothos Object Types (Certificate, Template, Element, Variable)

**Estimated Time**: 3-4 hours

### Scope

Create the core Pothos object type definitions for certificates, templates, template elements, and template variables. These are the foundational types that all queries and mutations will reference.

### Files to Create

| File | Description |
|---|---|
| `backend/graphql/pothos/certificates/certificate.pothos.ts` | `CertificatePothosObject` (loadableObjectRef + DataLoader batch), `CertificateListPothosObject` (paginated response), `CertificateFilterArgsRef` (input), `CertificatesOrderByClauseRef` (input) |
| `backend/graphql/pothos/certificates/certificate-template.pothos.ts` | `CertificateTemplatePothosObject` (loadableObjectRef + DataLoader batch), `CertificateTemplateListPothosObject` (paginated response), `TemplateElementPothosObject` (objectRef), `TemplateVariablePothosObject` (objectRef), input refs for create/update/generate |

### Implementation Details

#### `certificate.pothos.ts`

1. **`CertificatePothosObject`** — Use `loadableObjectRef<CertificateReturnType, string>("Certificate", { load: ids => CertificateRepository.loadByIds(ids), sort: e => e.id })`. Implement fields:
   - `id: t.exposeString("id", { nullable: false })`
   - `certificateNumber`, `title`, `recipientName`, `recipientEmail`, `status` (enum), `issueDate` (DateTime), `expiryDate` (DateTime, nullable), `verificationCode`, `verificationStatus` (enum), `resolution` (enum), `orientation` (enum, nullable), `metadata` (JSON), `revokedAt` (DateTime, nullable), `revokedBy` (string, nullable), `revocationReason` (string, nullable), `createdAt`, `updatedAt`
   - Relational fields: `template` (resolve via `CertificateTemplateRepository.loadByIds`), `recipientGroup` (nullable, resolve via `RecipientGroupRepository.loadByIds`)

2. **`CertificateListPothosObject`** — Paginated response using `objectRef`. Fields: `items: [CertificatePothosObject]`, `total: Int`, `pageInfo: PageInfoObject`. Import `PageInfoObject` from `@/backend/graphql/pothos/shared/pagination.objects`.

3. **`CertificateFilterArgsRef`** — `inputRef<CertificateFilterInput>` with fields: `search` (string, nullable), `status` (CertificateStatus, nullable), `verificationStatus` (CertificateVerificationStatus, nullable), `templateId` (string, nullable), `recipientGroupId` (string, nullable), `dateFrom` (DateTime, nullable), `dateTo` (DateTime, nullable). Add `first`, `page`, `orderBy`, `orderDirection` via `PaginationArgsObject`.

4. **`CertificatesOrderByClauseRef`** — `inputRef` with `column: CertificatesOrderByColumn` and `order: OrderSortDirection`.

**Pattern reference**: `student.pothos.ts:21-69` (loadableObjectRef), `student.pothos.ts:71-99` (inputRef), `student.pothos.ts:131-138` (list response), `student.pothos.ts:140-181` (filter args), `student.pothos.ts:187-201` (orderBy).

#### `certificate-template.pothos.ts`

1. **`CertificateTemplatePothosObject`** — Use `loadableObjectRef<CertificateTemplateReturnType, string>("CertificateTemplate", { load: ids => CertificateTemplateRepository.loadByIds(ids), sort: e => e.id })`. Implement fields:
   - `id`, `name`, `description` (nullable), `status` (TemplateStatus enum), `orientation` (CertificateOrientation, nullable), `pageNumber` (Int), `category` (resolve via CertificateCategoryRepository), `createdBy` (resolve via StaffRepository), `publishedAt` (DateTime, nullable), `archivedAt` (DateTime, nullable), `createdAt`, `updatedAt`
   - Relational list fields using `t.field()` (NOT `t.loadable()` — it cannot return lists):
     - `elements`: resolve via `TemplateElementService.resolveElementsForTemplateIds([parent.id])` returning `Map<string, TemplateElementReturnType[]>`
     - `variables`: resolve via `TemplateVariableService.resolveVariablesForTemplateIds([parent.id])` returning `Map<string, TemplateVariableReturnType[]>`

2. **`CertificateTemplateListPothosObject`** — Paginated response. Fields: `items: [CertificateTemplatePothosObject]`, `total: Int`, `pageInfo: PageInfoObject`.

3. **`TemplateElementPothosObject`** — `objectRef<TemplateElementReturnType>("TemplateElement")`. Fields: `id`, `type` (TemplateElementType enum), `key` (nullable), `label` (nullable), `placeholder` (nullable), `xPosition` (Float), `yPosition` (Float), `fontSize` (Float, nullable), `fontFamily` (string, nullable), `fontWeight` (string, nullable), `color` (string, nullable), `textAlign` (string, nullable), `width` (Float, nullable), `height` (Float, nullable), `required` (Boolean), `sortOrder` (Int), `createdAt`, `updatedAt`.

4. **`TemplateVariablePothosObject`** — `objectRef<TemplateVariableReturnType>("TemplateVariable")`. Fields: `id`, `name`, `label`, `type` (TemplateVariableType enum), `defaultValue` (nullable), `validValues` (JSON array, nullable), `required` (Boolean), `sortOrder` (Int), `createdAt`, `updatedAt`.

5. **Input refs**:
   - `CreateCertificateTemplateInputRef` — `inputRef<CreateCertificateTemplateSubmitInput>` with fields: `name` (required), `description` (nullable), `orientation` (nullable), `pageNumber` (nullable), `categoryId` (nullable), `elements: [TemplateElementInputRef]` (nullable), `variables: [TemplateVariableInputRef]` (nullable). Nested input refs for elements and variables.
   - `UpdateCertificateTemplateInputRef` — `inputRef<UpdateCertificateTemplateSubmitInput>` with: `id` (required), `name` (nullable), `description` (nullable), `orientation` (nullable), `pageNumber` (nullable), `categoryId` (nullable), `expectedVersion` (Int, nullable), `elements` (nullable), `variables` (nullable).
   - `GenerateCertificateInputRef` — `inputRef<GenerateCertificateSubmitInput>` with: `templateId` (required), `recipientName` (required), `recipientEmail` (required), `recipientGroupId` (nullable), `issueDate` (nullable), `expiryDate` (nullable), `metadata` (JSON, nullable), `variableValues` (JSON, nullable), `orientation` (nullable).

**Pattern reference**: `billing-management.pothos.ts:69-90` (objectRef + implement), `student.pothos.ts:71-99` (inputRef).

### Requirements References

- _Requirements_: R1 (Certificate loadableObjectRef), R2 (CertificateListPothosObject with PageInfo), R3 (Template loadableObjectRef with elements/variables), R4 (TemplateElementPothosObject — objectRef), R5 (TemplateVariablePothosObject — objectRef), R22 (DataLoader batch for elements/variables), R24 (inputRef using centralized backend types), C2 (inputRef using SubmitInput types), C6 (id field on every object), C9 (loadableObjectRef loadByIds pattern)

### Instruction Verification

Before writing code, read:
- `backend/graphql/AGENTS.md` — rules on single canonical object type, enum registration, type definition pattern
- `.github/instructions/backend.instructions.md` — backend Pothos rules
- `shared/AGENTS.md` — shared layer rules (if importing shared types)

Key rules to verify:
- ✅ Every object type exposes `id: t.exposeString("id", { nullable: false })`
- ✅ `loadableObjectRef` used for Certificate and CertificateTemplate (entities loaded by ID)
- ✅ `objectRef` used for TemplateElement and TemplateVariable (not independently loaded)
- ✅ All input types use `inputRef<SubmitInputType>` — never ad-hoc types in Pothos
- ✅ List-typed field resolvers (elements, variables) use `t.field()`, NOT `t.loadable()`
- ✅ `PageInfoObject` imported from `@/backend/graphql/pothos/shared/pagination.objects` — never redefined

### Quality Loop

After creating each file, run the per-file verification loop:

```bash
# 1. Type check (safe to run concurrently)
~/.bun/bin/bun run tsgo

# 2. Biome format + lint
~/.bun/bin/bun biome:check

# 3. ESLint via lint queue (requires lint server running)
# Start lint server if not already running:
~/.bun/bin/bun run scripts/lint-queue-server.ts &
sleep 2
export LINT_QUEUE_PORT=$(grep -oP 'LINT_QUEUE_PORT = \K\d+' scripts/lint-queue-config.ts)
curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"task1-cert","files":["backend/graphql/pothos/certificates/certificate.pothos.ts","backend/graphql/pothos/certificates/certificate-template.pothos.ts"]}'
```

Fix all errors before proceeding. The progressive loop short-circuits: fix tsgo first, then biome, then lint.

### Outcome Document

Write `outcome/task-01-outcome.md` documenting:
- Files created and their exported symbols
- `loadableObjectRef` batch method signatures used (`CertificateRepository.loadByIds`, `CertificateTemplateRepository.loadByIds`)
- List-typed field resolver pattern (how `elements` and `variables` batch via `Map<string, T[]>`)
- Input ref names and their corresponding `SubmitInput` types
- Any errors encountered and resolutions

---

## Task 2: Create Verification Result Object Type

**Estimated Time**: 1-2 hours

### Scope

Create the Pothos object type for public certificate verification results. This is the return type for the public `verifyCertificate` query.

### Files to Create

| File | Description |
|---|---|
| `backend/graphql/pothos/certificates/certificate-verification.pothos.ts` | `CertificateVerificationResultPothosObject` — public output with limited certificate fields, `CertificateCategoryPothosObject`, `CertificateRecipientGroupPothosObject`, `DeleteRecipientGroupResultPothosObject` |

### Implementation Details

#### `CertificateVerificationResultPothosObject`

Use `objectRef<CertificateVerificationResultReturnType>("CertificateVerificationResult")`. Implement fields:
- `id: t.exposeString("id", { nullable: false })` — the certificate ID
- `isValid: t.exposeBoolean("isValid", { nullable: false })` — whether the certificate is currently valid
- `certificateNumber: t.exposeString("certificateNumber", { nullable: false })`
- `title: t.exposeString("title", { nullable: false })`
- `recipientName: t.exposeString("recipientName", { nullable: false })`
- `issueDate: t.expose("issueDate", { type: "DateTime" })`
- `expiryDate: t.expose("expiryDate", { type: "DateTime", nullable: true })`
- `status: t.field({ type: CertificateStatusPothos, resolve: e => e.status, nullable: false })`
- `templateName: t.exposeString("templateName", { nullable: false })`
- `templateOrientation: t.field({ type: CertificateOrientationPothos, resolve: e => e.templateOrientation, nullable: true })`
- `verifiedAt: t.expose("verifiedAt", { type: "DateTime" })`
- `verificationStatus: t.field({ type: CertificateVerificationStatusPothos, resolve: e => e.verificationStatus, nullable: false })`
- `resolution: t.field({ type: CertificateResolutionPothos, resolve: e => e.resolution, nullable: true })`

**Critical**: This object type has **NO authScopes** — it's the output of a public query. Do not add `authScopes` at the type level. The public access is controlled at the query resolver level (Task 3).

#### `CertificateCategoryPothosObject`

Use `objectRef<CertificateCategoryReturnType>("CertificateCategory")`. Fields: `id`, `name`, `slug`, `description` (nullable), `createdAt`, `updatedAt`.

#### `CertificateRecipientGroupPothosObject`

Use `objectRef<CertificateRecipientGroupReturnType>("CertificateRecipientGroup")`. Fields: `id`, `name`, `description` (nullable), `recipientCount` (Int — resolve via `RecipientGroupService.getRecipientCounts([parent.id])`), `createdAt`, `updatedAt`.

Input refs:
- `CreateRecipientGroupInputRef` — `inputRef<CreateRecipientGroupSubmitInput>` with `name` (required), `description` (nullable), `recipientIds: [string]` (nullable).
- `UpdateRecipientGroupInputRef` — `inputRef<UpdateRecipientGroupSubmitInput>` with `id` (required), `name` (nullable), `description` (nullable), `recipientIds` (nullable), `expectedVersion` (Int, nullable).

#### `DeleteRecipientGroupResultPothosObject`

Use `objectRef` with fields: `id: string`, `success: boolean`, `message: string (nullable)`.

### Requirements References

- _Requirements_: R5 (CertificateVerificationResultPothosObject — limited public fields), R10 (public query returns limited info), C2 (objectRef for non-loaded types), C6 (id field on every object)

### Instruction Verification

Before writing code, read:
- `backend/graphql/AGENTS.md` — rules on object type definition, id field requirement
- `.github/instructions/backend.instructions.md` — backend Pothos rules

Key rules to verify:
- ✅ `CertificateVerificationResultPothosObject` uses `objectRef` (not `loadableObjectRef` — no DataLoader needed for verification results)
- ✅ Public fields only: title, recipientName, issueDate, status, templateName — NO recipient email, NO metadata, NO internal IDs exposed beyond certificate id
- ✅ `id` field exposed on all object types
- ✅ Input refs use centralized `SubmitInput` types from `@/backend/types`

### Quality Loop

```bash
~/.bun/bin/bun run tsgo
~/.bun/bin/bun biome:check
curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"task2-cert","files":["backend/graphql/pothos/certificates/certificate-verification.pothos.ts"]}'
```

### Outcome Document

Write `outcome/task-02-outcome.md` documenting:
- `CertificateVerificationResultPothosObject` fields and why each is public-safe (no PII leak)
- `CertificateCategoryPothosObject` and `CertificateRecipientGroupPothosObject` field designs
- Input ref names and mappings to `SubmitInput` types
- Any errors encountered and resolutions

---

## Task 3: Create Query Resolvers (Certificates List, Certificate by ID, VerifyCertificate Public)

**Estimated Time**: 3-4 hours

### Scope

Create the GraphQL query resolvers for certificate operations: paginated list with filters, single certificate by ID, public verification, template list, template by ID, categories, and recipient groups.

### Files to Create

| File | Description |
|---|---|
| `backend/graphql/query/certificates/certificate.query.ts` | `certificates` (paginated list with filters + orderBy), `certificate` (by id), `verifyCertificate` (public, no auth) |
| `backend/graphql/query/certificates/certificate-template.query.ts` | `certificateTemplates` (paginated list), `certificateTemplate` (by id) |
| `backend/graphql/query/certificates/certificate-meta.query.ts` | `certificateCategories`, `certificateRecipientGroups` |
| `backend/graphql/query/certificates/index.ts` | Barrel: `import "./certificate.query"; import "./certificate-template.query"; import "./certificate-meta.query";` |

### Implementation Details

#### `certificate.query.ts`

**`certificates` query** (authenticated):
```typescript
gqlSchemaBuilder.queryField("certificates", t =>
  t.field({
    type: CertificateListPothosObject,
    nullable: false,
    authScopes: { loggedIn: true },
    args: {
      first: t.arg.int({ required: false }),
      page: t.arg.int({ required: false }),
      filter: t.arg({ type: CertificateFilterArgsRef, required: false }),
      orderBy: t.arg({ type: CertificatesOrderByClauseRef, required: false }),
    },
    resolve: async (_root, args, ctx) => {
      const userId = await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;
      return CertificateService.listCertificates(userId, {
        first: args.first ?? 50,
        page: args.page ?? 1,
        filter: args.filter ?? {},
        orderBy: args.orderBy ?? { column: "createdAt", order: "desc" },
      }, tErrors);
    },
  })
);
```

**`certificate` query** (authenticated):
```typescript
gqlSchemaBuilder.queryField("certificate", t =>
  t.field({
    type: CertificatePothosObject,
    nullable: true,
    authScopes: { loggedIn: true },
    args: { id: t.arg.string({ required: true }) },
    resolve: async (_root, args, ctx) => {
      const userId = await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;
      return CertificateService.getCertificate(userId, args.id, tErrors);
    },
  })
);
```

**`verifyCertificate` query** (PUBLIC — no auth):
```typescript
gqlSchemaBuilder.queryField("verifyCertificate", t =>
  t.field({
    type: CertificateVerificationResultPothosObject,
    nullable: false,
    // NO authScopes — public query
    args: { verificationCode: t.arg.string({ required: true }) },
    resolve: async (_root, args, ctx) => {
      const tErrors = ctx.t().errorsTranslations;
      return CertificateVerificationService.verifyByCode(args.verificationCode, tErrors, ctx.locale);
    },
  })
);
```

**Critical patterns**:
- `certificates` and `certificate` use `authScopes: { loggedIn: true }` — NOT `CERTIFICATES_LIST`. The `CERTIFICATES_LIST` permission is enforced in the service layer (the service checks the user's permissions and scopes results accordingly).
- `verifyCertificate` has **NO `authScopes`** — it's a public query accessible without authentication.
- `verifyCertificate` does **NOT** call `requireAuth(ctx)` — it's public.
- `verifyCertificate` passes `ctx.locale` to `CertificateVerificationService.verifyByCode` for localized verification status labels.

#### `certificate-template.query.ts`

**`certificateTemplates` query** (authenticated):
- `authScopes: { loggedIn: true }`
- Args: `first`, `page`, `filter` (nullable), `orderBy` (nullable)
- Delegates to `CertificateTemplateService.listTemplates(userId, paginationInput, tErrors)`

**`certificateTemplate` query** (authenticated):
- `authScopes: { loggedIn: true }`
- Args: `id: string (required)`
- Delegates to `CertificateTemplateService.getTemplate(userId, id, tErrors)`

#### `certificate-meta.query.ts`

**`certificateCategories` query** (authenticated):
- `authScopes: { loggedIn: true }`
- No args
- Delegates to `CertificateCategoryService.listCategories(userId, tErrors)`

**`certificateRecipientGroups` query** (authenticated):
- `authScopes: { loggedIn: true }`
- Args: `first` (nullable), `page` (nullable)
- Delegates to `RecipientGroupService.listRecipientGroups(userId, paginationInput, tErrors)`

**Pattern reference**: `billing-management.pothos.ts:272-287` (queryField with authScopes), `student.pothos.ts:234-272` (queryField with filters).

### Requirements References

- _Requirements_: R6 (certificates — paginated list with filters), R7 (certificate — by id), R8 (certificateTemplates — paginated list), R9 (certificateTemplate — by id), R10 (verifyCertificate — public, no auth, limited fields), R11 (certificateCategories), R12 (certificateRecipientGroups), C3 (authScopes: loggedIn for queries, none for verifyCertificate), C4 (requireAuth on all non-public resolvers), C5 (ctx.t().errorsTranslations)

### Instruction Verification

Before writing code, read:
- `backend/graphql/AGENTS.md` — rules on query resolver patterns, auth scopes
- `.github/instructions/backend.instructions.md` — backend resolver rules

Key rules to verify:
- ✅ `verifyCertificate` has NO `authScopes` — public query
- ✅ `verifyCertificate` does NOT call `requireAuth(ctx)`
- ✅ All other queries use `authScopes: { loggedIn: true }`
- ✅ All other queries call `requireAuth(ctx)` at the top of resolver
- ✅ All resolvers extract `ctx.t().errorsTranslations` for i18n
- ✅ No business logic in resolvers — delegate to services
- ✅ No `GraphQLError` thrown from resolvers — services throw domain errors

### Quality Loop

```bash
~/.bun/bin/bun run tsgo
~/.bun/bin/bun biome:check
curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"task3-cert","files":["backend/graphql/query/certificates/certificate.query.ts","backend/graphql/query/certificates/certificate-template.query.ts","backend/graphql/query/certificates/certificate-meta.query.ts","backend/graphql/query/certificates/index.ts"]}'
```

### Outcome Document

Write `outcome/task-03-outcome.md` documenting:
- All query resolver operation names and their auth scope configurations
- How `verifyCertificate` differs from other queries (no auth, no requireAuth, passes ctx.locale)
- Pagination arg defaults (first=50, page=1, orderBy=createdAt desc)
- Service method signatures called by each resolver
- Any errors encountered and resolutions

---

## Task 4: Create Mutation Resolvers (Template CRUD, Generate, Revoke)

**Estimated Time**: 3-4 hours

### Scope

Create mutation resolvers for certificate template CRUD, certificate generation, and revocation.

### Files to Create

| File | Description |
|---|---|
| `backend/graphql/mutation/certificates/certificate-template.mutation.ts` | `createCertificateTemplate`, `updateCertificateTemplate`, `publishCertificateTemplate`, `archiveCertificateTemplate` |
| `backend/graphql/mutation/certificates/certificate.mutation.ts` | `generateCertificate`, `revokeCertificate` |

### Implementation Details

#### `certificate-template.mutation.ts`

| Mutation | Auth Scope | Args | Service Call |
|---|---|---|---|
| `createCertificateTemplate` | `CERTIFICATES_TEMPLATES_MANAGE` + `notImpersonating: true` | `input: CreateCertificateTemplateInputRef` | `CertificateTemplateService.createTemplate(userId, input, tErrors)` |
| `updateCertificateTemplate` | `CERTIFICATES_TEMPLATES_MANAGE` + `notImpersonating: true` | `input: UpdateCertificateTemplateInputRef` | `CertificateTemplateService.updateTemplate(userId, input, tErrors)` |
| `publishCertificateTemplate` | `CERTIFICATES_TEMPLATES_MANAGE` + `notImpersonating: true` | `id: string`, `expectedVersion: Int (nullable)` | `CertificateTemplateService.publishTemplate(userId, id, expectedVersion, tErrors)` |
| `archiveCertificateTemplate` | `CERTIFICATES_TEMPLATES_MANAGE` + `notImpersonating: true` | `id: string`, `expectedVersion: Int (nullable)` | `CertificateTemplateService.archiveTemplate(userId, id, expectedVersion, tErrors)` |

**Key patterns**:
- All use `t.field({ type: CertificateTemplatePothosObject, nullable: false/true })`.
- `createCertificateTemplate` mirrors `createManualInvoice` from `billing-management.pothos.ts:143-188`.
- `publishCertificateTemplate` and `archiveCertificateTemplate` use `expectedVersion` for optimistic concurrency — mirrors `approvePaymentProof` pattern.
- Super admin auto-allowed via builder's `authScopes.permission` callback — no explicit check.

#### `certificate.mutation.ts`

| Mutation | Auth Scope | Args | Service Call |
|---|---|---|---|
| `generateCertificate` | `CERTIFICATES_GENERATE` + `notImpersonating: true` | `input: GenerateCertificateInputRef` | `CertificateGenerationService.generateCertificate(userId, input, tErrors, ctx.locale)` |
| `revokeCertificate` | `CERTIFICATES_REVOKE` + `notImpersonating: true` | `id: string`, `reason: string (nullable)`, `expectedVersion: Int (nullable)` | `CertificateService.revokeCertificate(userId, id, reason, expectedVersion, tErrors)` |

**Key patterns**:
- `generateCertificate` passes `ctx.locale` to service for localized PDF rendering — mirrors analysis §D.2 service signature.
- `revokeCertificate` mirrors `rejectPaymentProof` pattern (`billing-management.pothos.ts:230-249`) — accepts `reason` (nullable) and `expectedVersion` (nullable).
- All mutations include `notImpersonating: true` in authScopes — prevents impersonated sessions from performing certificate operations.

**Pattern reference**: `billing-management.pothos.ts:143-188` (mutationField with authScopes + notImpersonating), `billing-management.pothos.ts:230-249` (reject pattern with reason + expectedVersion).

### Requirements References

- _Requirements_: R13 (createCertificateTemplate), R14 (updateCertificateTemplate), R15 (publishCertificateTemplate), R16 (archiveCertificateTemplate), R17 (generateCertificate), R18 (revokeCertificate), C3 (authScopes.permission + notImpersonating for mutations), C4 (requireAuth), C5 (ctx.t().errorsTranslations), C7 (no business logic in resolvers)

### Instruction Verification

Before writing code, read:
- `backend/graphql/AGENTS.md` — rules on mutation resolvers, auth scopes, notImpersonating
- `.github/instructions/backend.instructions.md` — backend mutation rules

Key rules to verify:
- ✅ All mutations use `authScopes: { permission: AppPermission.X, notImpersonating: true }`
- ✅ `notImpersonating: true` on ALL mutation resolvers (prevents impersonated sessions)
- ✅ All mutations call `requireAuth(ctx)` at the top
- ✅ All mutations extract `ctx.t().errorsTranslations`
- ✅ No business logic in resolvers — delegate to services
- ✅ `expectedVersion` arg is nullable (optional) for optimistic concurrency
- ✅ `generateCertificate` passes `ctx.locale` to service

### Quality Loop

```bash
~/.bun/bin/bun run tsgo
~/.bun/bin/bun biome:check
curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"task4-cert","files":["backend/graphql/mutation/certificates/certificate-template.mutation.ts","backend/graphql/mutation/certificates/certificate.mutation.ts"]}'
```

### Outcome Document

Write `outcome/task-04-outcome.md` documenting:
- All mutation resolver operation names and their auth scope + permission configurations
- `expectedVersion` handling pattern (nullable arg, passed as `?? undefined` to service)
- `ctx.locale` propagation to `generateCertificate` service
- Service method signatures called by each resolver
- Any errors encountered and resolutions

---

## Task 5: Create Mutation Resolvers (Recipient Group CRUD)

**Estimated Time**: 2-3 hours

### Scope

Create mutation resolvers for certificate recipient group CRUD operations.

### Files to Create

| File | Description |
|---|---|
| `backend/graphql/mutation/certificates/certificate-recipient-group.mutation.ts` | `createRecipientGroup`, `updateRecipientGroup`, `deleteRecipientGroup` |
| `backend/graphql/mutation/certificates/index.ts` | Barrel: `import "./certificate-template.mutation"; import "./certificate.mutation"; import "./certificate-recipient-group.mutation";` |

### Implementation Details

| Mutation | Auth Scope | Args | Service Call |
|---|---|---|---|
| `createRecipientGroup` | `CERTIFICATES_MANAGE` + `notImpersonating: true` | `input: CreateRecipientGroupInputRef` | `RecipientGroupService.createRecipientGroup(userId, input, tErrors)` |
| `updateRecipientGroup` | `CERTIFICATES_MANAGE` + `notImpersonating: true` | `input: UpdateRecipientGroupInputRef` | `RecipientGroupService.updateRecipientGroup(userId, input, tErrors)` |
| `deleteRecipientGroup` | `CERTIFICATES_MANAGE` + `notImpersonating: true` | `id: string`, `expectedVersion: Int (nullable)` | `RecipientGroupService.deleteRecipientGroup(userId, id, expectedVersion, tErrors)` |

**Key patterns**:
- All use `CERTIFICATES_MANAGE` permission (not a specific recipient-group permission — recipient groups are managed under the general certificate management scope).
- `deleteRecipientGroup` returns `DeleteRecipientGroupResultPothosObject` (not the entity) — mirrors `deleteInvoice` from `billing-management.pothos.ts:289-305`. Result contains `id`, `success`, `message`.
- All include `notImpersonating: true`.

**Pattern reference**: `billing-management.pothos.ts:289-305` (delete pattern returning flattened result).

### Requirements References

- _Requirements_: R19 (createRecipientGroup), R20 (updateRecipientGroup), R21 (deleteRecipientGroup), C3 (authScopes.permission + notImpersonating), C4 (requireAuth), C5 (ctx.t().errorsTranslations), C7 (no business logic in resolvers)

### Instruction Verification

Before writing code, read:
- `backend/graphql/AGENTS.md` — rules on mutation resolvers, delete result pattern
- `.github/instructions/backend.instructions.md` — backend mutation rules

Key rules to verify:
- ✅ All mutations use `authScopes: { permission: AppPermission.CERTIFICATES_MANAGE, notImpersonating: true }`
- ✅ `deleteRecipientGroup` returns a result object (`DeleteRecipientGroupResultPothosObject`), not the entity
- ✅ All mutations call `requireAuth(ctx)`
- ✅ All mutations extract `ctx.t().errorsTranslations`
- ✅ No business logic in resolvers

### Quality Loop

```bash
~/.bun/bin/bun run tsgo
~/.bun/bin/bun biome:check
curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"task5-cert","files":["backend/graphql/mutation/certificates/certificate-recipient-group.mutation.ts","backend/graphql/mutation/certificates/index.ts"]}'
```

### Outcome Document

Write `outcome/task-05-outcome.md` documenting:
- All recipient group mutation operation names and auth scopes
- Delete result pattern (returning `DeleteRecipientGroupResultPothosObject` with `id`, `success`, `message`)
- Service method signatures called by each resolver
- Any errors encountered and resolutions

---

## Task 6: Create Barrel + Register in Query/Mutation Index

**Estimated Time**: 1-2 hours

### Scope

Create barrel files for the certificates directory and register them in the existing query and mutation barrels so the Pothos schema builder discovers all certificate types and operations.

### Files to Create

| File | Description |
|---|---|
| `backend/graphql/pothos/certificates/index.ts` | Pothos barrel: exports all object types and input refs |

### Files to Edit

| File | Edit |
|---|---|
| `backend/graphql/query/index.ts` | Add `import "./certificates";` (alphabetically after `import "./classes";`) |
| `backend/graphql/mutation/index.ts` | Add `import "./certificates";` (alphabetically after `import "./classes";`) |
| `backend/graphql/pothos/index.ts` | Add `export * from "@/backend/graphql/pothos/certificates";` (alphabetically after `export * from "@/backend/graphql/pothos/books";`) |

### Implementation Details

#### `pothos/certificates/index.ts`

```typescript
export * from "./certificate.pothos";
export * from "./certificate-template.pothos";
export * from "./certificate-verification.pothos";
export * from "./certificate-recipient-group.pothos";
```

Wait — `certificate-recipient-group.pothos.ts` does NOT exist as a separate file. The `CertificateRecipientGroupPothosObject` and input refs live in `certificate-verification.pothos.ts` (created in Task 2). So the barrel should be:

```typescript
export * from "./certificate.pothos";
export * from "./certificate-template.pothos";
export * from "./certificate-verification.pothos";
```

#### Query barrel edit (`query/index.ts`)

Current content (alphabetical order):
```typescript
import "./auth";
import "./billing";
import "./classes";
import "./meeting";
// ...
```

Add after `import "./classes";`:
```typescript
import "./certificates";
```

#### Mutation barrel edit (`mutation/index.ts`)

Current content (alphabetical order):
```typescript
import "./auth";
import "./billing";
import "./classes";
import "./meeting";
// ...
```

Add after `import "./classes";`:
```typescript
import "./certificates";
```

#### Pothos barrel edit (`pothos/index.ts`)

Add after `export * from "@/backend/graphql/pothos/books";`:
```typescript
export * from "@/backend/graphql/pothos/certificates";
```

**Verification**: After all barrel edits, the Pothos schema builder must discover all certificate types when `gqlSchema.ts` imports `query/index.ts` and `mutation/index.ts` as side-effect entry points.

### Requirements References

- _Requirements_: R25 (barrel registration — pothos, query, mutation barrels), C1 (code-first schema discovery via barrels)

### Instruction Verification

Before writing code, read:
- `backend/graphql/AGENTS.md` — rules on barrel registration, alphabetical ordering
- `.github/instructions/backend.instructions.md` — backend barrel rules

Key rules to verify:
- ✅ `pothos/certificates/index.ts` exports all 3 Pothos files
- ✅ `query/index.ts` imports `./certificates` in alphabetical order
- ✅ `mutation/index.ts` imports `./certificates` in alphabetical order
- ✅ `pothos/index.ts` exports certificates barrel in alphabetical order
- ✅ All imports use side-effect import syntax (`import "./certificates";`) for query/mutation barrels
- ✅ Pothos barrel uses `export * from` syntax

### Quality Loop

```bash
~/.bun/bin/bun run tsgo
~/.bun/bin/bun biome:check
curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"task6-cert","files":["backend/graphql/pothos/certificates/index.ts","backend/graphql/query/index.ts","backend/graphql/mutation/index.ts","backend/graphql/pothos/index.ts"]}'
```

### Outcome Document

Write `outcome/task-06-outcome.md` documenting:
- All barrel files created/edited
- Import order verification (alphabetical)
- Which symbols are exported vs side-effect imported
- Any errors encountered and resolutions

---

## Task 7: Run GraphQL Code Generation

**Estimated Time**: 1-2 hours

### Scope

After all Pothos object types, input types, enum registrations, query fields, mutation fields, and barrel registrations are complete, run the GraphQL schema generation and TypeScript codegen.

### Prerequisites

- Task 1-6 must be complete and all quality loops passing
- Enum registration (§4 of design.md) must be complete — 8 certificate enums registered in `shared/enum.pothos.ts`

### Steps

#### Step 1: Generate GraphQL SDL

```bash
~/.bun/bin/bun run generate:gqlSchema
```

This generates the GraphQL schema (SDL) from the Pothos schema definition. The output is written to the schema file (check `package.json` for the exact output path — usually `schema.gql` or `backend/graphql/schema.gql`).

#### Step 2: Generate TypeScript Types

```bash
~/.bun/bin/bun codegen
```

This runs GraphQL Codegen to generate TypeScript types from the SDL. Output goes to `frontend/common/graphql/generated/`.

#### Step 3: Verify Output

**Verify SDL contains all certificate operations**:

Queries:
- [ ] `certificates` (paginated list)
- [ ] `certificate` (by id)
- [ ] `certificateTemplates` (paginated list)
- [ ] `certificateTemplate` (by id)
- [ ] `verifyCertificate` (public)
- [ ] `certificateCategories`
- [ ] `certificateRecipientGroups`

Mutations:
- [ ] `createCertificateTemplate`
- [ ] `updateCertificateTemplate`
- [ ] `publishCertificateTemplate`
- [ ] `archiveCertificateTemplate`
- [ ] `generateCertificate`
- [ ] `revokeCertificate`
- [ ] `createRecipientGroup`
- [ ] `updateRecipientGroup`
- [ ] `deleteRecipientGroup`

Types:
- [ ] `Certificate`
- [ ] `CertificatesWithFiltersResponse`
- [ ] `CertificateTemplate`
- [ ] `CertificateTemplatesWithFiltersResponse`
- [ ] `CertificateTemplateElement`
- [ ] `CertificateTemplateVariable`
- [ ] `CertificateVerificationResult`
- [ ] `CertificateRecipientGroup`
- [ ] `DeleteRecipientGroupResult`
- [ ] `CertificateCategory`

Enums:
- [ ] `CertificateStatus`
- [ ] `CertificateResolution`
- [ ] `CertificateVerificationStatus`
- [ ] `TemplateStatus`
- [ ] `TemplateElementType`
- [ ] `TemplateVariableType`
- [ ] `CertificateOrientation`
- [ ] `CertificatesOrderByColumn`

#### Step 4: Fix Errors

If codegen fails, common causes:
- **Enum registered twice**: Remove duplicate registration; register only in `shared/enum.pothos.ts`
- **Missing barrel export**: Add the missing `export * from` in `pothos/certificates/index.ts`
- **Type mismatch on input field**: Verify field names, types, and required/nullable alignment match `SubmitInput` types from `backend/types`
- **Cannot find module**: Add barrel entry to `pothos/index.ts`

Fix the Pothos definition causing the error, then re-run both commands.

### Requirements References

- _Requirements_: R26 (GraphQL code generation — generate:gqlSchema + codegen), R23 (enum registration — must be complete for schema generation)

### Instruction Verification

Before running codegen, verify:
- `backend/graphql/AGENTS.md` — rules on enum registration (enums registered once in `shared/enum.pothos.ts`)
- All 8 certificate enums are registered in `shared/enum.pothos.ts`
- All barrel files are in place (Task 6)

### Quality Loop

```bash
# Verify tsgo still passes after schema generation
~/.bun/bin/bun run tsgo

# Biome check on any generated files (if they need formatting)
~/.bun/bin/bun biome:check
```

### Outcome Document

Write `outcome/task-07-outcome.md` documenting:
- Commands run and their output
- All certificate operations verified in SDL (checklist from Step 3)
- All certificate types verified in codegen output
- Any errors encountered and resolutions
- Final SDL file path and codegen output directory

---

## Task 8: Quality Loop Per File + Instruction Verification

**Estimated Time**: 2-3 hours

### Scope

Run a comprehensive per-file quality loop on ALL files created in Tasks 1-6. This is a verification pass, not a creation task. Each file must pass tsgo, biome, and lint independently.

### Files to Verify

| File | Task Created |
|---|---|
| `backend/graphql/pothos/certificates/certificate.pothos.ts` | Task 1 |
| `backend/graphql/pothos/certificates/certificate-template.pothos.ts` | Task 1 |
| `backend/graphql/pothos/certificates/certificate-verification.pothos.ts` | Task 2 |
| `backend/graphql/query/certificates/certificate.query.ts` | Task 3 |
| `backend/graphql/query/certificates/certificate-template.query.ts` | Task 3 |
| `backend/graphql/query/certificates/certificate-meta.query.ts` | Task 3 |
| `backend/graphql/query/certificates/index.ts` | Task 3 |
| `backend/graphql/mutation/certificates/certificate-template.mutation.ts` | Task 4 |
| `backend/graphql/mutation/certificates/certificate.mutation.ts` | Task 4 |
| `backend/graphql/mutation/certificates/certificate-recipient-group.mutation.ts` | Task 5 |
| `backend/graphql/mutation/certificates/index.ts` | Task 5 |
| `backend/graphql/pothos/certificates/index.ts` | Task 6 |
| `backend/graphql/query/index.ts` (edited) | Task 6 |
| `backend/graphql/mutation/index.ts` (edited) | Task 6 |
| `backend/graphql/pothos/index.ts` (edited) | Task 6 |
| `backend/graphql/pothos/shared/enum.pothos.ts` (edited — 8 enums added) | Task 1/7 |

### Verification Steps

For each file, run the progressive verification loop:

```bash
# Per-file progressive loop (short-circuits at first failure)
for file in \
  "backend/graphql/pothos/certificates/certificate.pothos.ts" \
  "backend/graphql/pothos/certificates/certificate-template.pothos.ts" \
  "backend/graphql/pothos/certificates/certificate-verification.pothos.ts" \
  "backend/graphql/query/certificates/certificate.query.ts" \
  "backend/graphql/query/certificates/certificate-template.query.ts" \
  "backend/graphql/query/certificates/certificate-meta.query.ts" \
  "backend/graphql/query/certificates/index.ts" \
  "backend/graphql/mutation/certificates/certificate-template.mutation.ts" \
  "backend/graphql/mutation/certificates/certificate.mutation.ts" \
  "backend/graphql/mutation/certificates/certificate-recipient-group.mutation.ts" \
  "backend/graphql/mutation/certificates/index.ts" \
  "backend/graphql/pothos/certificates/index.ts" \
  "backend/graphql/query/index.ts" \
  "backend/graphql/mutation/index.ts" \
  "backend/graphql/pothos/index.ts" \
  "backend/graphql/pothos/shared/enum.pothos.ts"; do

  echo "=== Verifying: $file ==="

  # 1. tsgo (type check)
  ~/.bun/bin/bun run tsgo 2>&1 | grep -E "error|$file" || echo "tsgo: OK"

  # 2. biome
  ~/.bun/bin/bun biome:check "$file" 2>&1 | tail -5

  # 3. lint via queue
  curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
    -H "Content-Type: application/json" \
    -d "{\"id\":\"verify-$file\",\"files\":[\"$file\"]}"
done
```

Alternatively, use the project's sub-loop script:
```bash
~/.bun/bin/bun run scripts/health/sub-loop.ts <file-path> --lifecycle lint
```

### Instruction Verification Checklist

For **each** file, verify against `backend/graphql/AGENTS.md`:

| Rule | Check |
|---|---|
| Single canonical object type | Only one object type per entity (no duplicates) |
| Enum registration in `shared/enum.pothos.ts` | No enum registration in domain Pothos files |
| `id` field on every object type | `t.exposeString("id", { nullable: false })` present |
| `inputRef` using centralized types | Import `SubmitInput` types from `@/backend/types` |
| `loadableObjectRef` for loaded entities | Certificate and Template use `loadableObjectRef` |
| No business logic in resolvers | Resolvers only auth + delegate to service |
| No repository calls in resolvers | Resolvers call services (except DataLoader `load` functions) |
| `requireAuth(ctx)` on non-public resolvers | All resolvers except `verifyCertificate` |
| `ctx.t().errorsTranslations` for i18n | All resolvers extract `tErrors` from context |
| `authScopes` on all non-public operations | Mutations: permission+notImpersonating; Queries: loggedIn; verifyCertificate: none |

### Requirements References

- _Requirements_: R1-R27 (all requirements must be satisfied by the verified files), C1-C12 (all constraints)

### Outcome Document

Write `outcome/task-08-outcome.md` documenting:
- Per-file verification results (pass/fail for tsgo, biome, lint)
- Instruction verification checklist results (all rules checked)
- Any errors encountered and resolutions
- Final state: all files passing quality loop

---

## Task 9: Knowledge Propagation (Update AGENTS.md, Docs)

**Estimated Time**: 2-3 hours

### Scope

Propagate knowledge from this plan's implementation to the project's documentation and AGENTS.md files so subsequent plans and agents have the context they need.

### Knowledge Transfer Targets

| Target | What to Update | Why |
|---|---|---|
| `backend/graphql/AGENTS.md` | Add certificate directory to the file inventory; note the public `verifyCertificate` pattern; note DataLoader batch for elements/variables | Subsequent agents working in GraphQL layer need to know certificate types exist |
| `backend/graphql/pothos/index.ts` | Already edited in Task 6 — document the barrel entry in AGENTS.md if there's a barrel inventory section | Consistency |
| `shared/locale/` error translations | Verify `cert.*` error keys exist in all locale files for GraphQL resolver error handling | GraphQL resolvers reference `ctx.t().errorsTranslations.cert.*` |
| `.ai/draft_plans/cert/plans/05-graphql-api/outcome/00-final-summary.md` | Write final outcome summary | Knowledge transfer to Plan 06+ (PDF rendering, frontend views, integration tests) |

### Steps

#### Step 1: Update `backend/graphql/AGENTS.md`

Add a section documenting the certificate GraphQL layer:

```markdown
## Certificate GraphQL Layer

**Path**: `backend/graphql/pothos/certificates/`

### Object Types
- `CertificatePothosObject` — loadableObjectRef with DataLoader batch (`CertificateRepository.loadByIds`)
- `CertificateTemplatePothosObject` — loadableObjectRef with DataLoader batch (`CertificateTemplateRepository.loadByIds`)
- `CertificateTemplateElementPothosObject` — objectRef (not loaded by ID)
- `CertificateTemplateVariablePothosObject` — objectRef (not loaded by ID)
- `CertificateVerificationResultPothosObject` — objectRef (public verification output)
- `CertificateRecipientGroupPothosObject` — objectRef with `recipientCount` field resolved via batch service
- `DeleteRecipientGroupResultPothosObject` — result object for delete mutation
- `CertificateCategoryPothosObject` — objectRef for category metadata

### Public Query Pattern
- `verifyCertificate` query has **NO authScopes** — accessible without authentication
- Returns limited fields: `isValid`, `certificateNumber`, `title`, `recipientName`, `issueDate`, `status`, `templateName`, `verificationStatus`
- Does NOT call `requireAuth(ctx)` — public access
- Passes `ctx.locale` to `CertificateVerificationService` for localized output

### DataLoader Batch Pattern for List Fields
- Template `elements` field: uses `t.field()` (NOT `t.loadable()`) with `TemplateElementService.resolveElementsForTemplateIds()` returning `Map<string, TemplateElementReturnType[]>`
- Template `variables` field: uses `t.field()` with `TemplateVariableService.resolveVariablesForTemplateIds()` returning `Map<string, TemplateVariableReturnType[]>`
- `t.loadable()` cannot return lists — use `t.field()` with batch service methods instead

### Enum Registration
8 certificate enums registered in `backend/graphql/pothos/shared/enum.pothos.ts`:
- `CertificateStatus`, `CertificateResolution`, `CertificateVerificationStatus`, `TemplateStatus`, `TemplateElementType`, `TemplateVariableType`, `CertificateOrientation`, `CertificatesOrderByColumn`

### Query/Mutation Barrels
- Query barrel: `backend/graphql/query/certificates/index.ts`
- Mutation barrel: `backend/graphql/mutation/certificates/index.ts`
- Pothos barrel: `backend/graphql/pothos/certificates/index.ts`
```

#### Step 2: Verify Error Translation Keys

Check that all `ctx.t().errorsTranslations.cert.*` keys referenced by certificate resolvers and services exist in:
- `shared/locale/en/cert.ts` (or wherever cert error translations live)
- All other locale files

Missing keys will cause runtime errors when resolvers try to throw localized errors.

```bash
# Search for cert.* error key references in certificate Pothos files
grep -rn "tErrors\.cert\." backend/graphql/pothos/certificates/
grep -rn "tErrors\.cert\." backend/graphql/query/certificates/
grep -rn "tErrors\.cert\." backend/graphql/mutation/certificates/

# Verify those keys exist in locale files
grep -rn "cert" shared/locale/en/
```

#### Step 3: Write Final Outcome Summary

Create `outcome/00-final-summary.md`:

```markdown
# Plan 05 — GraphQL API: Final Outcome Summary

## Operations Added

### Queries (7)
1. `certificates` — paginated list with filters (authScopes: loggedIn)
2. `certificate` — by ID (authScopes: loggedIn)
3. `certificateTemplates` — paginated list (authScopes: loggedIn)
4. `certificateTemplate` — by ID (authScopes: loggedIn)
5. `verifyCertificate` — public verification (NO authScopes)
6. `certificateCategories` — list categories (authScopes: loggedIn)
7. `certificateRecipientGroups` — paginated list (authScopes: loggedIn)

### Mutations (9)
1. `createCertificateTemplate` (CERTIFICATES_TEMPLATES_MANAGE)
2. `updateCertificateTemplate` (CERTIFICATES_TEMPLATES_MANAGE)
3. `publishCertificateTemplate` (CERTIFICATES_TEMPLATES_MANAGE)
4. `archiveCertificateTemplate` (CERTIFICATES_TEMPLATES_MANAGE)
5. `generateCertificate` (CERTIFICATES_GENERATE)
6. `revokeCertificate` (CERTIFICATES_REVOKE)
7. `createRecipientGroup` (CERTIFICATES_MANAGE)
8. `updateRecipientGroup` (CERTIFICATES_MANAGE)
9. `deleteRecipientGroup` (CERTIFICATES_MANAGE)

## Object Types (10)
- Certificate (loadableObjectRef)
- CertificatesWithFiltersResponse (objectRef)
- CertificateTemplate (loadableObjectRef)
- CertificateTemplatesWithFiltersResponse (objectRef)
- CertificateTemplateElement (objectRef)
- CertificateTemplateVariable (objectRef)
- CertificateVerificationResult (objectRef — public)
- CertificateRecipientGroup (objectRef)
- DeleteRecipientGroupResult (objectRef)
- CertificateCategory (objectRef)

## Input Types (6)
- CertificateFilterArgs (inputRef)
- CreateCertificateTemplateInput (inputRef)
- UpdateCertificateTemplateInput (inputRef)
- GenerateCertificateInput (inputRef)
- CreateRecipientGroupInput (inputRef)
- UpdateRecipientGroupInput (inputRef)

## Enums Registered (8)
- CertificateStatus, CertificateResolution, CertificateVerificationStatus, TemplateStatus, TemplateElementType, TemplateVariableType, CertificateOrientation, CertificatesOrderByColumn

## Files Created (12)
- backend/graphql/pothos/certificates/certificate.pothos.ts
- backend/graphql/pothos/certificates/certificate-template.pothos.ts
- backend/graphql/pothos/certificates/certificate-verification.pothos.ts
- backend/graphql/pothos/certificates/index.ts
- backend/graphql/query/certificates/certificate.query.ts
- backend/graphql/query/certificates/certificate-template.query.ts
- backend/graphql/query/certificates/certificate-meta.query.ts
- backend/graphql/query/certificates/index.ts
- backend/graphql/mutation/certificates/certificate-template.mutation.ts
- backend/graphql/mutation/certificates/certificate.mutation.ts
- backend/graphql/mutation/certificates/certificate-recipient-group.mutation.ts
- backend/graphql/mutation/certificates/index.ts

## Files Edited (4)
- backend/graphql/pothos/shared/enum.pothos.ts (8 enums added)
- backend/graphql/pothos/index.ts (certificates barrel added)
- backend/graphql/query/index.ts (certificates import added)
- backend/graphql/mutation/index.ts (certificates import added)

## Code Generation
- `bun run generate:gqlSchema` — ✅ Complete
- `bun codegen` — ✅ Complete

## Quality Verification
- tsgo — ✅ All files pass
- biome:check — ✅ All files pass
- lint (ESLint via queue) — ✅ All files pass
- Instruction verification (backend/graphql/AGENTS.md) — ✅ All rules satisfied
```

### Requirements References

- _Requirements_: R27 (outcome tracking — per-task and final outcome documents), R23 (enum registration verification)

### Instruction Verification

Before finalizing, verify:
- `backend/graphql/AGENTS.md` correctly documents the certificate GraphQL layer
- All error translation keys referenced in Pothos files exist in locale files
- Final outcome summary is complete and accurate

### Quality Loop

```bash
# Verify AGENTS.md has no broken markdown
~/.bun/bin/bun biome:check backend/graphql/AGENTS.md

# Final full tsgo pass
~/.bun/bin/bun run tsgo

# Final full lint pass via queue
~/.bun/bin/bun run lint
```

### Outcome Document

Write `outcome/task-09-outcome.md` documenting:
- AGENTS.md updates made
- Error translation key verification results
- Final outcome summary file created
- Knowledge transfer to Plan 06+ (PDF rendering, frontend views, integration tests) documented
- Any documentation gaps discovered and resolutions

---

## Task Dependency Graph

```
Task 1 (Object Types) ──┐
                        ├──→ Task 6 (Barrels) ──→ Task 7 (Codegen) ──→ Task 8 (Quality) ──→ Task 9 (Knowledge)
Task 2 (Verification)  ─┤
                        │
Task 3 (Queries) ───────┤
                        │
Task 4 (Mutations: Templates/Generate/Revoke) ─┤
                        │
Task 5 (Mutations: Recipient Groups) ────────┘
```

- Tasks 1-5 can be partially parallelized (Tasks 1 and 2 are independent; Tasks 3-5 depend on Tasks 1-2).
- Task 6 depends on all of Tasks 1-5.
- Task 7 depends on Task 6.
- Task 8 depends on Tasks 1-7.
- Task 9 depends on Task 8.

---

## Summary

| Task | Title | Est. Time | Depends On |
|---|---|---|---|
| 1 | Create Pothos object types (certificate, template, element, variable) | 3-4h | Plan 02, 04 |
| 2 | Create verification result object type | 1-2h | Task 1 |
| 3 | Create query resolvers (certificates list, certificate by id, verifyCertificate public) | 3-4h | Task 1, 2 |
| 4 | Create mutation resolvers (template CRUD, generate, revoke) | 3-4h | Task 1 |
| 5 | Create mutation resolvers (recipient group CRUD) | 2-3h | Task 2 |
| 6 | Create barrel + register in query/mutation index | 1-2h | Task 1-5 |
| 7 | Run `bun run generate:gqlSchema` + `bun codegen` | 1-2h | Task 6 |
| 8 | Quality loop per file (tsgo + biome + lint) + instruction verification | 2-3h | Task 1-7 |
| 9 | Knowledge propagation (update AGENTS.md, docs) | 2-3h | Task 8 |
| **Total** | | **18-27h** | |
