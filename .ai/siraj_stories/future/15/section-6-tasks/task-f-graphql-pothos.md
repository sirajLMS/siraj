### Task F — GraphQL Pothos: Suggestion Management Extensions & Complaint File Attachments

---

#### Objective

Extend the existing complaint and suggestion Pothos GraphQL objects with new fields, queries, and mutations for suggestion management (parent history, admin response, duplicate marking, soft-delete, duplicate search autocomplete) and complaint file attachments. Add new shared type definitions to the communications types file. Wire all new resolvers to the service layer (`ComplaintService` and `SuggestionService`). Run schema generation and codegen after all changes.

---

#### Dependencies

- **Task E1** — SuggestionService extensions: `getParentSuggestions()`, `respondToSuggestion()`, `markAsDuplicate()`, `deleteSuggestion()` must be complete.
- **Task E2** — ComplaintService extensions: `getComplaintFiles()`, extended `submitComplaint()` with `files` parameter must be complete.
- **Task E3** — CommunicationService `dispatchMulti()` must be complete (used by E1 service methods).
- **Sprint 14 Task E** — Existing complaint and suggestion Pothos objects, queries, and mutations must already exist in `backend/graphql/pothos/complaint.pothos.ts` and `backend/graphql/pothos/suggestion.pothos.ts`.

---

#### Layer-Specific Rules

- **Framework**: Pothos code-first GraphQL schema builder.
- **Nullability**: Fields are non-nullable by default unless explicitly set to `nullable: true`. Ensure TypeScript types align with Pothos definitions.
- **Resolvers**: Pothos field resolvers delegate to the `backend/services/` layer. NO business logic inside GraphQL definitions.
- **Cache Updates**: Ensure `id` fields are always exposed on GraphQL objects so the Apollo client can auto-update its cache.
- **Locale Propagation & Localized Errors**: GraphQL field resolvers must propagate the request locale (`ctx.locale`) to service calls. Any direct error thrown in resolvers must also be translated using `getBackendTranslations`.
- **🚫 NO DB/Repo Imports**: Resolvers can ONLY depend on `backend/services/`. Importing from `backend/db/repo/`, `backend/db/schema`, or `drizzle-orm` is **strictly forbidden**.
- **🚫 NO Local Type Definitions**: NEVER define local types like `SuggestionWithStatusShape`, `ComplaintFileShape`, etc. in Pothos files or in a generic `communications.types.ts` file.
- **Import canonical types**: All types MUST be imported from their respective canonical type files:
  - `backend/types/suggestions.types.ts` for suggestion-related types
  - `backend/types/complaints.types.ts` for complaint-related types
- **Single GraphQL object per entity**: Create ONE GraphQL object type per entity using `{Entity}ReturnType` from canonical types.

---

#### Target Files

| # | File | Status |
|---|------|--------|
| 1 | `backend/types/suggestions.types.ts` | CREATE or UPDATE — define canonical types for suggestions table (if not already done in Task B1) |
| 2 | `backend/types/complaints.types.ts` | UPDATE — add complaint file types to existing canonical types |
| 3 | `backend/graphql/pothos/suggestion.pothos.ts` | MODIFY — extend Suggestion object, add new objects, queries, mutations, import canonical types |
| 4 | `backend/graphql/pothos/complaint.pothos.ts` | MODIFY — add ComplaintFile object, extend existing objects, add query, extend mutation input, import canonical types |

---

#### Detailed Implementation Steps

---

##### Step 1 — Verify or Create Canonical Types Files

**CRITICAL**: This step ensures canonical types exist in their proper files. If Task B1 already created `backend/types/suggestions.types.ts`, verify it contains all needed types. If not, create or update it now.

**1a. Verify or create `backend/types/suggestions.types.ts`:**

This file should already exist from Task B1. Verify it contains these types (add if missing):

```typescript
import type { suggestions } from "@/backend/db/schema";
import type { SuggestionStatus } from "@/shared/lib/enum";

export type SuggestionSelectType = typeof suggestions.$inferSelect;
export type SuggestionInsertType = typeof suggestions.$inferInsert;

export type SuggestionReturnType = Omit<SuggestionSelectType, 
  | "deletedAt"
> & {
  status: SuggestionStatus;
  parentName?: string | null;
  reviewedByUserName?: string | null;
  duplicateOfBody?: string | null;
  duplicateOfSubmitterName?: string | null;
  responseCount?: number | null;
};

export type SuggestionSubmitInput = Omit<
  SuggestionInsertType,
  | "status"
  | "createdAt"
  | "updatedAt"
  | "deletedAt"
  | "reviewedAt"
  | "reviewedByUserId"
  | "duplicateOfId"
  | "parentId"
>;

export type SuggestionQueueFilter = {
  search?: string | null;
  status?: SuggestionStatus | null;
  limit: number;
  offset: number;
};

export type SuggestionMetrics = {
  id: string;
  pending: number;
  reviewed: number;
  duplicate: number;
  totalCount: number;
};

export type SuggestionQueueResult = {
  id: string;
  suggestions: ReadonlyArray<SuggestionReturnType>;
  metrics: SuggestionMetrics;
};

// Additional types for Sprint 15 features
export type DuplicateSuggestionInput = {
  readonly suggestionId: string;
  readonly duplicateOfId: string;
};

export type RespondToSuggestionInput = {
  readonly suggestionId: string;
  readonly adminResponse: string;
};

export type ParentSuggestionOptions = {
  readonly limit: number;
  readonly offset: number;
};
```

