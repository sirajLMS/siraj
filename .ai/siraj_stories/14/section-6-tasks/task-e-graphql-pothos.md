### Task E — GraphQL Pothos: Complaint and Suggestion Types, Queries & Mutations

---

#### Objective

Create Pothos GraphQL object types, input types, enum types, query fields, and mutation fields for the complaints and suggestions domain. Wire all resolvers to the service layer (`ComplaintService` and `SuggestionService`). Register new modules in the barrel index file. Add shared complaint/suggestion type definitions to the communications types file.

---

#### Dependencies

- **Task C** — Services: `ComplaintService` and `SuggestionService` must be completed before this task. All resolver implementations delegate to these service namespaces.

---

#### Layer-Specific Rules

- **Framework**: Pothos code-first GraphQL schema builder.
- **Nullability**: Fields are non-nullable by default unless explicitly set to `nullable: true`. Ensure TypeScript types align with Pothos definitions.
- **Resolvers**: Pothos field resolvers delegate to the `backend/services/` layer. NO business logic inside GraphQL definitions.
- **Cache Updates**: Ensure `id` fields are always exposed on GraphQL objects so the Apollo client can auto-update its cache.
- **Locale Propagation & Localized Errors**: GraphQL field resolvers must propagate the request locale (`ctx.locale`) to service calls. Any direct error thrown in resolvers must also be translated using `getBackendTranslations`.
- **🚫 NO DB/Repo Imports**: Resolvers can ONLY depend on `backend/services/`. Importing from `backend/db/repo/`, `backend/db/schema`, or `drizzle-orm` is **strictly forbidden**.

---

#### Target Files

| # | File | Status |
|---|------|--------|
| 1 | `backend/graphql/pothos/complaint.pothos.ts` | NEW |
| 2 | `backend/graphql/pothos/suggestion.pothos.ts` | NEW |
| 3 | `backend/graphql/pothos/index.ts` | MODIFY — add 2 new exports |
| 4 | `backend/types/communications.types.ts` | MODIFY — add complaint/suggestion shared types |

---

#### Detailed Implementation Steps

---

##### Step 1 — Add shared types to `backend/types/communications.types.ts`

Open `backend/types/communications.types.ts` and append the following type definitions at the end of the file. These types are shared across the service and GraphQL layers for complaint and suggestion domain objects.

```typescript
export type ComplaintCategoryValue = "REGARDING_TEACHER" | "REGARDING_SYSTEM" | "OTHER";

export type ComplaintStatusValue = "UNANSWERED" | "ANSWERED";

export type ComplaintResponseShape = {
  readonly id: string;
  readonly complaintId: string;
  readonly responderUserId: string | null;
  readonly body: string;
  readonly emailSent: boolean;
  readonly createdAt: Date;
  readonly responderName: string | null;
};

export type ComplaintShape = {
  readonly id: string;
  readonly parentId: string;
  readonly studentId: string | null;
  readonly category: ComplaintCategoryValue;
  readonly submitterEmail: string;
  readonly body: string;
  readonly status: ComplaintStatusValue;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly parentName: string;
  readonly studentName: string | null;
  readonly responses: ReadonlyArray<ComplaintResponseShape>;
};

export type ComplaintQueueRowShape = {
  readonly id: string;
  readonly parentId: string;
  readonly studentId: string | null;
  readonly category: ComplaintCategoryValue;
  readonly submitterEmail: string;
  readonly body: string;
  readonly status: ComplaintStatusValue;
  readonly createdAt: Date;
  readonly parentName: string;
  readonly studentName: string | null;
  readonly responseCount: number;
};

export type ComplaintMetricsShape = {
  readonly id: string;
  readonly unanswered: number;
  readonly answered: number;
  readonly avgResolutionTime: string | null;
};

export type AdminComplaintQueueResultShape = {
  readonly id: string;
  readonly rows: ReadonlyArray<ComplaintQueueRowShape>;
  readonly metrics: ComplaintMetricsShape;
  readonly totalCount: number;
};

export type ParentComplaintRecordShape = {
  readonly id: string;
  readonly category: ComplaintCategoryValue;
  readonly body: string;
  readonly status: ComplaintStatusValue;
  readonly createdAt: Date;
  readonly studentName: string | null;
  readonly responses: ReadonlyArray<ComplaintResponseShape>;
};

export type SuggestionShape = {
  readonly id: string;
  readonly parentId: string;
  readonly submitterName: string;
  readonly body: string;
  readonly emailSentAt: Date | null;
  readonly createdAt: Date;
  readonly parentName: string;
};

export type SuggestionMetricsShape = {
  readonly id: string;
  readonly pending: number;
  readonly reviewed: number;
  readonly avgResponseTime: string | null;
};

export type AdminSuggestionResultShape = {
  readonly id: string;
  readonly rows: ReadonlyArray<SuggestionShape>;
  readonly metrics: SuggestionMetricsShape;
  readonly totalCount: number;
};

export type SubmitComplaintInputShape = {
  readonly studentId?: string | null;
  readonly category: ComplaintCategoryValue;
  readonly submitterEmail: string;
  readonly body: string;
};

export type RespondToComplaintInputShape = {
  readonly complaintId: string;
  readonly body: string;
  readonly sendEmail: boolean;
};

export type SubmitSuggestionInputShape = {
  readonly submitterName: string;
  readonly body: string;
};

export type ComplaintQueueFilterShape = {
  readonly search?: string | null;
  readonly status?: ComplaintStatusValue | null;
  readonly limit: number;
  readonly offset: number;
};

export type SuggestionFilterShape = {
  readonly search?: string | null;
  readonly status?: string | null;
  readonly limit: number;
  readonly offset: number;
};
```

