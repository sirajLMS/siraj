# Technical Design: Certificate GraphQL API (Plan 05)

## Document Information

- **Feature Name**: Certificate GraphQL API Layer
- **Target Directory**: `.ai/draft_plans/cert/plans/05-graphql-api`
- **Outcome Directory**: `.ai/draft_plans/cert/plans/05-graphql-api/outcome`
- **Version**: 1.0
- **Date**: 2025-01-20
- **Author**: Siraj Development Team
- **Related Documents**:
  - Requirements: `.ai/draft_plans/cert/plans/05-graphql-api/requirements.md`
  - Analysis: `.ai/draft_plans/cert/siraj_analysis/04-services-graphql-patterns.md` (sections C–G)
  - Analysis: `.ai/draft_plans/cert/cgvs_analysis/03-graphql-api.md` (operation reference)
  - Analysis: `.ai/draft_plans/cert/siraj_analysis/02-types-enums-patterns.md` (type patterns)
  - Dependencies: Plan 02 (Types & Permissions), Plan 03 (Repository), Plan 04 (Services)

---

## 1. Architecture Overview

### 1.1 Data Flow

```
Client Component → Apollo Hook → GraphQL API → Pothos Resolver
  → requireAuth(ctx) → ctx.t().errorsTranslations
  → Service Layer (Plan 04) → Repository Layer (Plan 03) → Database
```

The GraphQL API layer is a **thin adapter** between the frontend and the service layer. Resolvers perform three tasks only:

1. **Authenticate** — `const userId = await requireAuth(ctx)` (except public `verifyCertificate`)
2. **Extract localized errors** — `const tErrors = ctx.t().errorsTranslations`
3. **Delegate to service** — call a `Certificate*Service` method, passing `userId`, args, and `tErrors`

No business logic, no repository calls, no `GraphQLError` construction in resolvers. Services throw `DomainError` / `NotFoundError` / `Error(tErrors.cert.*)`; the Pothos errors plugin handles formatting.

### 1.2 Two Access Patterns

| Access Pattern | Auth Scope | Example Operations |
|---|---|---|
| **Authenticated staff** | `authScopes: { loggedIn: true }` for queries, `authScopes: { permission: AppPermission.X, notImpersonating: true }` for mutations | `certificates`, `certificate`, `createCertificateTemplate`, `generateCertificate`, `revokeCertificate` |
| **Public visitor** | No `authScopes` (truly public) | `verifyCertificate` — returns limited certificate info by verification code |

---

## 2. File Structure

### 2.1 Files to Create

All new files live under `backend/graphql/pothos/certificates/` (the Pothos objects, inputs, and barrel), `backend/graphql/query/certificates/` (query resolvers), and `backend/graphql/mutation/certificates/` (mutation resolvers). Edits to existing files register the new domain in barrels.

```
backend/graphql/pothos/certificates/
├── certificate.pothos.ts              # CertificatePothosObject (loadableObjectRef), CertificateListPothosObject, input refs
├── certificate-template.pothos.ts     # TemplatePothosObject (loadableObjectRef), TemplateElementPothosObject, TemplateVariablePothosObject, input refs
├── certificate-verification.pothos.ts # CertificateVerificationResultPothosObject (public output)
├── certificate-recipient-group.pothos.ts  # CertificateRecipientGroupPothosObject + input refs
├── index.ts                           # Barrel: export * from each pothos file

backend/graphql/query/certificates/
├── certificate.query.ts               # certificates (list), certificate (by id), verifyCertificate (public)
├── certificate-template.query.ts     # certificateTemplates (list), certificateTemplate (by id)
├── certificate-meta.query.ts         # certificateCategories, certificateRecipientGroups
├── index.ts                           # Barrel: side-effect imports

backend/graphql/mutation/certificates/
├── certificate-template.mutation.ts   # createTemplate, updateTemplate, publishTemplate, archiveTemplate
├── certificate.mutation.ts           # generateCertificate, revokeCertificate
├── certificate-recipient-group.mutation.ts  # createRecipientGroup, updateRecipientGroup, deleteRecipientGroup
├── index.ts                           # Barrel: side-effect imports
```

### 2.2 Files to Edit (Existing)

| File | Change |
|---|---|
| `backend/graphql/pothos/shared/enum.pothos.ts` | Add 8 certificate enum registrations (see §4.2) |
| `backend/graphql/pothos/index.ts` | Add `export * from "@/backend/graphql/pothos/certificates";` (after "books") |
| `backend/graphql/query/index.ts` | Add `import "./certificates";` (after "classes") |
| `backend/graphql/mutation/index.ts` | Add `import "./certificates";` (after "classes") |

### 2.3 Query/Mutation Architecture Decision

**Decision**: Place query and mutation field definitions in dedicated `query/certificates/` and `mutation/certificates/` directories, NOT inline in the `pothos/certificates/` files.

**Rationale**: Siraj's canonical pattern separates Pothos object type definitions (`pothos/`) from root field definitions (`query/`, `mutation/`). The `billing` domain follows this: object types in `pothos/billing/billing-management.pothos.ts`, mutations in `pothos/billing/billing-management.pothos.ts` (billing uses inline mutationField). The `students` domain also uses inline `queryField` in the pothos file. However, the `storage` domain separates queries and mutations into `query/storage/` and `mutation/storage/`.

**Chosen approach**: Follow the **inline** pattern used by billing and students — define `queryField` and `mutationField` calls within the Pothos domain files themselves. This keeps all related GraphQL definitions for a domain in one place, which is the more common pattern in the codebase. The barrel `index.ts` in `pothos/certificates/` will side-effect export all files.

**Revised file layout** (inline pattern):

```
backend/graphql/pothos/certificates/
├── certificate.pothos.ts              # CertificatePothosObject (loadableObjectRef) + CertificateFilterArgs + CertificateOrderByClause + CertificatesWithFiltersPothosObject
├── certificate-template.pothos.ts     # CertificateTemplatePothosObject (loadableObjectRef) + CertificateTemplateElementPothosObject + CertificateTemplateVariablePothosObject + input/filter/orderBy types
├── certificate-verification.pothos.ts # CertificateVerificationResultPothosObject (public output)
├── certificate-recipient-group.pothos.ts  # CertificateRecipientGroupPothosObject + input types + DeleteRecipientGroupResultPothosObject
├── certificate-query.pothos.ts        # queryField definitions: certificates, certificate, certificateTemplates, certificateTemplate, verifyCertificate (public), certificateCategories, certificateRecipientGroups
├── certificate-mutation.pothos.ts     # mutationField definitions: createTemplate, updateTemplate, publishTemplate, archiveTemplate, generateCertificate, revokeCertificate, createRecipientGroup, updateRecipientGroup, deleteRecipientGroup
├── index.ts                           # Barrel: export * from each file
```

**Files to edit** (revised):

| File | Change |
|---|---|
| `backend/graphql/pothos/shared/enum.pothos.ts` | Add 8 certificate enum registrations (see §4.2) |
| `backend/graphql/pothos/index.ts` | Add `export * from "@/backend/graphql/pothos/certificates";` (after "books") |
| `backend/graphql/query/index.ts` | Add `import "./certificates";` (after "classes") |
| `backend/graphql/mutation/index.ts` | Add `import "./certificates";` (after "classes") |