**1b. Update `backend/types/complaints.types.ts`:**

Add complaint file types to the existing canonical complaints types file:

```typescript
// Add to existing backend/types/complaints.types.ts

export type ComplaintFileReturnType = {
  readonly fileId: string;
  readonly filePath: string;
  readonly isProtected: boolean;
  readonly usageType: string;
  readonly createdAt: Date;
};

export type SubmitComplaintWithFilesInput = Omit<
  ComplaintSubmitInput,
  never
> & {
  readonly filePaths: ReadonlyArray<string>;
};
```

**Key points:**
- **NO generic `communications.types.ts`** — each table gets its own canonical file
- **NO "Shape" suffix** — use proper naming: `{Entity}ReturnType`, `{Entity}Input`
- **Single source of truth** — all suggestion types in `suggestions.types.ts`, all complaint types in `complaints.types.ts`
- **Import from schema** — use Drizzle's `$inferSelect` and `$inferInsert` as foundation
- **Extend with resolved properties** — add joined fields like `parentName`, `reviewedByUserName` to return types

**Verification:**
```bash
bun tsgo backend/types/suggestions.types.ts backend/types/complaints.types.ts
```

---

##### Step 2 — Extend `backend/graphql/pothos/suggestion.pothos.ts`

Open the existing `backend/graphql/pothos/suggestion.pothos.ts` file. This file was created in Sprint 14 and contains the base `Suggestion`, `SuggestionMetrics`, `AdminSuggestionResult` objects, `SubmitSuggestionInput`, `SuggestionFilter` inputs, the `adminSuggestions` query, and `submitSuggestion`, `markSuggestionReviewed` mutations.

The following changes extend the file with Sprint 15 features.

**2a. Add new imports at the top of the file:**

Add the `SuggestionStatus` enum import and the `getBackendTranslations` import alongside the existing imports:

```typescript
import { SuggestionService } from "@/backend/services/communication/suggestion.service";
import { getBackendTranslations } from "@/backend/lib/intl";
import { SuggestionStatus } from "@/shared/lib/enum";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";
```

**2b. Add `SuggestionStatus` Pothos enum after the existing imports:**

```typescript
export const SuggestionStatusPothosEnum = gqlSchemaBuilder.enumType(SuggestionStatus, {
  name: "SuggestionStatus",
  description: "Status of a suggestion in the review pipeline.",
});
```

**2c. Replace the existing `SuggestionDefinition` type and `SuggestionRef` implementation:**

The existing `SuggestionDefinition` and `SuggestionPothosObject` from Sprint 14 must be replaced with the extended version that includes the new Sprint 15 columns:

```typescript
export type SuggestionDefinition = {
  id: string;
  parentId: string;
  submitterName: string;
  body: string;
  status: SuggestionStatus;
  duplicateOfId: string | null;
  adminResponse: string | null;
  reviewedByUserId: string | null;
  reviewedAt: Date | null;
  emailSentAt: Date | null;
  createdAt: Date;
  parentName: string;
};

const SuggestionRef = gqlSchemaBuilder.objectRef<SuggestionDefinition>("Suggestion");

export const SuggestionPothosObject = SuggestionRef.implement({
  description: "A parent suggestion with full details including review and duplicate status.",
  fields: t => ({
    id: t.exposeString("id"),
    parentId: t.exposeString("parentId"),
    submitterName: t.exposeString("submitterName"),
    body: t.exposeString("body"),
    status: t.expose("status", { type: SuggestionStatusPothosEnum }),
    duplicateOfId: t.exposeString("duplicateOfId", { nullable: true }),
    duplicateOf: t.field({
      type: SuggestionRef,
      nullable: true,
      description: "The suggestion this one is marked as a duplicate of.",
      resolve: async (parent, _args, ctx) => {
        if (!parent.duplicateOfId) return null;
        if (!ctx.user?.id) throw new Error("unauthenticated");
        const result = await SuggestionService.getAdminSuggestions(
          ctx.user.id,
          { limit: 1, offset: 0 },
          ctx.locale
        );
        const found = result.suggestions.find(s => s.id === parent.duplicateOfId);
        if (!found) return null;
        return {
          id: found.id,
          parentId: found.parentId,
          submitterName: found.submitterName,
          body: found.body,
          status: found.status as SuggestionStatus,
          duplicateOfId: (found as Record<string, unknown>).duplicateOfId as string | null ?? null,
          adminResponse: (found as Record<string, unknown>).adminResponse as string | null ?? null,
          reviewedByUserId: (found as Record<string, unknown>).reviewedByUserId as string | null ?? null,
          reviewedAt: (found as Record<string, unknown>).reviewedAt as Date | null ?? null,
          emailSentAt: found.emailSentAt ?? null,
          createdAt: found.createdAt,
          parentName: "",
        };
      },
    }),
    adminResponse: t.exposeString("adminResponse", { nullable: true }),
    reviewedByUserId: t.exposeString("reviewedByUserId", { nullable: true }),
    reviewedByName: t.exposeString("reviewedByName", {
      nullable: true,
      description: "Display name of the admin who reviewed the suggestion.",
    }),
    reviewedAt: t.expose("reviewedAt", { type: "DateTime", nullable: true }),
    emailSentAt: t.expose("emailSentAt", { type: "DateTime", nullable: true }),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    parentName: t.exposeString("parentName"),
  }),
});
```