**Key points:**
- All types use `readonly` modifier for immutability.
- Nullable fields use `| null` union syntax.
- `ComplaintCategoryValue` and `ComplaintStatusValue` are string literal union types that mirror the `ComplaintCategory` and `ComplaintStatus` enums from `shared/lib/enum.ts`.
- Input shapes are separate from output shapes to maintain clean separation.
- These types are consumed by both the Pothos layer and the service layer for type-safe data exchange.

---

##### Step 2 — Create `backend/graphql/pothos/complaint.pothos.ts`

This file defines all complaint-related Pothos GraphQL objects, enums, inputs, queries, and mutations. It imports services from `backend/services/` and types from `backend/types/communications.types.ts`.

```typescript
import { ComplaintService } from "@/backend/services/communication/complaint.service";
import { ComplaintCategory, ComplaintStatus } from "@/shared/lib/enum";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";

// ─── Enum Types ──────────────────────────────────────────────────────────────

export const ComplaintCategoryPothosEnum = gqlSchemaBuilder.enumType(ComplaintCategory, {
  name: "ComplaintCategory",
  description: "Categories for parent complaints.",
});

export const ComplaintStatusPothosEnum = gqlSchemaBuilder.enumType(ComplaintStatus, {
  name: "ComplaintStatus",
  description: "Status of a complaint in the support queue.",
});

// ─── ComplaintResponse Object ────────────────────────────────────────────────

export type ComplaintResponseDefinition = {
  id: string;
  complaintId: string;
  responderUserId: string | null;
  body: string;
  emailSent: boolean;
  createdAt: Date;
  responderName: string | null;
};

const ComplaintResponseRef = gqlSchemaBuilder.objectRef<ComplaintResponseDefinition>("ComplaintResponse");

export const ComplaintResponsePothosObject = ComplaintResponseRef.implement({
  description: "A single response to a complaint.",
  fields: t => ({
    id: t.exposeString("id"),
    complaintId: t.exposeString("complaintId"),
    responderUserId: t.exposeString("responderUserId", { nullable: true }),
    body: t.exposeString("body"),
    emailSent: t.exposeBoolean("emailSent"),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    responderName: t.exposeString("responderName", { nullable: true }),
  }),
});

// ─── Complaint Object ────────────────────────────────────────────────────────

export type ComplaintDefinition = {
  id: string;
  parentId: string;
  studentId: string | null;
  category: ComplaintCategory;
  submitterEmail: string;
  body: string;
  status: ComplaintStatus;
  createdAt: Date;
  updatedAt: Date;
  parentName: string;
  studentName: string | null;
  responses: ComplaintResponseDefinition[];
};

const ComplaintRef = gqlSchemaBuilder.objectRef<ComplaintDefinition>("Complaint");

export const ComplaintPothosObject = ComplaintRef.implement({
  description: "A parent complaint with full details and responses.",
  fields: t => ({
    id: t.exposeString("id"),
    parentId: t.exposeString("parentId"),
    studentId: t.exposeString("studentId", { nullable: true }),
    category: t.expose("category", { type: ComplaintCategoryPothosEnum }),
    submitterEmail: t.exposeString("submitterEmail"),
    body: t.exposeString("body"),
    status: t.expose("status", { type: ComplaintStatusPothosEnum }),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    updatedAt: t.expose("updatedAt", { type: "DateTime" }),
    parentName: t.exposeString("parentName"),
    studentName: t.exposeString("studentName", { nullable: true }),
    responses: t.expose("responses", { type: [ComplaintResponsePothosObject] }),
  }),
});

// ─── ParentComplaintRecord Object ────────────────────────────────────────────

export type ParentComplaintRecordDefinition = {
  id: string;
  category: ComplaintCategory;
  body: string;
  status: ComplaintStatus;
  createdAt: Date;
  studentName: string | null;
  responses: ComplaintResponseDefinition[];
};

const ParentComplaintRecordRef =
  gqlSchemaBuilder.objectRef<ParentComplaintRecordDefinition>("ParentComplaintRecord");

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
  }),
});

// ─── ComplaintQueueRow Object ────────────────────────────────────────────────

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

const ComplaintQueueRowRef = gqlSchemaBuilder.objectRef<ComplaintQueueRowDefinition>("ComplaintQueueRow");

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
  }),
});

// ─── ComplaintMetrics Object ─────────────────────────────────────────────────

export type ComplaintMetricsDefinition = {
  id: string;
  unanswered: number;
  answered: number;
  avgResolutionTime: string | null;
};

const ComplaintMetricsRef = gqlSchemaBuilder.objectRef<ComplaintMetricsDefinition>("ComplaintMetrics");

export const ComplaintMetricsPothosObject = ComplaintMetricsRef.implement({
  description: "Aggregate metrics for the complaint queue.",
  fields: t => ({
    id: t.exposeString("id"),
    unanswered: t.exposeInt("unanswered"),
    answered: t.exposeInt("answered"),
    avgResolutionTime: t.exposeString("avgResolutionTime", { nullable: true }),
  }),
});

// ─── AdminComplaintQueueResult Object ────────────────────────────────────────

export type AdminComplaintQueueResultDefinition = {
  id: string;
  rows: ComplaintQueueRowDefinition[];
  metrics: ComplaintMetricsDefinition;
  totalCount: number;
};

const AdminComplaintQueueResultRef =
  gqlSchemaBuilder.objectRef<AdminComplaintQueueResultDefinition>("AdminComplaintQueueResult");

export const AdminComplaintQueueResultPothosObject = AdminComplaintQueueResultRef.implement({
  description: "Paginated admin complaint queue with metrics.",
  fields: t => ({
    id: t.exposeString("id"),
    rows: t.expose("rows", { type: [ComplaintQueueRowPothosObject] }),
    metrics: t.expose("metrics", { type: ComplaintMetricsPothosObject }),
    totalCount: t.exposeInt("totalCount"),
  }),
});

// ─── Input Types ─────────────────────────────────────────────────────────────

export type SubmitComplaintInputDefinition = {
  studentId?: string | null;
  category: ComplaintCategory;
  submitterEmail: string;
  body: string;
};

export const SubmitComplaintInputPothosObject = gqlSchemaBuilder
  .inputRef<SubmitComplaintInputDefinition>("SubmitComplaintInput")
  .implement({
    description: "Input for submitting a new complaint.",
    fields: t => ({
      studentId: t.string({ required: false }),
      category: t.field({ type: ComplaintCategoryPothosEnum, required: true }),
      submitterEmail: t.string({ required: true }),
      body: t.string({ required: true }),
    }),
  });

export type RespondToComplaintInputDefinition = {
  complaintId: string;
  body: string;
  sendEmail: boolean;
};

export const RespondToComplaintInputPothosObject = gqlSchemaBuilder
  .inputRef<RespondToComplaintInputDefinition>("RespondToComplaintInput")
  .implement({
    description: "Input for responding to a complaint.",
    fields: t => ({
      complaintId: t.string({ required: true }),
      body: t.string({ required: true }),
      sendEmail: t.boolean({ required: true }),
    }),
  });

export type ComplaintQueueFilterDefinition = {
  search?: string | null;
  status?: ComplaintStatus | null;
  limit: number;
  offset: number;
};

export const ComplaintQueueFilterPothosObject = gqlSchemaBuilder
  .inputRef<ComplaintQueueFilterDefinition>("ComplaintQueueFilter")
  .implement({
    description: "Filter and pagination options for the admin complaint queue.",
    fields: t => ({
      search: t.string({ required: false }),
      status: t.field({ type: ComplaintStatusPothosEnum, required: false }),
      limit: t.int({ required: true }),
      offset: t.int({ required: true }),
    }),
  });

// ─── Queries ─────────────────────────────────────────────────────────────────

gqlSchemaBuilder.queryField("parentComplaints", t =>
  t.field({
    type: [ParentComplaintRecordPothosObject],
    description: "Returns the authenticated parent's complaint history with responses.",
    resolve: async (_root, _args, ctx) => {
      if (!ctx.user?.id) {
        throw new Error("unauthenticated");
      }

      const complaints = await ComplaintService.getParentComplaints(ctx.user.id, ctx.locale);

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
    },
  })
);

gqlSchemaBuilder.queryField("adminComplaintQueue", t =>
  t.field({
    type: AdminComplaintQueueResultPothosObject,
    description: "Returns the paginated admin complaint queue with metrics.",
    args: {
      filter: t.arg({ type: ComplaintQueueFilterPothosObject, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user?.id) {
        throw new Error("unauthenticated");
      }

      const result = await ComplaintService.getAdminQueue(
        ctx.user.id,
        {
          limit: args.filter.limit,
          offset: args.filter.offset,
          statusFilter: args.filter.status ?? null,
        },
        ctx.locale
      );

      return {
        id: "admin-complaint-queue",
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
        metrics: {
          id: "complaint-metrics",
          unanswered: result.unansweredCount,
          answered: result.answeredCount,
          avgResolutionTime: null,
        },
        totalCount: result.totalCount,
      };
    },
  })
);

// ─── Mutations ───────────────────────────────────────────────────────────────

gqlSchemaBuilder.mutationField("submitComplaint", t =>
  t.field({
    type: ComplaintPothosObject,
    description: "Submits a new complaint from the authenticated parent.",
    args: {
      input: t.arg({ type: SubmitComplaintInputPothosObject, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user?.id) {
        throw new Error("unauthenticated");
      }

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

      return {
        id: created.id,
        parentId: created.parentId,
        studentId: created.studentId ?? null,
        category: created.category as ComplaintCategory,
        submitterEmail: created.submitterEmail,
        body: created.body,
        status: created.status as ComplaintStatus,
        createdAt: created.createdAt,
        updatedAt: created.createdAt,
        parentName: "",
        studentName: null,
        responses: [],
      };
    },
  })
);

gqlSchemaBuilder.mutationField("respondToComplaint", t =>
  t.field({
    type: ComplaintResponsePothosObject,
    description: "Creates a response to an existing complaint (admin only).",
    args: {
      input: t.arg({ type: RespondToComplaintInputPothosObject, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user?.id) {
        throw new Error("unauthenticated");
      }

      const response = await ComplaintService.respondToComplaint(
        ctx.user.id,
        args.input.complaintId,
        args.input.body,
        args.input.sendEmail,
        ctx.locale
      );

      return {
        id: response.id,
        complaintId: response.complaintId,
        responderUserId: response.responderUserId ?? null,
        body: response.body,
        emailSent: response.emailSent,
        createdAt: response.createdAt,
        responderName: null,
      };
    },
  })
);

gqlSchemaBuilder.mutationField("deleteComplaint", t =>
  t.field({
    type: "Boolean",
    description: "Soft-deletes a complaint (admin only). Returns true on success.",
    args: {
      complaintId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user?.id) {
        throw new Error("unauthenticated");
      }

      await ComplaintService.deleteComplaint(ctx.user.id, args.complaintId, ctx.locale);

      return true;
    },
  })
);
```