**Decision: Use the separate query/mutation directory pattern.** Siraj's canonical structure uses `backend/graphql/query/<domain>/` and `backend/graphql/mutation/<domain>/` directories with side-effect import barrels. This is how `gqlSchema.ts` discovers query/mutation fields — it imports `query/index.ts` and `mutation/index.ts` which in turn import each domain subdirectory. Object types and input types are defined in `pothos/certificates/`, while root field definitions (`queryField`/`mutationField`) live in `query/certificates/` and `mutation/certificates/`.

**Final file list**:

```
backend/graphql/pothos/certificates/
├── certificate.pothos.ts              # CertificatePothosObject (loadableObjectRef), CertificatesWithFiltersPothosObject, filter/orderBy input types
├── certificate-template.pothos.ts     # CertificateTemplatePothosObject (loadableObjectRef), TemplateElementPothosObject, TemplateVariablePothosObject, input types
├── certificate-verification.pothos.ts # CertificateVerificationResultPothosObject (public output)
├── certificate-recipient-group.pothos.ts  # CertificateRecipientGroupPothosObject, DeleteRecipientGroupResultPothosObject, input types
├── index.ts                           # Barrel: export * from each file

backend/graphql/query/certificates/
├── certificate.query.ts               # certificates (list), certificate (by id), verifyCertificate (public)
├── certificate-template.query.ts     # certificateTemplates (list), certificateTemplate (by id)
├── certificate-meta.query.ts         # certificateCategories, certificateRecipientGroups
├── index.ts                           # Barrel: side-effect imports

backend/graphql/mutation/certificates/
├── certificate-template.mutation.ts   # createCertificateTemplate, updateCertificateTemplate, publishCertificateTemplate, archiveCertificateTemplate
├── certificate.mutation.ts           # generateCertificate, revokeCertificate
├── certificate-recipient-group.mutation.ts  # createRecipientGroup, updateRecipientGroup, deleteRecipientGroup
├── index.ts                           # Barrel: side-effect imports
```

**Edits to existing files**:

| File | Change |
|---|---|
| `backend/graphql/pothos/shared/enum.pothos.ts` | Add 8 certificate enum registrations (see §4.2) |
| `backend/graphql/pothos/index.ts` | Add `export * from "@/backend/graphql/pothos/certificates";` (after "books") |
| `backend/graphql/query/index.ts` | Add `import "./certificates";` (after "classes") |
| `backend/graphql/mutation/index.ts` | Add `import "./certificates";` (after "classes") |

> **Note on barrel registration**: `backend/graphql/pothos/index.ts` is imported by `gqlSchema.ts`, re-exporting all Pothos object types and input refs. `query/index.ts` and `mutation/index.ts` are also imported by `gqlSchema.ts` as side-effect entry points — they import each domain subdirectory, which triggers `queryField`/`mutationField` registrations. All three barrels MUST be updated for the schema to include certificate operations.

---

## 3. Pothos Object Type Designs

### 3.1 `certificate.pothos.ts` — Certificate Object + List + Inputs

**Purpose**: Defines the `Certificate` GraphQL object type backed by DataLoader, the paginated list response type, filter input, and orderBy clause.

**Pattern**: `loadableObjectRef<CertificateReturnType, string>` with batch load — mirrors `StudentPothosObject` from `student.pothos.ts:21-69`.

```typescript
// backend/graphql/pothos/certificates/certificate.pothos.ts
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  CertificateStatusPothosEnum,
  CertificateResolutionPothosEnum,
  OrderSortDirectionPothosObject,
} from "@/backend/graphql/pothos/shared/enum.pothos";
import { PageInfoObject } from "@/backend/graphql/pothos/shared/pagination.objects";
import { CertificateRepository } from "@/backend/db/repo";
import type {
  CertificateReturnType,
  CertificatesWithFiltersResponse,
  CertificateFilterArgs,
  CertificatesOrderByClause,
} from "@/backend/types";

export const CertificatePothosObject = gqlSchemaBuilder
  .loadableObjectRef<CertificateReturnType, string>("Certificate", {
    load: async (ids: string[]) => CertificateRepository.loadByIds(ids),
    sort: c => c.id,
  })
  .implement({
    fields: t => ({
      id: t.exposeString("id", { nullable: false }),
      verificationCode: t.exposeString("verificationCode", { nullable: false }),
      status: t.field({
        type: CertificateStatusPothosEnum,
        nullable: false,
        resolve: c => c.status,
      }),
      resolution: t.field({
        type: CertificateResolutionPothosEnum,
        nullable: true,
        resolve: c => c.resolution,
      }),
      studentId: t.exposeString("studentId", { nullable: false }),
      templateId: t.exposeString("templateId", { nullable: false }),
      recipientGroupId: t.exposeString("recipientGroupId", { nullable: false }),
      issueDate: t.expose("issueDate", { type: "DateTime", nullable: false }),
      revokedAt: t.expose("revokedAt", { type: "DateTime", nullable: true }),
      revocationReason: t.exposeString("revocationReason", { nullable: true }),
      fileUrl: t.field({
        type: "String",
        nullable: true,
        resolve: async c => {
          const { getStorageService } = await import("@/backend/storage/storage.service");
          const storage = await getStorageService();
          return storage.fileSignedUrl(c.filePath);
        },
      }),
      version: t.exposeInt("version", { nullable: false }),
      createdAt: t.expose("createdAt", { type: "DateTime", nullable: false }),
      updatedAt: t.expose("updatedAt", { type: "DateTime", nullable: true }),
    }),
  });

export const CertificatesWithFiltersPothosObject = gqlSchemaBuilder
  .objectRef<CertificatesWithFiltersResponse>("CertificatesWithFiltersResponse")
  .implement({
    fields: t => ({
      data: t.expose("data", { type: [CertificatePothosObject], nullable: false }),
      pageInfo: t.expose("pageInfo", { type: PageInfoObject, nullable: false }),
    }),
  });

export const CertificateFilterArgsPothosObject = gqlSchemaBuilder
  .inputRef<CertificateFilterArgs>("CertificateFilterArgs")
  .implement({
    fields: t => ({
      status: t.field({ type: CertificateStatusPothosEnum }),
      templateId: t.string(),
      studentId: t.string(),
      search: t.string(),
      issuedFrom: t.field({ type: "DateTime" }),
      issuedTo: t.field({ type: "DateTime" }),
    }),
  });

export const CertificatesOrderByClausePothosObject = gqlSchemaBuilder
  .inputRef<CertificatesOrderByClause>("CertificatesOrderByClause")
  .implement({
    fields: t => ({
      column: t.field({ type: CertificatesOrderByColumnPothosEnum, required: true }),
      order: t.field({
        type: OrderSortDirectionPothosObject,
        required: false,
        defaultValue: "ASC",
      }),
    }),
  });
```