**2d. Add new `SuggestionSearchResult` object after the `SuggestionPothosObject`:**

```typescript
export type SuggestionSearchResultDefinition = {
  id: string;
  parentId: string;
  submitterName: string;
  body: string;
  status: SuggestionStatus;
  createdAt: Date;
  parentName: string;
};

const SuggestionSearchResultRef =
  gqlSchemaBuilder.objectRef<SuggestionSearchResultDefinition>("SuggestionSearchResult");

export const SuggestionSearchResultPothosObject = SuggestionSearchResultRef.implement({
  description: "A lightweight suggestion result for duplicate search autocomplete.",
  fields: t => ({
    id: t.exposeString("id"),
    parentId: t.exposeString("parentId"),
    submitterName: t.exposeString("submitterName"),
    body: t.exposeString("body"),
    status: t.expose("status", { type: SuggestionStatusPothosEnum }),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    parentName: t.exposeString("parentName"),
  }),
});
```

**2e. Add new input types after the existing `SuggestionFilterPothosObject`:**

```typescript
export type RespondToSuggestionInputDefinition = {
  suggestionId: string;
  adminResponse: string;
};

export const RespondToSuggestionInputPothosObject = gqlSchemaBuilder
  .inputRef<RespondToSuggestionInputDefinition>("RespondToSuggestionInput")
  .implement({
    description: "Input for responding to a suggestion with an admin response.",
    fields: t => ({
      suggestionId: t.string({ required: true }),
      adminResponse: t.string({ required: true }),
    }),
  });

export type MarkSuggestionDuplicateInputDefinition = {
  suggestionId: string;
  duplicateOfId: string;
};

export const MarkSuggestionDuplicateInputPothosObject = gqlSchemaBuilder
  .inputRef<MarkSuggestionDuplicateInputDefinition>("MarkSuggestionDuplicateInput")
  .implement({
    description: "Input for marking a suggestion as a duplicate of another suggestion.",
    fields: t => ({
      suggestionId: t.string({ required: true }),
      duplicateOfId: t.string({ required: true }),
    }),
  });

export type ParentSuggestionOptionsDefinition = {
  limit: number;
  offset: number;
};

export const ParentSuggestionOptionsPothosObject = gqlSchemaBuilder
  .inputRef<ParentSuggestionOptionsDefinition>("ParentSuggestionOptions")
  .implement({
    description: "Pagination options for the parent suggestions history query.",
    fields: t => ({
      limit: t.int({ required: true }),
      offset: t.int({ required: true }),
    }),
  });
```

**2f. Add new query fields after the existing `adminSuggestions` query:**

```typescript
gqlSchemaBuilder.queryField("parentSuggestions", t =>
  t.field({
    type: [SuggestionPothosObject],
    description: "Returns the authenticated parent's suggestion history with review status.",
    args: {
      options: t.arg({ type: ParentSuggestionOptionsPothosObject, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user?.id) {
        throw new Error("unauthenticated");
      }

      const result = await SuggestionService.getParentSuggestions(
        ctx.user.id,
        { limit: args.options.limit, offset: args.options.offset },
        ctx.locale
      );

      return result.suggestions.map(s => ({
        id: s.id,
        parentId: s.parentId,
        submitterName: s.submitterName,
        body: s.body,
        status: s.status as SuggestionStatus,
        duplicateOfId: (s as Record<string, unknown>).duplicateOfId as string | null ?? null,
        adminResponse: (s as Record<string, unknown>).adminResponse as string | null ?? null,
        reviewedByUserId: (s as Record<string, unknown>).reviewedByUserId as string | null ?? null,
        reviewedAt: (s as Record<string, unknown>).reviewedAt as Date | null ?? null,
        emailSentAt: s.emailSentAt ?? null,
        createdAt: s.createdAt,
        parentName: "",
      }));
    },
  })
);

gqlSchemaBuilder.queryField("searchSuggestions", t =>
  t.field({
    type: [SuggestionSearchResultPothosObject],
    description: "Search suggestions for duplicate marking autocomplete. Requires suggestions.review permission.",
    args: {
      query: t.arg.string({ required: true }),
      excludeId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user?.id) {
        throw new Error("unauthenticated");
      }

      const results = await SuggestionService.searchSuggestions(
        ctx.user.id,
        args.query,
        args.excludeId,
        ctx.locale
      );

      return results.map(r => ({
        id: r.id,
        parentId: "",
        submitterName: r.submitterName,
        body: r.body,
        status: r.status as SuggestionStatus,
        createdAt: r.createdAt,
        parentName: "",
      }));
    },
  })
);
```