**Key points:**
- Two enum types (`ComplaintCategory`, `ComplaintStatus`) are registered via `gqlSchemaBuilder.enumType()` using the existing enums from `shared/lib/enum.ts`.
- Six object types are defined: `ComplaintResponse`, `Complaint`, `ParentComplaintRecord`, `ComplaintQueueRow`, `ComplaintMetrics`, `AdminComplaintQueueResult`. Every object exposes an `id` field for Apollo cache normalization.
- Three input types: `SubmitComplaintInput`, `RespondToComplaintInput`, `ComplaintQueueFilter`.
- Two query fields: `parentComplaints` (parent-scoped) and `adminComplaintQueue` (admin-scoped with filter arg).
- Three mutation fields: `submitComplaint`, `respondToComplaint`, `deleteComplaint`.
- All resolvers check `ctx.user?.id` for authentication and propagate `ctx.locale` to service calls.
- Resolvers transform service return types to match the Pothos object shape (e.g., mapping `status` strings to enum values, providing default empty strings for enriched fields like `parentName`).
- No DB/repo imports — all data access is delegated to `ComplaintService`.

---

##### Step 3 — Create `backend/graphql/pothos/suggestion.pothos.ts`

This file defines all suggestion-related Pothos GraphQL objects, inputs, queries, and mutations.