**Key design decisions**:
- `loadableObjectRef` batches single-entity loads by ID via `CertificateRepository.loadByIds(ids)` — prevents N+1 when multiple certificates are queried in the same request.
- `fileUrl` is resolved lazily via `getStorageService()` dynamic import — keeps the storage service decoupled from the Pothos module and avoids circular dependency issues.
- `CertificatesWithFiltersPothosObject` mirrors `StudentsWithFiltersPothosObject` (`student.pothos.ts:131-138`).
- `CertificateFilterArgsPothosObject` mirrors `StudentFilterArgsPothosObject` (`student.pothos.ts:140-181`).
- `CertificatesOrderByClausePothosObject` mirrors `StudentsOrderByClausePothosObject` (`student.pothos.ts:187-201`).
- `_Requirements_: R1, R2, R24*

### 3.2 `certificate-template.pothos.ts` — Template + Element + Variable Objects

**Purpose**: Defines `CertificateTemplate` (loadableObjectRef), `CertificateTemplateElement` (objectRef), `CertificateTemplateVariable` (objectRef), and all template-related input types.

**Pattern**: Template uses `loadableObjectRef`. Elements and variables use `objectRef` (no DataLoader) because they are loaded via batch field resolvers on the template object.

```typescript
// backend/graphql/pothos/certificates/certificate-template.pothos.ts
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  CertificateOrientationPothosEnum,
  TemplateElementTypePothosEnum,
  TemplateStatusPothosEnum,
  TemplateVariableTypePothosEnum,
} from "@/backend/graphql/pothos/shared/enum.pothos";
import { CertificateTemplateRepository } from "@/backend/db/repo";
import type {
  CertificateTemplateReturnType,
  CertificateTemplateElementReturnType,
  CertificateTemplateVariableReturnType,
  CertificateTemplateFilterArgs,
  CertificateTemplatesWithFiltersResponse,
  CreateCertificateTemplateSubmitInput,
  UpdateCertificateTemplateSubmitInput,
  CertificatesTemplatesOrderByClause,
} from "@/backend/types";

export const CertificateTemplatePothosObject = gqlSchemaBuilder
  .loadableObjectRef<CertificateTemplateReturnType, string>("CertificateTemplate", {
    load: async (ids: string[]) => CertificateTemplateRepository.loadByIds(ids),
    sort: t => t.id,
  })
  .implement({
    fields: t => ({
      id: t.exposeString("id", { nullable: false }),
      name: t.exposeString("name", { nullable: false }),
      description: t.exposeString("description", { nullable: true }),
      status: t.field({
        type: TemplateStatusPothosEnum,
        nullable: false,
        resolve: t => t.status,
      }),
      orientation: t.field({
        type: CertificateOrientationPothosEnum,
        nullable: false,
        resolve: t => t.orientation,
      }),
      width: t.exposeInt("width", { nullable: false }),
      height: t.exposeInt("height", { nullable: false }),
      backgroundColor: t.exposeString("backgroundColor", { nullable: true }),
      fontFamily: t.exposeString("fontFamily", { nullable: true }),
      categoryId: t.exposeString("categoryId", { nullable: true }),
      createdByUserId: t.exposeString("createdByUserId", { nullable: false }),
      version: t.exposeInt("version", { nullable: false }),
      createdAt: t.expose("createdAt", { type: "DateTime", nullable: false }),
      updatedAt: t.expose("updatedAt", { type: "DateTime", nullable: true }),
      publishedAt: t.expose("publishedAt", { type: "DateTime", nullable: true }),
      // DataLoader batch field resolvers (NOT t.loadable — cannot return lists)
      elements: t.field({
        type: [CertificateTemplateElementPothosObject],
        nullable: false,
        resolve: async template => {
          const { CertificateTemplateService } = await import("@/backend/services");
          const map = await CertificateTemplateService.resolveElementsForTemplateIds([template.id]);
          return map.get(template.id) ?? [];
        },
      }),
      variables: t.field({
        type: [CertificateTemplateVariablePothosObject],
        nullable: false,
        resolve: async template => {
          const { CertificateTemplateService } = await import("@/backend/services");
          const map = await CertificateTemplateService.resolveVariablesForTemplateIds([template.id]);
          return map.get(template.id) ?? [];
        },
      }),
    }),
  });

export const CertificateTemplateElementPothosObject = gqlSchemaBuilder
  .objectRef<CertificateTemplateElementReturnType>("CertificateTemplateElement")
  .implement({
    fields: t => ({
      id: t.exposeString("id", { nullable: false }),
      templateId: t.exposeString("templateId", { nullable: false }),
      elementType: t.field({
        type: TemplateElementTypePothosEnum,
        nullable: false,
        resolve: e => e.elementType,
      }),
      label: t.exposeString("label", { nullable: true }),
      content: t.exposeString("content", { nullable: true }),
      xPosition: t.float({ nullable: false, resolve: e => e.xPosition }),
      yPosition: t.float({ nullable: false, resolve: e => e.yPosition }),
      width: t.float({ nullable: true, resolve: e => e.width ?? null }),
      height: t.float({ nullable: true, resolve: e => e.height ?? null }),
      rotation: t.float({ nullable: true, resolve: e => e.rotation ?? null }),
      fontSize: t.exposeInt("fontSize", { nullable: true }),
      fontWeight: t.exposeString("fontWeight", { nullable: true }),
      color: t.exposeString("color", { nullable: true }),
      imageFileId: t.exposeString("imageFileId", { nullable: true }),
      zIndex: t.exposeInt("zIndex", { nullable: false }),
      createdAt: t.expose("createdAt", { type: "DateTime", nullable: false }),
      updatedAt: t.expose("updatedAt", { type: "DateTime", nullable: true }),
    }),
  });

export const CertificateTemplateVariablePothosObject = gqlSchemaBuilder
  .objectRef<CertificateTemplateVariableReturnType>("CertificateTemplateVariable")
  .implement({
    fields: t => ({
      id: t.exposeString("id", { nullable: false }),
      templateId: t.exposeString("templateId", { nullable: false }),
      variableKey: t.exposeString("variableKey", { nullable: false }),
      variableType: t.field({
        type: TemplateVariableTypePothosEnum,
        nullable: false,
        resolve: v => v.variableType,
      }),
      label: t.exposeString("label", { nullable: true }),
      defaultValue: t.exposeString("defaultValue", { nullable: true }),
      required: t.exposeBoolean("required", { nullable: false }),
      options: t.field({
        type: ["String"],
        nullable: true,
        resolve: v => v.options ?? null,
      }),
      minValue: t.float({ nullable: true, resolve: v => v.minValue ?? null }),
      maxValue: t.float({ nullable: true, resolve: v => v.maxValue ?? null }),
      createdAt: t.expose("createdAt", { type: "DateTime", nullable: false }),
      updatedAt: t.expose("updatedAt", { type: "DateTime", nullable: true }),
    }),
  });

// Input types (matching Plan 02 SubmitInput types)
export const CreateCertificateTemplateInputRef = gqlSchemaBuilder
  .inputRef<CreateCertificateTemplateSubmitInput>("CreateCertificateTemplateInput")
  .implement({
    fields: t => ({
      name: t.string({ required: true }),
      description: t.string({ required: false }),
      orientation: t.field({ type: CertificateOrientationPothosEnum, required: true }),
      width: t.int({ required: true }),
      height: t.int({ required: true }),
      backgroundColor: t.string({ required: false }),
      fontFamily: t.string({ required: false }),
      categoryId: t.string({ required: false }),
      // Elements and variables are nested input lists
      elements: t.field({ type: [TemplateElementInputRef], required: false }),
      variables: t.field({ type: [TemplateVariableInputRef], required: false }),
    }),
  });