**2g. Add new mutation fields after the existing `markSuggestionReviewed` mutation:**

```typescript
gqlSchemaBuilder.mutationField("respondToSuggestion", t =>
  t.field({
    type: SuggestionPothosObject,
    description: "Responds to a suggestion with an admin text response (admin only).",
    args: {
      input: t.arg({ type: RespondToSuggestionInputPothosObject, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user?.id) {
        throw new Error("unauthenticated");
      }

      const result = await SuggestionService.respondToSuggestion(
        ctx.user.id,
        args.input.suggestionId,
        args.input.adminResponse,
        ctx.locale
      );

      return {
        id: result.id,
        parentId: result.parentId,
        submitterName: result.submitterName,
        body: result.body,
        status: result.status as SuggestionStatus,
        duplicateOfId: (result as Record<string, unknown>).duplicateOfId as string | null ?? null,
        adminResponse: result.adminResponse ?? args.input.adminResponse,
        reviewedByUserId: (result as Record<string, unknown>).reviewedByUserId as string | null ?? ctx.user.id,
        reviewedAt: (result as Record<string, unknown>).reviewedAt as Date | null ?? new Date(),
        emailSentAt: result.emailSentAt ?? null,
        createdAt: result.createdAt,
        parentName: "",
      };
    },
  })
);

gqlSchemaBuilder.mutationField("markSuggestionDuplicate", t =>
  t.field({
    type: SuggestionPothosObject,
    description: "Marks a suggestion as a duplicate of another suggestion (admin only).",
    args: {
      input: t.arg({ type: MarkSuggestionDuplicateInputPothosObject, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user?.id) {
        throw new Error("unauthenticated");
      }

      const result = await SuggestionService.markAsDuplicate(
        ctx.user.id,
        args.input.suggestionId,
        args.input.duplicateOfId,
        ctx.locale
      );

      return {
        id: result.id,
        parentId: (result as Record<string, unknown>).parentId as string ?? "",
        submitterName: (result as Record<string, unknown>).submitterName as string ?? "",
        body: (result as Record<string, unknown>).body as string ?? "",
        status: result.status as SuggestionStatus,
        duplicateOfId: (result as Record<string, unknown>).duplicateOfId as string | null ?? args.input.duplicateOfId,
        adminResponse: (result as Record<string, unknown>).adminResponse as string | null ?? null,
        reviewedByUserId: (result as Record<string, unknown>).reviewedByUserId as string | null ?? ctx.user.id,
        reviewedAt: (result as Record<string, unknown>).reviewedAt as Date | null ?? new Date(),
        emailSentAt: (result as Record<string, unknown>).emailSentAt as Date | null ?? null,
        createdAt: (result as Record<string, unknown>).createdAt as Date ?? new Date(),
        parentName: "",
      };
    },
  })
);

gqlSchemaBuilder.mutationField("deleteSuggestion", t =>
  t.field({
    type: "Boolean",
    description: "Soft-deletes a suggestion (super admin only). Returns true on success.",
    args: {
      suggestionId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user?.id) {
        throw new Error("unauthenticated");
      }

      await SuggestionService.deleteSuggestion(
        ctx.user.id,
        args.suggestionId,
        ctx.locale
      );

      return true;
    },
  })
);
```

**2h. Update existing `submitSuggestion` mutation resolver:**

The existing `submitSuggestion` mutation resolver's return mapping must be updated to include the new fields. Replace the existing return block:

```typescript
// BEFORE (Sprint 14):
return {
  id: created.id,
  parentId: created.parentId,
  submitterName: created.submitterName,
  body: created.body,
  emailSentAt: created.emailSentAt ?? null,
  createdAt: created.createdAt,
  parentName: "",
};

// AFTER (Sprint 15):
return {
  id: created.id,
  parentId: created.parentId,
  submitterName: created.submitterName,
  body: created.body,
  status: (created as Record<string, unknown>).status as SuggestionStatus ?? SuggestionStatus.PENDING,
  duplicateOfId: null,
  adminResponse: null,
  reviewedByUserId: null,
  reviewedAt: null,
  emailSentAt: created.emailSentAt ?? null,
  createdAt: created.createdAt,
  parentName: "",
};
```