```typescript
import { SuggestionService } from "@/backend/services/communication/suggestion.service";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";

// ─── Suggestion Object ───────────────────────────────────────────────────────

export type SuggestionDefinition = {
  id: string;
  parentId: string;
  submitterName: string;
  body: string;
  emailSentAt: Date | null;
  createdAt: Date;
  parentName: string;
};

const SuggestionRef = gqlSchemaBuilder.objectRef<SuggestionDefinition>("Suggestion");

export const SuggestionPothosObject = SuggestionRef.implement({
  description: "A parent suggestion with full details.",
  fields: t => ({
    id: t.exposeString("id"),
    parentId: t.exposeString("parentId"),
    submitterName: t.exposeString("submitterName"),
    body: t.exposeString("body"),
    emailSentAt: t.expose("emailSentAt", { type: "DateTime", nullable: true }),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    parentName: t.exposeString("parentName"),
  }),
});

// ─── SuggestionMetrics Object ────────────────────────────────────────────────

export type SuggestionMetricsDefinition = {
  id: string;
  pending: number;
  reviewed: number;
  avgResponseTime: string | null;
};

const SuggestionMetricsRef = gqlSchemaBuilder.objectRef<SuggestionMetricsDefinition>("SuggestionMetrics");

export const SuggestionMetricsPothosObject = SuggestionMetricsRef.implement({
  description: "Aggregate metrics for the suggestion queue.",
  fields: t => ({
    id: t.exposeString("id"),
    pending: t.exposeInt("pending"),
    reviewed: t.exposeInt("reviewed"),
    avgResponseTime: t.exposeString("avgResponseTime", { nullable: true }),
  }),
});

// ─── AdminSuggestionResult Object ────────────────────────────────────────────

export type AdminSuggestionResultDefinition = {
  id: string;
  rows: SuggestionDefinition[];
  metrics: SuggestionMetricsDefinition;
  totalCount: number;
};

const AdminSuggestionResultRef =
  gqlSchemaBuilder.objectRef<AdminSuggestionResultDefinition>("AdminSuggestionResult");

export const AdminSuggestionResultPothosObject = AdminSuggestionResultRef.implement({
  description: "Paginated admin suggestion list with metrics.",
  fields: t => ({
    id: t.exposeString("id"),
    rows: t.expose("rows", { type: [SuggestionPothosObject] }),
    metrics: t.expose("metrics", { type: SuggestionMetricsPothosObject }),
    totalCount: t.exposeInt("totalCount"),
  }),
});

// ─── Input Types ─────────────────────────────────────────────────────────────

export type SubmitSuggestionInputDefinition = {
  submitterName: string;
  body: string;
};

export const SubmitSuggestionInputPothosObject = gqlSchemaBuilder
  .inputRef<SubmitSuggestionInputDefinition>("SubmitSuggestionInput")
  .implement({
    description: "Input for submitting a new suggestion.",
    fields: t => ({
      submitterName: t.string({ required: true }),
      body: t.string({ required: true }),
    }),
  });

export type SuggestionFilterDefinition = {
  search?: string | null;
  status?: string | null;
  limit: number;
  offset: number;
};

export const SuggestionFilterPothosObject = gqlSchemaBuilder
  .inputRef<SuggestionFilterDefinition>("SuggestionFilter")
  .implement({
    description: "Filter and pagination options for the admin suggestion list.",
    fields: t => ({
      search: t.string({ required: false }),
      status: t.string({ required: false }),
      limit: t.int({ required: true }),
      offset: t.int({ required: true }),
    }),
  });

// ─── Queries ─────────────────────────────────────────────────────────────────

gqlSchemaBuilder.queryField("adminSuggestions", t =>
  t.field({
    type: AdminSuggestionResultPothosObject,
    description: "Returns the paginated admin suggestion list with metrics.",
    args: {
      filter: t.arg({ type: SuggestionFilterPothosObject, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user?.id) {
        throw new Error("unauthenticated");
      }

      const result = await SuggestionService.getAdminSuggestions(
        ctx.user.id,
        {
          limit: args.filter.limit,
          offset: args.filter.offset,
        },
        ctx.locale
      );

      return {
        id: "admin-suggestion-result",
        rows: result.suggestions.map(s => ({
          id: s.id,
          parentId: s.parentId,
          submitterName: s.submitterName,
          body: s.body,
          emailSentAt: s.emailSentAt ?? null,
          createdAt: s.createdAt,
          parentName: "",
        })),
        metrics: {
          id: "suggestion-metrics",
          pending: result.pendingCount,
          reviewed: result.reviewedCount,
          avgResponseTime: null,
        },
        totalCount: result.totalCount,
      };
    },
  })
);

// ─── Mutations ───────────────────────────────────────────────────────────────

gqlSchemaBuilder.mutationField("submitSuggestion", t =>
  t.field({
    type: SuggestionPothosObject,
    description: "Submits a new suggestion from the authenticated parent.",
    args: {
      input: t.arg({ type: SubmitSuggestionInputPothosObject, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user?.id) {
        throw new Error("unauthenticated");
      }

      const created = await SuggestionService.submitSuggestion(
        ctx.user.id,
        {
          submitterName: args.input.submitterName,
          body: args.input.body,
        },
        ctx.locale
      );

      return {
        id: created.id,
        parentId: created.parentId,
        submitterName: created.submitterName,
        body: created.body,
        emailSentAt: created.emailSentAt ?? null,
        createdAt: created.createdAt,
        parentName: "",
      };
    },
  })
);

gqlSchemaBuilder.mutationField("markSuggestionReviewed", t =>
  t.field({
    type: SuggestionPothosObject,
    description: "Marks a suggestion as reviewed (admin only).",
    args: {
      suggestionId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user?.id) {
        throw new Error("unauthenticated");
      }

      const updated = await SuggestionService.markSuggestionReviewed(
        ctx.user.id,
        args.suggestionId,
        ctx.locale
      );

      return {
        id: updated.id,
        parentId: updated.parentId,
        submitterName: updated.submitterName,
        body: updated.body,
        emailSentAt: updated.emailSentAt ?? null,
        createdAt: updated.createdAt,
        parentName: "",
      };
    },
  })
);
```