export const UpdateCertificateTemplateInputRef = gqlSchemaBuilder
  .inputRef<UpdateCertificateTemplateSubmitInput>("UpdateCertificateTemplateInput")
  .implement({
    fields: t => ({
      id: t.string({ required: true }),
      name: t.string({ required: false }),
      description: t.string({ required: false }),
      orientation: t.field({ type: CertificateOrientationPothosEnum, required: false }),
      width: t.int({ required: false }),
      height: t.int({ required: false }),
      backgroundColor: t.string({ required: false }),
      fontFamily: t.string({ required: false }),
      categoryId: t.string({ required: false }),
      expectedVersion: t.int({ required: false }),
    }),
  });
```

**Key design decisions**:
- Template `elements` and `variables` field resolvers use `t.field()` (NOT `t.loadable()`) because `t.loadable()` cannot return lists per analysis §C.7 and §E.3.
- Batch service methods return `Map<string, T[]>` to support future multi-template queries.
- Element/variable input types (`TemplateElementInputRef`, `TemplateVariableInputRef`) are defined within the same file as nested inputs.
- All input types use `inputRef<SubmitInputType>` from centralized `backend/types` — never ad-hoc types.
- `_Requirements_: R3, R22, R24*

### 3.3 `certificate-verification.pothos.ts` — Public Verification Output

**Purpose**: Defines the `CertificateVerificationResult` object type returned by the public `verifyCertificate` query.

**Pattern**: `objectRef` (no DataLoader — result is constructed by service, not loaded by ID).

```typescript
// backend/graphql/pothos/certificates/certificate-verification.pothos.ts
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { CertificateVerificationStatusPothosEnum } from "@/backend/graphql/pothos/shared/enum.pothos";
import type { CertificateVerificationResultReturnType } from "@/backend/types";

export const CertificateVerificationResultPothosObject = gqlSchemaBuilder
  .objectRef<CertificateVerificationResultReturnType>("CertificateVerificationResult")
  .implement({
    fields: t => ({
      // Only public-safe fields — NO studentId, templateId, fileUrl, recipientGroupId
      valid: t.exposeBoolean("valid", { nullable: false }),
      status: t.field({
        type: CertificateVerificationStatusPothosEnum,
        nullable: false,
        resolve: r => r.status,
      }),
      certificateTitle: t.exposeString("certificateTitle", { nullable: true }),
      recipientName: t.exposeString("recipientName", { nullable: true }),
      issueDate: t.expose("issueDate", { type: "DateTime", nullable: true }),
      templateName: t.exposeString("templateName", { nullable: true }),
      verificationCode: t.exposeString("verificationCode", { nullable: false }),
    }),
  });
```

**Key design decisions**:
- Only 7 public-safe fields: `valid`, `status`, `certificateTitle`, `recipientName`, `issueDate`, `templateName`, `verificationCode`.
- Sensitive fields (`studentId`, `templateId`, `recipientGroupId`, `fileUrl`, `version`, `createdAt`) are NOT exposed.
- The return type `CertificateVerificationResultReturnType` from `backend/types` already contains only public-safe fields — the Pothos object mirrors it.
- `_Requirements_: R4*

### 3.4 `certificate-recipient-group.pothos.ts` — Recipient Group Object

**Purpose**: Defines `CertificateRecipientGroup` object type and input types for recipient group CRUD.

```typescript
// backend/graphql/pothos/certificates/certificate-recipient-group.pothos.ts
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import type {
  CertificateRecipientGroupReturnType,
  CreateRecipientGroupSubmitInput,
  UpdateRecipientGroupSubmitInput,
  DeleteRecipientGroupReturnType,
} from "@/backend/types";

export const CertificateRecipientGroupPothosObject = gqlSchemaBuilder
  .objectRef<CertificateRecipientGroupReturnType>("CertificateRecipientGroup")
  .implement({
    fields: t => ({
      id: t.exposeString("id", { nullable: false }),
      templateId: t.exposeString("templateId", { nullable: false }),
      name: t.exposeString("name", { nullable: false }),
      description: t.exposeString("description", { nullable: true }),
      recipientCount: t.field({
        type: "Int",
        nullable: false,
        resolve: async group => {
          const { RecipientGroupService } = await import("@/backend/services");
          const counts = await RecipientGroupService.getRecipientCounts([group.id]);
          return counts.get(group.id) ?? 0;
        },
      }),
      createdAt: t.expose("createdAt", { type: "DateTime", nullable: false }),
      updatedAt: t.expose("updatedAt", { type: "DateTime", nullable: true }),
    }),
  });

export const CreateRecipientGroupInputRef = gqlSchemaBuilder
  .inputRef<CreateRecipientGroupSubmitInput>("CreateRecipientGroupInput")
  .implement({
    fields: t => ({
      templateId: t.string({ required: true }),
      name: t.string({ required: true }),
      description: t.string({ required: false }),
      recipientStudentIds: t.field({ type: ["String"], required: false }),
    }),
  });

export const UpdateRecipientGroupInputRef = gqlSchemaBuilder
  .inputRef<UpdateRecipientGroupSubmitInput>("UpdateRecipientGroupInput")
  .implement({
    fields: t => ({
      id: t.string({ required: true }),
      name: t.string({ required: false }),
      description: t.string({ required: false }),
      addRecipientStudentIds: t.field({ type: ["String"], required: false }),
      removeRecipientStudentIds: t.field({ type: ["String"], required: false }),
      expectedVersion: t.int({ required: false }),
    }),
  });

export const DeleteRecipientGroupResultPothosObject = gqlSchemaBuilder
  .objectRef<DeleteRecipientGroupReturnType>("DeleteRecipientGroupResult")
  .implement({
    fields: t => ({
      id: t.exposeString("id", { nullable: false }),
      version: t.exposeInt("version", { nullable: false }),
    }),
  });
```

**Key design decisions**:
- `recipientCount` uses a batch service method `getRecipientCounts(groupIds: string[]): Promise<Map<string, number>>` to avoid N+1.
- `DeleteRecipientGroupResultPothosObject` mirrors `DeleteInvoiceResultPothosObject` from `billing-management.pothos.ts:113-120` — result flattening pattern.
- `_Requirements_: R5, R19, R20, R21, R24*

---

## 4. Enum Registration

### 4.1 Enums to Register

8 certificate enums must be registered in `backend/graphql/pothos/shared/enum.pothos.ts`. Each is defined in `backend/enum/certificates/` (by Plan 02) and imported from `@/backend/enum`.