**2i. Update existing `markSuggestionReviewed` mutation resolver:**

Replace the existing return block to include new fields:

```typescript
// BEFORE (Sprint 14):
return {
  id: updated.id,
  parentId: updated.parentId,
  submitterName: updated.submitterName,
  body: updated.body,
  emailSentAt: updated.emailSentAt ?? null,
  createdAt: updated.createdAt,
  parentName: "",
};

// AFTER (Sprint 15):
return {
  id: updated.id,
  parentId: updated.parentId,
  submitterName: updated.submitterName,
  body: updated.body,
  status: updated.status as SuggestionStatus,
  duplicateOfId: (updated as Record<string, unknown>).duplicateOfId as string | null ?? null,
  adminResponse: (updated as Record<string, unknown>).adminResponse as string | null ?? null,
  reviewedByUserId: (updated as Record<string, unknown>).reviewedByUserId as string | null ?? ctx.user.id,
  reviewedAt: (updated as Record<string, unknown>).reviewedAt as Date | null ?? new Date(),
  emailSentAt: updated.emailSentAt ?? null,
  createdAt: updated.createdAt,
  parentName: "",
};
```

**2j. Update existing `adminSuggestions` query resolver:**

Update the row mapping inside the `adminSuggestions` resolver to include new fields:

```typescript
// BEFORE (Sprint 14):
rows: result.suggestions.map(s => ({
  id: s.id,
  parentId: s.parentId,
  submitterName: s.submitterName,
  body: s.body,
  emailSentAt: s.emailSentAt ?? null,
  createdAt: s.createdAt,
  parentName: "",
})),

// AFTER (Sprint 15):
rows: result.suggestions.map(s => ({
  id: s.id,
  parentId: s.parentId,
  submitterName: s.submitterName,
  body: s.body,
  status: s.status as SuggestionStatus,
  duplicateOfId: (s as Record<string, unknown>).duplicateOfId as string | null ?? null,
  adminResponse: (s as Record<string, unknown>).adminResponse as string | null ?? null,
  reviewedByUserId: (s as Record<string, unknown>).reviewedByUserId as string | null ?? null,
  reviewedAt: (s as Record<string, unknown>).reviewedAt as Date | null ?? null,
  emailSentAt: s.emailSentAt ?? null,
  createdAt: s.createdAt,
  parentName: "",
})),
```

**Key points for suggestion changes:**
- `SuggestionStatus` Pothos enum registered via `gqlSchemaBuilder.enumType()` using the existing enum from `shared/lib/enum.ts`.
- `SuggestionDefinition` extended with 5 new fields: `status`, `duplicateOfId`, `adminResponse`, `reviewedByUserId`, `reviewedAt`.
- `SuggestionPothosObject` extended with new exposed fields plus a `duplicateOf` self-referencing field and a `reviewedByName` virtual field.
- New `SuggestionSearchResult` object for duplicate search autocomplete with `id`, `parentId`, `submitterName`, `body`, `status`, `createdAt`, `parentName`.
- Three new input types: `RespondToSuggestionInput`, `MarkSuggestionDuplicateInput`, `ParentSuggestionOptions`.
- Two new query fields: `parentSuggestions` (parent-scoped), `searchSuggestions` (admin-scoped).
- Three new mutation fields: `respondToSuggestion`, `markSuggestionDuplicate`, `deleteSuggestion`.
- All existing resolvers updated to include new fields in their return mappings.
- All resolvers check `ctx.user?.id` for authentication and propagate `ctx.locale`.
- No DB/repo imports — all data access delegated to `SuggestionService`.

---

##### Step 3 — Extend `backend/graphql/pothos/complaint.pothos.ts`

Open the existing `backend/graphql/pothos/complaint.pothos.ts` file. This file was created in Sprint 14 and contains the base complaint-related objects, queries, and mutations.

**3a. Add new `ComplaintFile` object after the existing `ComplaintResponsePothosObject`:**

```typescript
export type ComplaintFileDefinition = {
  fileId: string;
  filePath: string;
  isProtected: boolean;
  usageType: string;
  createdAt: Date;
};

const ComplaintFileRef = gqlSchemaBuilder.objectRef<ComplaintFileDefinition>("ComplaintFile");

export const ComplaintFilePothosObject = ComplaintFileRef.implement({
  description: "A file attached to a complaint.",
  fields: t => ({
    fileId: t.exposeString("fileId"),
    filePath: t.exposeString("filePath"),
    isProtected: t.exposeBoolean("isProtected"),
    usageType: t.exposeString("usageType"),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
  }),
});
```

**3b. Extend `ParentComplaintRecordDefinition` and `ParentComplaintRecordPothosObject`:**

Add `files` to the existing type definition:

```typescript
// BEFORE (Sprint 14):
export type ParentComplaintRecordDefinition = {
  id: string;
  category: ComplaintCategory;
  body: string;
  status: ComplaintStatus;
  createdAt: Date;
  studentName: string | null;
  responses: ComplaintResponseDefinition[];
};

// AFTER (Sprint 15):
export type ParentComplaintRecordDefinition = {
  id: string;
  category: ComplaintCategory;
  body: string;
  status: ComplaintStatus;
  createdAt: Date;
  studentName: string | null;
  responses: ComplaintResponseDefinition[];
  files: ComplaintFileDefinition[];
};
```

Update the `ParentComplaintRecordPothosObject` implementation to expose the `files` field:

```typescript
export const ParentComplaintRecordPothosObject = ParentComplaintRecordRef.implement({
  description: "A parent-facing view of a single complaint record.",
  fields: t => ({
    id: t.exposeString("id"),
    category: t.expose("category", { type: ComplaintCategoryPothosEnum }),
    body: t.exposeString("body"),
    status: t.expose("status", { type: ComplaintStatusPothosEnum }),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    studentName: t.exposeString("studentName", { nullable: true }),
    responses: t.expose("responses", { type: [ComplaintResponsePothosObject] }),
    files: t.expose("files", { type: [ComplaintFilePothosObject] }),
  }),
});
```

**3c. Extend `ComplaintQueueRowDefinition` and `ComplaintQueueRowPothosObject`:**

Add `files` to the existing type definition:

```typescript
// BEFORE (Sprint 14):
export type ComplaintQueueRowDefinition = {
  id: string;
  parentId: string;
  studentId: string | null;
  category: ComplaintCategory;
  submitterEmail: string;
  body: string;
  status: ComplaintStatus;
  createdAt: Date;
  parentName: string;
  studentName: string | null;
  responseCount: number;
};

// AFTER (Sprint 15):
export type ComplaintQueueRowDefinition = {
  id: string;
  parentId: string;
  studentId: string | null;
  category: ComplaintCategory;
  submitterEmail: string;
  body: string;
  status: ComplaintStatus;
  createdAt: Date;
  parentName: string;
  studentName: string | null;
  responseCount: number;
  files: ComplaintFileDefinition[];
};
```

Update the `ComplaintQueueRowPothosObject` implementation:

```typescript
export const ComplaintQueueRowPothosObject = ComplaintQueueRowRef.implement({
  description: "A single row in the admin complaint queue.",
  fields: t => ({
    id: t.exposeString("id"),
    parentId: t.exposeString("parentId"),
    studentId: t.exposeString("studentId", { nullable: true }),
    category: t.expose("category", { type: ComplaintCategoryPothosEnum }),
    submitterEmail: t.exposeString("submitterEmail"),
    body: t.exposeString("body"),
    status: t.expose("status", { type: ComplaintStatusPothosEnum }),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    parentName: t.exposeString("parentName"),
    studentName: t.exposeString("studentName", { nullable: true }),
    responseCount: t.exposeInt("responseCount"),
    files: t.expose("files", { type: [ComplaintFilePothosObject] }),
  }),
});
```

**3d. Extend `SubmitComplaintInputDefinition` and `SubmitComplaintInputPothosObject`:**

Add `filePaths` to the existing input type:

```typescript
// BEFORE (Sprint 14):
export type SubmitComplaintInputDefinition = {
  studentId?: string | null;
  category: ComplaintCategory;
  submitterEmail: string;
  body: string;
};

// AFTER (Sprint 15):
export type SubmitComplaintInputDefinition = {
  studentId?: string | null;
  category: ComplaintCategory;
  submitterEmail: string;
  body: string;
  filePaths?: string[];
};
```

Update the `SubmitComplaintInputPothosObject` implementation:

```typescript
export const SubmitComplaintInputPothosObject = gqlSchemaBuilder
  .inputRef<SubmitComplaintInputDefinition>("SubmitComplaintInput")
  .implement({
    description: "Input for submitting a new complaint.",
    fields: t => ({
      studentId: t.string({ required: false }),
      category: t.field({ type: ComplaintCategoryPothosEnum, required: true }),
      submitterEmail: t.string({ required: true }),
      body: t.string({ required: true }),
      filePaths: t.stringList({ required: false }),
    }),
  });
```

**3e. Add new `complaintFiles` query field after the existing `adminComplaintQueue` query:**

```typescript
gqlSchemaBuilder.queryField("complaintFiles", t =>
  t.field({
    type: [ComplaintFilePothosObject],
    description: "Returns file attachments for a specific complaint. Accessible by the owning parent or admins.",
    args: {
      complaintId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user?.id) {
        throw new Error("unauthenticated");
      }

      const files = await ComplaintService.getComplaintFiles(
        ctx.user.id,
        args.complaintId,
        ctx.locale
      );

      return files.map(f => ({
        fileId: f.fileId,
        filePath: f.filePath,
        isProtected: f.isProtected,
        usageType: f.usageType,
        createdAt: f.createdAt,
      }));
    },
  })
);
```