**Key points:**
- Three object types: `Suggestion`, `SuggestionMetrics`, `AdminSuggestionResult`. Every object exposes an `id` field.
- Two input types: `SubmitSuggestionInput`, `SuggestionFilter`.
- One query field: `adminSuggestions` (admin-scoped with filter arg).
- Two mutation fields: `submitSuggestion` and `markSuggestionReviewed`.
- All resolvers check `ctx.user?.id` for authentication and propagate `ctx.locale`.
- Resolvers transform service return types to match Pothos object shapes.
- `emailSentAt` is exposed as a `DateTime` scalar with `nullable: true`.
- No DB/repo imports — all data access is delegated to `SuggestionService`.

---

##### Step 4 — Register new modules in `backend/graphql/pothos/index.ts`

Open `backend/graphql/pothos/index.ts` and add the following two export lines in alphabetical order. Insert `complaint.pothos` after `class-session.pothos` and `suggestion.pothos` after `student-lifecycle.pothos`:

```typescript
export * from "./auth.pothos";
export * from "./availability-search.pothos";
export * from "./billing-alerts.pothos";
export * from "./billing-history.pothos";
export * from "./billing-management.pothos";
export * from "./class-session.pothos";
export * from "./complaint.pothos";
export * from "./dst-migration.pothos";
export * from "./enum.pothos";
export * from "./learning-resource.pothos";
export * from "./manager-onboarding.pothos";
export * from "./notification-alerts.pothos";
export * from "./pagination.objects";
export * from "./parent-directory.pothos";
export * from "./parent-document.pothos";
export * from "./parent-onboarding.pothos";
export * from "./parent-profile.pothos";
export * from "./permission-management.pothos";
export * from "./recurring-class.pothos";
export * from "./report.pothos";
export * from "./schedule.pothos";
export * from "./schedule-deletion.pothos";
export * from "./staff-directory.pothos";
export * from "./staff-profile.pothos";
export * from "./storage.pothos";
export * from "./student.pothos";
export * from "./student-directory.pothos";
export * from "./student-history.pothos";
export * from "./student-lifecycle.pothos";
export * from "./suggestion.pothos";
export * from "./teacher.pothos";
export * from "./teacher-dashboard.pothos";
export * from "./teacher-onboarding.pothos";
export * from "./weekly-schedule.pothos";
```