| Enum (TS) | Export Name (Pothos) | Values |
|---|---|---|
| `CertificateStatus` | `CertificateStatusPothosEnum` | `PENDING`, `ISSUED`, `REVOKED`, `EXPIRED` |
| `CertificateResolution` | `CertificateResolutionPothosEnum` | (resolution values from Plan 02) |
| `CertificateVerificationStatus` | `CertificateVerificationStatusPothosEnum` | `VALID`, `REVOKED`, `NOT_FOUND`, `EXPIRED` |
| `TemplateStatus` | `TemplateStatusPothosEnum` | `DRAFT`, `PUBLISHED`, `ARCHIVED` |
| `TemplateElementType` | `TemplateElementTypePothosEnum` | (element type values from Plan 02) |
| `TemplateVariableType` | `TemplateVariableTypePothosEnum` | `TEXT`, `NUMBER`, `DATE`, `SELECT` |
| `CertificateOrientation` | `CertificateOrientationPothosEnum` | `LANDSCAPE`, `PORTRAIT` |
| `CertificatesOrderByColumn` | `CertificatesOrderByColumnPothosEnum` | `ISSUE_DATE`, `STATUS`, `CREATED_AT`, `UPDATED_AT` |

### 4.2 Registration Pattern

Add to the imports section and registration section of `enum.pothos.ts`, following the existing canonical pattern:

```typescript
// In imports section (top of file, add to existing import from "@/backend/enum"):
import {
  // ... existing imports ...
  CertificateStatus,
  CertificateResolution,
  CertificateVerificationStatus,
  TemplateStatus,
  TemplateElementType,
  TemplateVariableType,
  CertificateOrientation,
  CertificatesOrderByColumn,
} from "@/backend/enum";

// In registration section (after existing enum registrations):
export const CertificateStatusPothosEnum = gqlSchemaBuilder.enumType(CertificateStatus, {
  name: "CertificateStatus",
});

export const CertificateResolutionPothosEnum = gqlSchemaBuilder.enumType(CertificateResolution, {
  name: "CertificateResolution",
});

export const CertificateVerificationStatusPothosEnum = gqlSchemaBuilder.enumType(CertificateVerificationStatus, {
  name: "CertificateVerificationStatus",
});

export const TemplateStatusPothosEnum = gqlSchemaBuilder.enumType(TemplateStatus, {
  name: "TemplateStatus",
});

export const TemplateElementTypePothosEnum = gqlSchemaBuilder.enumType(TemplateElementType, {
  name: "TemplateElementType",
});

export const TemplateVariableTypePothosEnum = gqlSchemaBuilder.enumType(TemplateVariableType, {
  name: "TemplateVariableType",
});

export const CertificateOrientationPothosEnum = gqlSchemaBuilder.enumType(CertificateOrientation, {
  name: "CertificateOrientation",
});

export const CertificatesOrderByColumnPothosEnum = gqlSchemaBuilder.enumType(CertificatesOrderByColumn, {
  name: "CertificatesOrderByColumn",
});
```

**Rules** (per `backend/graphql/AGENTS.md`):
- Register each enum exactly **once** — duplicate registration produces `"X" has already been declared` runtime error.
- Use `gqlSchemaBuilder.enumType(Enum, { name })` with the actual TypeScript enum object — NOT hardcoded value arrays.
- Import the registered Pothos enum from `shared/enum.pothos.ts` in domain Pothos files — never re-register.
- Run `bun run generate:gqlSchema` then `bun codegen` after registering.
- `_Requirements_: R23*

---

## 5. Query Resolver Designs

### 5.1 `certificate.query.ts` — Certificates List, Certificate by ID, Public Verification

```typescript
// backend/graphql/query/certificates/certificate.query.ts
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import {
  CertificatePothosObject,
  CertificatesWithFiltersPothosObject,
  CertificateFilterArgsPothosObject,
  CertificatesOrderByClausePothosObject,
} from "@/backend/graphql/pothos/certificates";
import { CertificateVerificationResultPothosObject } from "@/backend/graphql/pothos/certificates";
import { PaginationArgsObject } from "@/backend/graphql/pothos/shared/pagination.objects";
import { CertificateService, CertificateVerificationService } from "@/backend/services";

// Query: certificates (paginated list with filters) — auth: loggedIn
gqlSchemaBuilder.queryField("certificates", t =>
  t.field({
    type: CertificatesWithFiltersPothosObject,
    nullable: false,
    authScopes: { loggedIn: true },
    args: {
      pagination: t.arg({ type: PaginationArgsObject, required: false }),
      filter: t.arg({ type: CertificateFilterArgsPothosObject, required: false }),
      orderBy: t.arg({ type: [CertificatesOrderByClausePothosObject], required: false }),
    },
    resolve: async (_root, args, ctx) => {
      const userId = await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;
      return CertificateService.listCertificates(userId, args, tErrors);
    },
  })
);

// Query: certificate (by id) — auth: loggedIn
gqlSchemaBuilder.queryField("certificate", t =>
  t.field({
    type: CertificatePothosObject,
    nullable: true,
    authScopes: { loggedIn: true },
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const userId = await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;
      return CertificateService.getCertificateById(userId, args.id, tErrors);
    },
  })
);

// Query: verifyCertificate (PUBLIC — no authScopes, no requireAuth)
gqlSchemaBuilder.queryField("verifyCertificate", t =>
  t.field({
    type: CertificateVerificationResultPothosObject,
    nullable: false,
    // NO authScopes — truly public
    args: {
      verificationCode: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const tErrors = ctx.t().errorsTranslations;
      return CertificateVerificationService.verifyCertificate(args.verificationCode, tErrors);
    },
  })
);
```

**Key patterns**:
- `certificates` query mirrors `students` query field pattern — paginated list with filter args.
- `certificate` query mirrors `invoicePaymentSubmission` query from `billing-management.pothos.ts:272-287`.
- `verifyCertificate` query is **public** — no `authScopes`, no `requireAuth(ctx)` call. Only `ctx.t().errorsTranslations` is used for localized error messages.
- All non-public resolvers call `requireAuth(ctx)` at the top — even though `authScopes` already gates access (per analysis §E.7, both must agree).
- `_Requirements_: R6, R7, R10*

### 5.2 `certificate-template.query.ts` — Template List & By ID

```typescript
// backend/graphql/query/certificates/certificate-template.query.ts
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import {
  CertificateTemplatePothosObject,
  CertificateTemplateFilterArgsPothosObject,
  CertificateTemplatesWithFiltersPothosObject,
  CertificateTemplatesOrderByClausePothosObject,
} from "@/backend/graphql/pothos/certificates";
import { PaginationArgsObject } from "@/backend/graphql/pothos/shared/pagination.objects";
import { CertificateTemplateService } from "@/backend/services";

// Query: certificateTemplates (paginated list)
gqlSchemaBuilder.queryField("certificateTemplates", t =>
  t.field({
    type: CertificateTemplatesWithFiltersPothosObject,
    nullable: false,
    authScopes: { loggedIn: true },
    args: {
      pagination: t.arg({ type: PaginationArgsObject, required: false }),
      filter: t.arg({ type: CertificateTemplateFilterArgsPothosObject, required: false }),
      orderBy: t.arg({ type: [CertificateTemplatesOrderByClausePothosObject], required: false }),
    },
    resolve: async (_root, args, ctx) => {
      const userId = await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;
      return CertificateTemplateService.listTemplates(userId, args, tErrors);
    },
  })
);

// Query: certificateTemplate (by id)
gqlSchemaBuilder.queryField("certificateTemplate", t =>
  t.field({
    type: CertificateTemplatePothosObject,
    nullable: true,
    authScopes: { loggedIn: true },
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const userId = await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;
      return CertificateTemplateService.getTemplateById(userId, args.id, tErrors);
    },
  })
);
```