**3f. Update existing `parentComplaints` query resolver:**

Add `files: []` to the existing complaint mapping in the `parentComplaints` resolver:

```typescript
// BEFORE (Sprint 14):
return complaints.map(c => ({
  id: c.id,
  category: c.category as ComplaintCategory,
  body: c.body,
  status: c.status as ComplaintStatus,
  createdAt: c.createdAt,
  studentName: null,
  responses: c.responses.map(r => ({
    id: r.id,
    complaintId: r.complaintId,
    responderUserId: r.responderUserId ?? null,
    body: r.body,
    emailSent: r.emailSent,
    createdAt: r.createdAt,
    responderName: null,
  })),
}));

// AFTER (Sprint 15):
return complaints.map(c => ({
  id: c.id,
  category: c.category as ComplaintCategory,
  body: c.body,
  status: c.status as ComplaintStatus,
  createdAt: c.createdAt,
  studentName: null,
  responses: c.responses.map(r => ({
    id: r.id,
    complaintId: r.complaintId,
    responderUserId: r.responderUserId ?? null,
    body: r.body,
    emailSent: r.emailSent,
    createdAt: r.createdAt,
    responderName: null,
  })),
  files: [],
}));
```

**3g. Update existing `adminComplaintQueue` query resolver:**

Add `files: []` to the existing row mapping in the `adminComplaintQueue` resolver:

```typescript
// BEFORE (Sprint 14):
rows: result.complaints.map(c => ({
  id: c.id,
  parentId: c.parentId,
  studentId: c.studentId ?? null,
  category: c.category as ComplaintCategory,
  submitterEmail: c.submitterEmail,
  body: c.body,
  status: c.status as ComplaintStatus,
  createdAt: c.createdAt,
  parentName: "",
  studentName: null,
  responseCount: 0,
})),

// AFTER (Sprint 15):
rows: result.complaints.map(c => ({
  id: c.id,
  parentId: c.parentId,
  studentId: c.studentId ?? null,
  category: c.category as ComplaintCategory,
  submitterEmail: c.submitterEmail,
  body: c.body,
  status: c.status as ComplaintStatus,
  createdAt: c.createdAt,
  parentName: "",
  studentName: null,
  responseCount: 0,
  files: [],
})),
```

**3h. Update existing `submitComplaint` mutation resolver:**

Pass `filePaths` from the input to the service call:

```typescript
// BEFORE (Sprint 14):
const created = await ComplaintService.submitComplaint(
  ctx.user.id,
  {
    studentId: args.input.studentId ?? null,
    category: args.input.category,
    submitterEmail: args.input.submitterEmail,
    body: args.input.body,
  },
  ctx.locale
);

// AFTER (Sprint 15):
const created = await ComplaintService.submitComplaint(
  ctx.user.id,
  {
    studentId: args.input.studentId ?? null,
    category: args.input.category,
    submitterEmail: args.input.submitterEmail,
    body: args.input.body,
    filePaths: args.input.filePaths ?? [],
  },
  ctx.locale
);
```

**Key points for complaint changes:**
- New `ComplaintFile` object type with fields: `fileId`, `filePath`, `isProtected`, `usageType`, `createdAt` — matches the actual `ComplaintFileRow` from `ComplaintRepository` (the `storageFiles` table has only `id`, `path`, `isProtected` columns).
- `ParentComplaintRecord` and `ComplaintQueueRow` both extended with `files: [ComplaintFile]`.
- `SubmitComplaintInput` extended with optional `filePaths: [String!]` for file attachment paths.
- New `complaintFiles` query field for fetching file attachments by complaint ID.
- Existing resolvers updated to include `files: []` default in their return mappings.
- `submitComplaint` mutation now passes `filePaths` to the service layer.
- All resolvers check `ctx.user?.id` and propagate `ctx.locale`.
- No DB/repo imports — all data access delegated to `ComplaintService`.

---

##### Step 4 — Run schema generation and codegen

After all files are modified, run the following commands to regenerate the GraphQL schema SDL and frontend TypeScript types:

```bash
bun run generate:gqlSchema
bun codegen
```

These commands:
1. `generate:gqlSchema` — Traverses all Pothos definitions and outputs the updated GraphQL SDL schema file.
2. `codegen` — Generates TypeScript types from the SDL schema for the frontend Apollo client.