**Key points:**
- `complaint.pothos` is inserted alphabetically after `class-session.pothos`.
- `suggestion.pothos` is inserted alphabetically after `student-lifecycle.pothos`.
- All existing exports remain unchanged.

---

##### Step 5 — Run schema generation and codegen

After all files are created and registered, run the following commands to generate the GraphQL schema SDL and regenerate frontend TypeScript types:

```bash
bun run generate:gqlSchema
bun codegen
```

These commands:
1. `generate:gqlSchema` — Traverses all Pothos definitions and outputs the GraphQL SDL schema file.
2. `codegen` — Generates TypeScript types from the SDL schema for the frontend Apollo client.

Both commands must succeed with 0 errors. If `generate:gqlSchema` fails, check for:
- Missing imports in the Pothos files.
- Duplicate type names across Pothos modules.
- Invalid field type references (e.g., referencing an enum that doesn't exist).

If `codegen` fails, check for:
- Schema SDL syntax errors.
- Missing frontend GraphQL document files that reference the new types.

---

#### File Creation Order

Execute the steps in this exact order to satisfy incremental type-checking:

1. `backend/types/communications.types.ts` — Add shared types (no new internal dependencies)
2. `backend/graphql/pothos/complaint.pothos.ts` — Complaint objects, queries, mutations
3. `backend/graphql/pothos/suggestion.pothos.ts` — Suggestion objects, queries, mutations
4. `backend/graphql/pothos/index.ts` — Register both new modules
5. Run `bun run generate:gqlSchema` and `bun codegen`

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

- [ ] `backend/types/communications.types.ts` includes all shared complaint and suggestion type definitions
- [ ] `backend/graphql/pothos/complaint.pothos.ts` defines 2 enum types: `ComplaintCategory`, `ComplaintStatus`
- [ ] `backend/graphql/pothos/complaint.pothos.ts` defines 6 object types: `ComplaintResponse`, `Complaint`, `ParentComplaintRecord`, `ComplaintQueueRow`, `ComplaintMetrics`, `AdminComplaintQueueResult`
- [ ] `backend/graphql/pothos/complaint.pothos.ts` defines 3 input types: `SubmitComplaintInput`, `RespondToComplaintInput`, `ComplaintQueueFilter`
- [ ] `backend/graphql/pothos/complaint.pothos.ts` defines 2 query fields: `parentComplaints`, `adminComplaintQueue`
- [ ] `backend/graphql/pothos/complaint.pothos.ts` defines 3 mutation fields: `submitComplaint`, `respondToComplaint`, `deleteComplaint`
- [ ] `backend/graphql/pothos/suggestion.pothos.ts` defines 3 object types: `Suggestion`, `SuggestionMetrics`, `AdminSuggestionResult`
- [ ] `backend/graphql/pothos/suggestion.pothos.ts` defines 2 input types: `SubmitSuggestionInput`, `SuggestionFilter`
- [ ] `backend/graphql/pothos/suggestion.pothos.ts` defines 1 query field: `adminSuggestions`
- [ ] `backend/graphql/pothos/suggestion.pothos.ts` defines 2 mutation fields: `submitSuggestion`, `markSuggestionReviewed`
- [ ] Every Pothos object type exposes an `id` field for Apollo cache normalization
- [ ] All resolvers delegate to service layer (`ComplaintService`, `SuggestionService`) — NO DB/repo imports
- [ ] All resolvers propagate `ctx.locale` to service calls
- [ ] All resolvers check `ctx.user?.id` for authentication before calling services
- [ ] `backend/graphql/pothos/index.ts` exports both `complaint.pothos` and `suggestion.pothos`
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