- `_Requirements_: R8, R9*

### 5.3 `certificate-meta.query.ts` — Categories & Recipient Groups

```typescript
// backend/graphql/query/certificates/certificate-meta.query.ts
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import {
  CertificateRecipientGroupPothosObject,
  CertificateCategoryPothosObject,
} from "@/backend/graphql/pothos/certificates";
import { CertificateTemplateService, RecipientGroupService } from "@/backend/services";

// Query: certificateCategories
gqlSchemaBuilder.queryField("certificateCategories", t =>
  t.field({
    type: [CertificateCategoryPothosObject],
    nullable: false,
    authScopes: { loggedIn: true },
    resolve: async (_root, _args, ctx) => {
      const userId = await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;
      return CertificateTemplateService.listCategories(userId, tErrors);
    },
  })
);

// Query: certificateRecipientGroups
gqlSchemaBuilder.queryField("certificateRecipientGroups", t =>
  t.field({
    type: [CertificateRecipientGroupPothosObject],
    nullable: false,
    authScopes: { loggedIn: true },
    args: {
      templateId: t.arg.string({ required: false }),
    },
    resolve: async (_root, args, ctx) => {
      const userId = await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;
      return RecipientGroupService.listRecipientGroups(userId, args.templateId ?? undefined, tErrors);
    },
  })
);
```

- `_Requirements_: R11, R12*

---

## 6. Mutation Resolver Designs

### 6.1 `certificate-template.mutation.ts` — Template CRUD

```typescript
// backend/graphql/mutation/certificates/certificate-template.mutation.ts
import { AppPermission } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import {
  CertificateTemplatePothosObject,
  CreateCertificateTemplateInputRef,
  UpdateCertificateTemplateInputRef,
} from "@/backend/graphql/pothos/certificates";
import { CertificateTemplateService } from "@/backend/services";

// Mutation: createCertificateTemplate
gqlSchemaBuilder.mutationField("createCertificateTemplate", t =>
  t.field({
    type: CertificateTemplatePothosObject,
    nullable: false,
    authScopes: { permission: AppPermission.CERTIFICATES_TEMPLATES_MANAGE, notImpersonating: true },
    args: {
      input: t.arg({ type: CreateCertificateTemplateInputRef, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const userId = await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;
      return CertificateTemplateService.createTemplate(userId, args.input, tErrors);
    },
  })
);

// Mutation: updateCertificateTemplate
gqlSchemaBuilder.mutationField("updateCertificateTemplate", t =>
  t.field({
    type: CertificateTemplatePothosObject,
    nullable: true,
    authScopes: { permission: AppPermission.CERTIFICATES_TEMPLATES_MANAGE, notImpersonating: true },
    args: {
      input: t.arg({ type: UpdateCertificateTemplateInputRef, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const userId = await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;
      return CertificateTemplateService.updateTemplate(userId, args.input, tErrors);
    },
  })
);

// Mutation: publishCertificateTemplate
gqlSchemaBuilder.mutationField("publishCertificateTemplate", t =>
  t.field({
    type: CertificateTemplatePothosObject,
    nullable: false,
    authScopes: { permission: AppPermission.CERTIFICATES_TEMPLATES_MANAGE, notImpersonating: true },
    args: {
      id: t.arg.string({ required: true }),
      expectedVersion: t.arg.int({ required: false }),
    },
    resolve: async (_root, args, ctx) => {
      const userId = await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;
      return CertificateTemplateService.publishTemplate(userId, args.id, args.expectedVersion ?? undefined, tErrors);
    },
  })
);

// Mutation: archiveCertificateTemplate
gqlSchemaBuilder.mutationField("archiveCertificateTemplate", t =>
  t.field({
    type: CertificateTemplatePothosObject,
    nullable: false,
    authScopes: { permission: AppPermission.CERTIFICATES_TEMPLATES_MANAGE, notImpersonating: true },
    args: {
      id: t.arg.string({ required: true }),
      expectedVersion: t.arg.int({ required: false }),
    },
    resolve: async (_root, args, ctx) => {
      const userId = await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;
      return CertificateTemplateService.archiveTemplate(userId, args.id, args.expectedVersion ?? undefined, tErrors);
    },
  })
);
```

**Key patterns**:
- All template mutations use `authScopes: { permission: AppPermission.CERTIFICATES_TEMPLATES_MANAGE, notImpersonating: true }`.
- `createCertificateTemplate` mirrors `createManualInvoice` from `billing-management.pothos.ts:143-188` — accepts `input` arg, delegates to service.
- `publishCertificateTemplate` and `archiveCertificateTemplate` mirror `approvePaymentProof` pattern with `expectedVersion` for optimistic concurrency.
- Super admin is auto-allowed by the builder's `authScopes.permission` callback — no explicit super_admin check in resolvers.
- _Requirements_: R13, R14, R15, R16

### 6.2 `certificate.mutation.ts` — Generate & Revoke

```typescript
// backend/graphql/mutation/certificates/certificate.mutation.ts
import { AppPermission } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import {
  CertificatePothosObject,
  GenerateCertificateInputRef,
} from "@/backend/graphql/pothos/certificates";
import { CertificateGenerationService, CertificateService } from "@/backend/services";

// Mutation: generateCertificate
gqlSchemaBuilder.mutationField("generateCertificate", t =>
  t.field({
    type: CertificatePothosObject,
    nullable: false,
    authScopes: { permission: AppPermission.CERTIFICATES_GENERATE, notImpersonating: true },
    args: {
      input: t.arg({ type: GenerateCertificateInputRef, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const userId = await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;
      return CertificateGenerationService.generateCertificate(userId, args.input, tErrors, ctx.locale);
    },
  })
);

// Mutation: revokeCertificate
gqlSchemaBuilder.mutationField("revokeCertificate", t =>
  t.field({
    type: CertificatePothosObject,
    nullable: false,
    authScopes: { permission: AppPermission.CERTIFICATES_REVOKE, notImpersonating: true },
    args: {
      id: t.arg.string({ required: true }),
      reason: t.arg.string({ required: false }),
      expectedVersion: t.arg.int({ required: false }),
    },
    resolve: async (_root, args, ctx) => {
      const userId = await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;
      return CertificateService.revokeCertificate(userId, args.id, args.reason ?? undefined, args.expectedVersion ?? undefined, tErrors);
    },
  })
);
```

**Key patterns**:
- `generateCertificate` passes `ctx.locale` to service for localized PDF rendering — mirrors analysis §D.2 service signature.
- `revokeCertificate` mirrors `rejectPaymentProof` pattern (`billing-management.pothos.ts:230-249`) — accepts `reason` (nullable) and `expectedVersion` (nullable).
- _Requirements_: R17, R18

### 6.3 `certificate-recipient-group.mutation.ts` — Recipient Group CRUD

