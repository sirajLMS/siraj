### Task E — Backend GraphQL: Pothos Mutations for Billing & Student Operations

**Objective:** Add 5 new GraphQL mutations to the Pothos schema: `createManualInvoice`, `markInvoicePaid`, `deleteInvoice`, `reassignStudentTeacher`, `changeStudentStatus`. Wire resolvers to the service layer. Run schema generation and codegen.

**Dependencies:** Depends on Task D — `BillingManagementService`, `StudentLifecycleService`, and `NotificationSyncService` are implemented.

**Layer-Specific Rules (Backend GraphQL — Flattened from `backend/graphql/pothos/AGENTS.md`):**
- Framework: Pothos code-first GraphQL schema builder (`gqlSchemaBuilder`).
- Nullability: Fields are non-nullable by default unless explicitly set to `nullable: true`.
- **Every object returned MUST expose an `id` field** for Apollo cache normalization.
- Resolvers MUST delegate ALL logic to the service layer — no business logic in resolvers.
- **🚫 NO DB/Repo Imports**: Resolvers can ONLY import from `backend/services/`.
- Locale Propagation: Resolvers must pass `ctx.locale` to all service calls.
- Auth Context: Resolvers pass `ctx.user?.id || ""` as `actorUserId`.
- Existing pattern: mutations return the modified object (or a wrapper object with `id`).

**Target Files:**
- `backend/graphql/pothos/billing-management.pothos.ts` — NEW file with `createManualInvoice`, `markInvoicePaid`, `deleteInvoice` mutations
- `backend/graphql/pothos/student-lifecycle.pothos.ts` — NEW file with `reassignStudentTeacher`, `changeStudentStatus` mutations
- `backend/graphql/pothos/index.ts` — Add exports for both new modules

---

#### Step 1: Create `backend/graphql/pothos/billing-management.pothos.ts`