Both commands must succeed with 0 errors. If `generate:gqlSchema` fails, check for:
- Missing imports in the Pothos files.
- Duplicate type names across Pothos modules.
- Invalid field type references (e.g., referencing an enum that doesn't exist).
- Self-referencing field resolver issues (the `duplicateOf` field on `Suggestion`).

If `codegen` fails, check for:
- Schema SDL syntax errors.
- Missing frontend GraphQL document files that reference the new types.

---

#### File Modification Order

Execute the steps in this exact order to satisfy incremental type-checking:

1. `backend/types/communications.types.ts` — Add shared types (no new internal dependencies)
2. `backend/graphql/pothos/suggestion.pothos.ts` — Extend Suggestion objects, add new objects, queries, mutations
3. `backend/graphql/pothos/complaint.pothos.ts` — Add ComplaintFile object, extend existing objects, add query, extend mutation input
4. Run `bun run generate:gqlSchema` and `bun codegen`

After creating/modifying each file, run the Quality Gate — Per-File Validation checklist before proceeding to the next file.

---

#### Test Execution Requirements

After completing all files and running schema generation, execute the following commands:

```bash
bun run generate:gqlSchema
```

Verifies that all Pothos definitions compose into a valid GraphQL schema.

```bash
bun codegen
```

Generates frontend TypeScript types from the updated schema.

```bash
bun run test:graphql
```

Runs all GraphQL integration tests to ensure no regressions in existing queries/mutations and that new operations are accessible.

---

#### Success Criteria

- [ ] `backend/types/communications.types.ts` includes all new shared type definitions: `SuggestionStatusValue`, `SuggestionWithStatusShape`, `SuggestionWithResponseShape`, `SuggestionSearchResultShape`, `DuplicateSuggestionInputShape`, `RespondToSuggestionInputShape`, `ParentSuggestionOptionsShape`, `ComplaintFileShape`, `SubmitComplaintWithFilesInputShape`
- [ ] `backend/graphql/pothos/suggestion.pothos.ts` defines `SuggestionStatus` Pothos enum with `PENDING`, `REVIEWED`, `DUPLICATE` values
- [ ] `SuggestionDefinition` and `SuggestionPothosObject` extended with 5 new fields: `status`, `duplicateOfId`, `adminResponse`, `reviewedByUserId`, `reviewedAt`
- [ ] `SuggestionPothosObject` includes `duplicateOf` self-referencing nullable field
- [ ] `SuggestionPothosObject` includes `reviewedByName` nullable string field
- [ ] New `SuggestionSearchResult` object defined with `id`, `parentId`, `submitterName`, `body`, `status`, `createdAt`, `parentName`
- [ ] New input types defined: `RespondToSuggestionInput`, `MarkSuggestionDuplicateInput`, `ParentSuggestionOptions`
- [ ] New query fields defined: `parentSuggestions`, `searchSuggestions`
- [ ] New mutation fields defined: `respondToSuggestion`, `markSuggestionDuplicate`, `deleteSuggestion`
- [ ] Existing `submitSuggestion` and `markSuggestionReviewed` mutation resolvers updated with new return fields
- [ ] Existing `adminSuggestions` query resolver updated with new row fields
- [ ] `backend/graphql/pothos/complaint.pothos.ts` defines new `ComplaintFile` object with `fileId`, `filePath`, `isProtected`, `usageType`, `createdAt`
- [ ] `ParentComplaintRecordDefinition` and `ComplaintQueueRowDefinition` extended with `files: ComplaintFileDefinition[]`
- [ ] `SubmitComplaintInputDefinition` extended with optional `filePaths: string[]`
- [ ] New `complaintFiles` query field defined
- [ ] Existing `parentComplaints` resolver includes `files: []` in return mapping
- [ ] Existing `adminComplaintQueue` resolver includes `files: []` in return mapping
- [ ] Existing `submitComplaint` mutation passes `filePaths` to service layer
- [ ] Every Pothos object type exposes an `id` field (or `fileId` for `ComplaintFile`) for Apollo cache normalization
- [ ] All resolvers delegate to service layer (`ComplaintService`, `SuggestionService`) — NO DB/repo imports
- [ ] All resolvers propagate `ctx.locale` to service calls
- [ ] All resolvers check `ctx.user?.id` for authentication before calling services
- [ ] `bun run generate:gqlSchema` succeeds with 0 errors
- [ ] `bun codegen` succeeds with 0 errors
- [ ] No `console` methods used — `logger` utility used for all logging (inherited from service layer)
- [ ] Fields are non-nullable by default; nullable fields explicitly marked with `nullable: true`

---

**Quality Gate — Per-File Validation:**
- [ ] `bun tsgo` on working files passes with 0 TypeScript errors & 0 warnings, after creating/modifying a single file
- [ ] `bun biome:check` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] `bun lint` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] `bun codescene` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] `loop over tsgo, biome:check, lint, codescene` on working files till no issues at all, after creating/modifying a single file

**Quality Gate — Task Completion Validation:**
- [ ] `bun tsgo` on working files passes with 0 TypeScript errors & 0 warnings, after completing all steps
- [ ] `bun biome:check` on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] `bun lint` on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] `bun codescene` on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] `loop over tsgo, biome:check, lint, codescene` on working files till no issues at all, after completing all steps