```typescript
// backend/graphql/mutation/certificates/certificate-recipient-group.mutation.ts
import { AppPermission } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import {
  CertificateRecipientGroupPothosObject,
  CreateRecipientGroupInputRef,
  UpdateRecipientGroupInputRef,
  DeleteRecipientGroupResultPothosObject,
} from "@/backend/graphql/pothos/certificates";
import { RecipientGroupService } from "@/backend/services";

// Mutation: createRecipientGroup
gqlSchemaBuilder.mutationField("createRecipientGroup", t =>
  t.field({
    type: CertificateRecipientGroupPothosObject,
    nullable: false,
    authScopes: { permission: AppPermission.CERTIFICATES_MANAGE, notImpersonating: true },
    args: {
      input: t.arg({ type: CreateRecipientGroupInputRef, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const userId = await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;
      return RecipientGroupService.createRecipientGroup(userId, args.input, tErrors);
    },
  })
);

// Mutation: updateRecipientGroup
gqlSchemaBuilder.mutationField("updateRecipientGroup", t =>
  t.field({
    type: CertificateRecipientGroupPothosObject,
    nullable: false,
    authScopes: { permission: AppPermission.CERTIFICATES_MANAGE, notImpersonating: true },
    args: {
      input: t.arg({ type: UpdateRecipientGroupInputRef, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const userId = await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;
      return RecipientGroupService.updateRecipientGroup(userId, args.input, tErrors);
    },
  })
);

// Mutation: deleteRecipientGroup
gqlSchemaBuilder.mutationField("deleteRecipientGroup", t =>
  t.field({
    type: DeleteRecipientGroupResultPothosObject,
    nullable: false,
    authScopes: { permission: AppPermission.CERTIFICATES_MANAGE, notImpersonating: true },
    args: {
      id: t.arg.string({ required: true }),
      expectedVersion: t.arg.int({ required: false }),
    },
    resolve: async (_root, args, ctx) => {
      const userId = await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;
      return RecipientGroupService.deleteRecipientGroup(userId, args.id, args.expectedVersion ?? undefined, tErrors);
    },
  })
);
```

**Key patterns**:
- All recipient group mutations use `authScopes: { permission: AppPermission.CERTIFICATES_MANAGE, notImpersonating: true }`.
- `deleteRecipientGroup` mirrors `deleteInvoice` from `billing-management.pothos.ts:289-305` — returns a flattened result object.
- _Requirements_: R19, R20, R21

---

## 7. Barrel Registration

### 7.1 Pothos Barrel (`backend/graphql/pothos/certificates/index.ts`)

```typescript
// backend/graphql/pothos/certificates/index.ts
export * from "./certificate.pothos";
export * from "./certificate-template.pothos";
export * from "./certificate-verification.pothos";
export * from "./certificate-recipient-group.pothos";
```

### 7.2 Query Barrel (`backend/graphql/query/certificates/index.ts`)

```typescript
// backend/graphql/query/certificates/index.ts
import "./certificate.query";
import "./certificate-template.query";
import "./certificate-meta.query";
```

### 7.3 Mutation Barrel (`backend/graphql/mutation/certificates/index.ts`)

```typescript
// backend/graphql/mutation/certificates/index.ts
import "./certificate-template.mutation";
import "./certificate.mutation";
import "./certificate-recipient-group.mutation";
```

### 7.4 Barrel Edits (Existing Files)

**`backend/graphql/pothos/index.ts`** — add after `export * from "@/backend/graphql/pothos/books";`:

```typescript
export * from "@/backend/graphql/pothos/certificates";
```

**`backend/graphql/query/index.ts`** — add after `import "./classes";`:

```typescript
import "./certificates";
```

**`backend/graphql/mutation/index.ts`** — add after `import "./classes";`:

```typescript
import "./certificates";
```

- _Requirements_: R25

---

## 8. Pattern Compliance Matrix

| Pattern | Requirement | Implementation | Reference |
|---|---|---|---|
| Code-first Pothos schema | C1 | All types/fields via `gqlSchemaBuilder.*` methods | Analysis §C |
| `loadableObjectRef` for single entity | R1, R3, C9 | `Certificate`, `CertificateTemplate` use `loadableObjectRef` with `loadByIds` batch | `student.pothos.ts:21-69` |
| `objectRef` for non-loaded types | R3, R4, R5 | Element, Variable, VerificationResult, RecipientGroup use `objectRef` | `billing-management.pothos.ts:69-90` |
| `inputRef` using centralized types | R24, C2 | All input types use `inputRef<SubmitInput>` from `@/backend/types` | `student.pothos.ts:71-99` |
| `authScopes.permission` callback | C3 | Mutations use `authScopes: { permission, notImpersonating: true }` | `billing-management.pothos.ts:146` |
| `authScopes: { loggedIn: true }` for queries | C3 | All non-public queries use `loggedIn` scope | `billing-management.pothos.ts:276` |
| Public query (no authScopes) | R10, C3 | `verifyCertificate` has no `authScopes` | Analysis §D.4 |
| `requireAuth(ctx)` on all non-public resolvers | C4 | Every resolver except `verifyCertificate` calls `requireAuth` | `requireAuth.ts:1-9` |
| `ctx.t().errorsTranslations` for i18n | C5 | All resolvers extract `tErrors` from context | `billing-management.pothos.ts:162` |
| `id` field on every object type | C6 | Every `implement()` exposes `id: t.exposeString("id", { nullable: false })` | `student.pothos.ts:28` |
| DataLoader batch for list-typed fields | R22, C9 | `elements` and `variables` use `t.field()` with `Map<string, T[]>` batch | Analysis §C.7, §E.3 |
| Enum registration once | R23, C10 | 8 enums in `shared/enum.pothos.ts` using `enumType(Enum, { name })` | `enum.pothos.ts:49-253` |
| No business logic in resolvers | C7 | Resolvers only auth + extract args + delegate to service | `backend/graphql/AGENTS.md` |
| No repository calls in resolvers | C8 | Resolvers call services, not repositories (except DataLoader `load` functions) | `backend/graphql/AGENTS.md` |
| No `GraphQLError` from services | C11 | Services throw `DomainError`/`NotFoundError`/`Error(tErrors.*)` | Analysis §E.8 |
| `PageInfoObject` reuse | R2 | Import from `@/backend/graphql/pothos/shared/pagination.objects` | `pagination.objects.ts:6-19` |
| `PaginationArgsObject` reuse | R6, R8 | Import from `@/backend/graphql/pothos/shared/pagination.objects` | `pagination.objects.ts:25-35` |

---

## 9. UX/Navigation Specification

### 9.1 API-Only Plan — Minimal Navigation

This plan is **API-only** — it defines GraphQL types, queries, and mutations without frontend views, routes, or Apollo documents. Navigation concerns are minimal:

| Concern | This Plan | Future Plan |
|---|---|---|
| Certificate management pages | Not included | Plan 07+ (Frontend Views) |
| Public verification page | Not included | Plan 07+ (Frontend Views) |
| GraphQL documents (frontend) | Not included | Plan 07+ (Frontend GraphQL) |
| Apollo hooks | Not included | Plan 07+ (Frontend) |
| Menu items / navigation links | Not included | Plan 07+ (Frontend) |