```typescript
// backend/graphql/pothos/billing-management.pothos.ts

import { BillingManagementService } from "@/backend/services/billing/billing-management.service";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";

// ─── Result Object Types ──────────────────────────────────────────────────────

export type ManualInvoiceResultDefinition = {
  id: string;
  parentId: string;
  studentId: string | null;
  amount: string;
  currency: string;
  status: string;
  invoiceType: string;
  issueDate: string;
  dueDate: string;
  paidDate: string | null;
  version: number;
  createdAt: Date;
};

const ManualInvoiceResultRef =
  gqlSchemaBuilder.objectRef<ManualInvoiceResultDefinition>("ManualInvoiceResult");

export const ManualInvoiceResultPothosObject = ManualInvoiceResultRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    parentId: t.exposeString("parentId"),
    studentId: t.exposeString("studentId", { nullable: true }),
    amount: t.exposeString("amount"),
    currency: t.exposeString("currency"),
    status: t.exposeString("status"),
    invoiceType: t.exposeString("invoiceType"),
    issueDate: t.exposeString("issueDate"),
    dueDate: t.exposeString("dueDate"),
    paidDate: t.exposeString("paidDate", { nullable: true }),
    version: t.exposeInt("version"),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
  }),
});

// ─── MarkInvoicePaid Result ───────────────────────────────────────────────────

export type MarkInvoicePaidResultDefinition = {
  id: string;
  parentId: string;
  status: string;
  paidDate: string | null;
  version: number;
  notificationSummaryUpdated: boolean;
};

const MarkInvoicePaidResultRef =
  gqlSchemaBuilder.objectRef<MarkInvoicePaidResultDefinition>("MarkInvoicePaidResult");

export const MarkInvoicePaidResultPothosObject = MarkInvoicePaidResultRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    parentId: t.exposeString("parentId"),
    status: t.exposeString("status"),
    paidDate: t.exposeString("paidDate", { nullable: true }),
    version: t.exposeInt("version"),
    notificationSummaryUpdated: t.exposeBoolean("notificationSummaryUpdated"),
  }),
});

// ─── DeleteInvoice Result ─────────────────────────────────────────────────────

export type DeleteInvoiceResultDefinition = {
  id: string;
  parentId: string;
  deletedAt: string | null;
  version: number;
  notificationSummaryUpdated: boolean;
};

const DeleteInvoiceResultRef =
  gqlSchemaBuilder.objectRef<DeleteInvoiceResultDefinition>("DeleteInvoiceResult");

export const DeleteInvoiceResultPothosObject = DeleteInvoiceResultRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    parentId: t.exposeString("parentId"),
    deletedAt: t.exposeString("deletedAt", { nullable: true }),
    version: t.exposeInt("version"),
    notificationSummaryUpdated: t.exposeBoolean("notificationSummaryUpdated"),
  }),
});

// ─── Mutations ────────────────────────────────────────────────────────────────

gqlSchemaBuilder.mutationField("createManualInvoice", t =>
  t.field({
    type: ManualInvoiceResultRef,
    args: {
      parentId: t.arg.string({ required: true }),
      studentId: t.arg.string({ required: false }),
      amount: t.arg.string({ required: true }),
      currency: t.arg.string({ required: true }),
      invoiceType: t.arg.string({ required: true }),
      issueDate: t.arg.string({ required: true }),
      dueDate: t.arg.string({ required: true }),
      exchangeRateSnapshot: t.arg.string({ required: false }),
      exchangeRateSource: t.arg.string({ required: false }),
    },
    resolve: async (_root, args, ctx) => {
      const result = await BillingManagementService.createManualInvoice(
        ctx.user?.id || "",
        {
          parentId: args.parentId,
          studentId: args.studentId ?? null,
          amount: args.amount,
          currency: args.currency,
          invoiceType: args.invoiceType,
          issueDate: args.issueDate,
          dueDate: args.dueDate,
          exchangeRateSnapshot: args.exchangeRateSnapshot ?? null,
          exchangeRateSource: args.exchangeRateSource ?? null,
        },
        ctx.locale
      );
      return result;
    },
  })
);

gqlSchemaBuilder.mutationField("markInvoicePaid", t =>
  t.field({
    type: MarkInvoicePaidResultRef,
    args: {
      invoiceId: t.arg.string({ required: true }),
      expectedVersion: t.arg.int({ required: false }),
    },
    resolve: async (_root, args, ctx) => {
      const result = await BillingManagementService.markInvoicePaid(
        ctx.user?.id || "",
        args.invoiceId,
        args.expectedVersion ?? undefined,
        ctx.locale
      );
      return {
        id: result.invoice.id,
        parentId: result.invoice.parentId,
        status: result.invoice.status,
        paidDate: result.invoice.paidDate,
        version: result.invoice.version,
        notificationSummaryUpdated: result.notificationSummaryUpdated,
      };
    },
  })
);

gqlSchemaBuilder.mutationField("deleteInvoice", t =>
  t.field({
    type: DeleteInvoiceResultRef,
    args: {
      invoiceId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const result = await BillingManagementService.deleteInvoice(
        ctx.user?.id || "",
        args.invoiceId,
        ctx.locale
      );
      return {
        id: result.invoice.id,
        parentId: result.invoice.parentId,
        deletedAt: result.invoice.deletedAt,
        version: result.invoice.version,
        notificationSummaryUpdated: result.notificationSummaryUpdated,
      };
    },
  })
);
```

---

#### Step 2: Create `backend/graphql/pothos/student-lifecycle.pothos.ts`