### 9.2 Verification Page Route (Future)

The public certificate verification page will be served at route `/{locale}/verify/{verificationCode}` (or `/verify?code={verificationCode}`). This plan exposes the `verifyCertificate` GraphQL query that the future verification page will consume. No route is created in this plan.

### 9.3 Certificate Management Navigation (Future)

The certificate management dashboard will be accessible at route `/{locale}/dashboard/certificates`. This plan exposes the `certificates`, `certificateTemplates`, `createCertificateTemplate`, `generateCertificate`, and `revokeCertificate` operations that the future dashboard will consume. No route or menu item is created in this plan.

---

## 10. GraphQL Code Generation

### 10.1 Steps (Mandatory After All Schema Changes)

After all Pothos object types, input types, enum registrations, query fields, mutation fields, and barrel registrations are complete:

```bash
# Step 1: Generate GraphQL SDL from Pothos schema
bun run generate:gqlSchema

# Step 2: Generate TypeScript types from SDL
bun codegen
```

### 10.2 Verification

After code generation completes:

1. **Verify SDL output**: Check that the generated schema file includes all certificate types:
   - Object types: `Certificate`, `CertificatesWithFiltersResponse`, `CertificateTemplate`, `CertificateTemplateElement`, `CertificateTemplateVariable`, `CertificateVerificationResult`, `CertificateRecipientGroup`, `DeleteRecipientGroupResult`, `CertificateCategory`
   - Input types: `CertificateFilterArgs`, `CreateCertificateTemplateInput`, `UpdateCertificateTemplateInput`, `GenerateCertificateInput`, `CreateRecipientGroupInput`, `UpdateRecipientGroupInput`, `CertificatesOrderByClause`, `CertificatesTemplatesOrderByClause`, `PaginationArgs`
   - Enums: `CertificateStatus`, `CertificateResolution`, `CertificateVerificationStatus`, `TemplateStatus`, `TemplateElementType`, `TemplateVariableType`, `CertificateOrientation`, `CertificatesOrderByColumn`
   - Queries: `certificates`, `certificate`, `certificateTemplates`, `certificateTemplate`, `verifyCertificate`, `certificateCategories`, `certificateRecipientGroups`
   - Mutations: `createCertificateTemplate`, `updateCertificateTemplate`, `publishCertificateTemplate`, `archiveCertificateTemplate`, `generateCertificate`, `revokeCertificate`, `createRecipientGroup`, `updateRecipientGroup`, `deleteRecipientGroup`

2. **Verify codegen output**: Check that `frontend/common/graphql/generated/` includes TypeScript types for all the above.

3. **If codegen fails**: Fix the Pothos definition causing the error, then re-run both commands.

### 10.3 Common Codegen Errors

| Error | Cause | Fix |
|---|---|---|
| `"X" has already been declared` | Enum registered twice | Remove duplicate registration; register only in `shared/enum.pothos.ts` |
| `Cannot find name "CertificatePothosObject"` | Missing barrel export | Add `export * from "./certificate.pothos"` to `pothos/certificates/index.ts` |
| `Cannot find module "@/backend/graphql/pothos/certificates"` | Missing `pothos/index.ts` barrel entry | Add `export * from "@/backend/graphql/pothos/certificates";` to `pothos/index.ts` |
| Type mismatch on input field | Input type doesn't match `SubmitInput` from `backend/types` | Verify field names, types, and required/nullable alignment |

- _Requirements_: R26

---

## 11. Outcome & Knowledge Transfer Protocol

### 11.1 Outcome Directory

All outcome documents are written to:
```
.ai/draft_plans/cert/plans/05-graphql-api/outcome/
```

### 11.2 Outcome Document Template

Each task completion produces an outcome document at `outcome/<task-id>-outcome.md` with the following structure:

```markdown
# Outcome: <Task ID> — <Task Title>

## Files Created/Modified
- `<file-path>` — <description>

## Pothos Patterns Applied
- <pattern name>: <how applied>

## Auth Scope Decisions
- <operation>: <authScopes configuration>

## DataLoader Batch Method Signatures
- <method signature>: <return type>

## Enum Registration Details
- <enum name>: <export name>, <values>

## Errors Encountered and Resolutions
- <error description> → <fix>

## Carry-Over Notes for Subsequent Plans
- <note>: <how this affects Plan 06/07+>
```

### 11.3 Knowledge Transfer to Subsequent Plans

| Subsequent Plan | Knowledge Needed | How This Plan Provides It |
|---|---|---|
| Plan 06 (PDF Rendering) | Certificate object fields, `generateCertificate` mutation signature | Pothos object type definitions + mutation resolver |
| Plan 07+ (Frontend Views) | GraphQL operations, input types, enum types | Generated SDL + codegen types from §10 |
| Plan 10 (GraphQL Integration Tests) | Query/mutation operation names, expected shapes, auth scopes | This design document + generated schema |
| Plan 08 (i18n) | Error translation keys used in resolvers (`ctx.t().errorsTranslations`) | `cert.*` error keys referenced in resolvers |

### 11.4 Final Outcome Summary

After all tasks complete, a final outcome summary is written at `outcome/00-final-summary.md` listing:
- All certificate GraphQL operations added (7 queries, 9 mutations)
- All object types created (Certificate, CertificateTemplate, CertificateTemplateElement, CertificateTemplateVariable, CertificateVerificationResult, CertificateRecipientGroup, DeleteRecipientGroupResult, CertificateCategory)
- All input types created
- All enums registered
- All barrel registrations completed
- Codegen verification result

---

## 12. Dependency Summary

### Dependencies (Required Before This Plan)

| Dependency | What It Provides | Plan |
|---|---|---|
| `CertificateReturnType`, `CertificateTemplateReturnType`, `CertificateVerificationResultReturnType`, all `SubmitInput` types | Centralized TypeScript types | Plan 02 |
| `AppPermission.CERTIFICATES_*` | Permission enum values | Plan 02 |
| All certificate enums (TS) | Enum definitions in `backend/enum/certificates/` | Plan 02 |
| `CertificateRepository.loadByIds`, `CertificateTemplateRepository.loadByIds` | Batch load methods for DataLoader | Plan 03 |
| `CertificateService.*`, `CertificateTemplateService.*`, `CertificateGenerationService.*`, `CertificateVerificationService.*`, `RecipientGroupService.*` | Service layer methods | Plan 04 |
| Batch service methods (`resolveElementsForTemplateIds`, `resolveVariablesForTemplateIds`, `getRecipientCounts`) | DataLoader batch resolvers | Plan 04 |

### Dependents (Plans That Depend on This Plan)

| Dependent | What It Needs | Plan |
|---|---|---|
| Frontend GraphQL documents | Generated SDL + codegen types | Plan 07+ |
| Frontend Apollo hooks | Generated hook types from codegen | Plan 07+ |
| GraphQL integration tests | Operation names, auth scopes, input shapes | Plan 10 |
| PDF rendering frontend | `generateCertificate` mutation, `Certificate` type | Plan 06/07+ |
import { Certificate