```typescript
// backend/graphql/pothos/student-lifecycle.pothos.ts

import { StudentLifecycleService } from "@/backend/services/student/student-lifecycle.service";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";

// ─── ReassignStudentTeacher Result ────────────────────────────────────────────

export type ReassignStudentTeacherResultDefinition = {
  id: string;
  primaryTeacherId: string | null;
  version: number;
};

const ReassignStudentTeacherResultRef =
  gqlSchemaBuilder.objectRef<ReassignStudentTeacherResultDefinition>(
    "ReassignStudentTeacherResult"
  );

export const ReassignStudentTeacherResultPothosObject = ReassignStudentTeacherResultRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    primaryTeacherId: t.exposeString("primaryTeacherId", { nullable: true }),
    version: t.exposeInt("version"),
  }),
});

// ─── ChangeStudentStatus Result ───────────────────────────────────────────────

export type ChangeStudentStatusResultDefinition = {
  id: string;
  status: string;
  version: number;
};

const ChangeStudentStatusResultRef =
  gqlSchemaBuilder.objectRef<ChangeStudentStatusResultDefinition>("ChangeStudentStatusResult");

export const ChangeStudentStatusResultPothosObject = ChangeStudentStatusResultRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    status: t.exposeString("status"),
    version: t.exposeInt("version"),
  }),
});

// ─── Mutations ────────────────────────────────────────────────────────────────

gqlSchemaBuilder.mutationField("reassignStudentTeacher", t =>
  t.field({
    type: ReassignStudentTeacherResultRef,
    args: {
      studentId: t.arg.string({ required: true }),
      newTeacherId: t.arg.string({ required: true }),
      expectedVersion: t.arg.int({ required: false }),
    },
    resolve: async (_root, args, ctx) => {
      const result = await StudentLifecycleService.reassignTeacher(
        ctx.user?.id || "",
        args.studentId,
        args.newTeacherId,
        args.expectedVersion ?? undefined,
        ctx.locale
      );
      return result;
    },
  })
);

gqlSchemaBuilder.mutationField("changeStudentStatus", t =>
  t.field({
    type: ChangeStudentStatusResultRef,
    args: {
      studentId: t.arg.string({ required: true }),
      newStatus: t.arg.string({ required: true }),
      expectedVersion: t.arg.int({ required: false }),
    },
    resolve: async (_root, args, ctx) => {
      const result = await StudentLifecycleService.changeStudentStatus(
        ctx.user?.id || "",
        args.studentId,
        args.newStatus,
        args.expectedVersion ?? undefined,
        ctx.locale
      );
      return result;
    },
  })
);
```

---

#### Step 3: Register New Modules in `backend/graphql/pothos/index.ts`

Open `backend/graphql/pothos/index.ts` and add exports for both new modules. Add these two lines alongside the existing imports:

```typescript
// Add to backend/graphql/pothos/index.ts:
import "./billing-management.pothos";
import "./student-lifecycle.pothos";
```

If the file uses named exports instead of side-effect imports, add:
```typescript
export * from "./billing-management.pothos";
export * from "./student-lifecycle.pothos";
```

Check the existing pattern in `index.ts` and match it exactly.

---

#### Step 4: Run Schema Generation and Codegen

```bash
bun run generate:gqlSchema
bun codegen
```

After codegen, verify in `frontend/graphql/generated/gql/graphql-types.ts` that the following mutations are present:

```typescript
// Expected mutation signatures in generated types:
// createManualInvoice(parentId: string, studentId?: string, amount: string, currency: string, invoiceType: string, issueDate: string, dueDate: string, ...): ManualInvoiceResult
// markInvoicePaid(invoiceId: string, expectedVersion?: number): MarkInvoicePaidResult
// deleteInvoice(invoiceId: string): DeleteInvoiceResult
// reassignStudentTeacher(studentId: string, newTeacherId: string, expectedVersion?: number): ReassignStudentTeacherResult
// changeStudentStatus(studentId: string, newStatus: string, expectedVersion?: number): ChangeStudentStatusResult
```

All returned types must include the `id` field — verify this in the generated schema file.

---

**Test Execution Requirements:**
```bash
bun run generate:gqlSchema
bun codegen
bun tsgo
```

---

**Success Criteria / Check Progress Points:**
- [ ] `billing-management.pothos.ts` created with `createManualInvoice`, `markInvoicePaid`, `deleteInvoice` mutations
- [ ] `student-lifecycle.pothos.ts` created with `reassignStudentTeacher`, `changeStudentStatus` mutations
- [ ] All result types expose `id` field for Apollo cache normalization
- [ ] All resolvers delegate to service layer — zero business logic in resolvers
- [ ] No `backend/db/` or `drizzle-orm` imports in either pothos file
- [ ] `ctx.locale` propagated to all service calls
- [ ] `ctx.user?.id || ""` used as `actorUserId`
- [ ] Both modules registered in `backend/graphql/pothos/index.ts`
- [ ] `bun run generate:gqlSchema` passes with 0 errors
- [ ] `bun codegen` passes with 0 errors
- [ ] Generated `graphql-types.ts` contains all 5 new mutations

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
