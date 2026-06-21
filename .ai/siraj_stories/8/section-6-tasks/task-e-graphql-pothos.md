# Task E — Backend GraphQL: Pothos Objects, Queries & Mutations

**Objective:** Define Pothos GraphQL object types, input types, query fields, and mutation fields for all new operations. Wire resolvers exclusively to the service layer.

**Dependencies:** Depends on Task D — all service methods must exist.

**Layer-Specific Rules (Backend GraphQL — Flattened from backend/graphql/AGENTS.md):**
- Framework: Pothos code-first GraphQL schema builder.
- Every object returned MUST expose an `id` field for Apollo cache normalization.
- Nullability: Fields are non-nullable by default unless `nullable: true` is set.
- **🚫 NO DB/Repo Imports** — Resolvers depend ONLY on `backend/services/`.
- Resolvers must propagate `ctx.locale` to all service calls.
- Resolvers use `ctx.userId` as the `actorUserId`.
- Run `bun run generate:gqlSchema` then `bun codegen` after modifying Pothos files.

**Target Files:**
- `backend/graphql/pothos/parent-profile.pothos.ts` — NEW
- `backend/graphql/pothos/billing-history.pothos.ts` — NEW
- `backend/graphql/pothos/parent-document.pothos.ts` — NEW
- `backend/graphql/pothos/index.ts` — Add exports for 3 new modules

---

## Detailed Implementation Steps

### Step 1: Create `backend/graphql/pothos/parent-profile.pothos.ts`

This file defines 3 object types and wires 3 queries + 1 mutation.

```typescript
import { ParentProfileService, type AssociatedStudentResult } from "@/backend/services/parent/parent-profile.service";
import { StudentManagementService } from "@/backend/services/student/student-management.service";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";

// ─── ParentProfile Object ───────────────────────────────────────────────────

export type ParentProfileDefinition = {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  status: string;
  phone: string | null;
  nationality: string | null;
  address: string | null;
  facebook: string | null;
  whatsapp: string | null;
  twitter: string | null;
  skype: string | null;
  defaultZoomLink: string | null;
  invoiceType: string | null;
  feeAmount: string | null;
  paymentMethod: string | null;
  currency: string | null;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
};

const ParentProfileRef = gqlSchemaBuilder.objectRef<ParentProfileDefinition>("ParentProfile");

export const ParentProfilePothosObject = ParentProfileRef.implement({
  fields: (t) => ({
    id: t.exposeString("id"),
    userId: t.exposeString("userId"),
    name: t.exposeString("name"),
    email: t.exposeString("email"),
    avatarUrl: t.exposeString("avatarUrl", { nullable: true }),
    status: t.exposeString("status"),
    phone: t.exposeString("phone", { nullable: true }),
    nationality: t.exposeString("nationality", { nullable: true }),
    address: t.exposeString("address", { nullable: true }),
    facebook: t.exposeString("facebook", { nullable: true }),
    whatsapp: t.exposeString("whatsapp", { nullable: true }),
    twitter: t.exposeString("twitter", { nullable: true }),
    skype: t.exposeString("skype", { nullable: true }),
    defaultZoomLink: t.exposeString("defaultZoomLink", { nullable: true }),
    invoiceType: t.exposeString("invoiceType", { nullable: true }),
    feeAmount: t.exposeString("feeAmount", { nullable: true }),
    paymentMethod: t.exposeString("paymentMethod", { nullable: true }),
    currency: t.exposeString("currency", { nullable: true }),
    timezone: t.exposeString("timezone"),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    updatedAt: t.expose("updatedAt", { type: "DateTime" }),
  }),
});

// ─── AssociatedStudent Object ────────────────────────────────────────────────

export type AssociatedStudentDefinition = AssociatedStudentResult;

const AssociatedStudentRef = gqlSchemaBuilder.objectRef<AssociatedStudentDefinition>("AssociatedStudent");

export const AssociatedStudentPothosObject = AssociatedStudentRef.implement({
  fields: (t) => ({
    id: t.exposeString("id"),
    name: t.exposeString("name"),
    status: t.exposeString("status"),
    primaryTeacherId: t.exposeString("primaryTeacherId", { nullable: true }),
    teacherName: t.exposeString("teacherName", { nullable: true }),
    hoursPerWeek: t.exposeString("hoursPerWeek"),
    classesRemaining: t.exposeInt("classesRemaining"),
    classesTotal: t.exposeInt("classesTotal"),
    language: t.exposeString("language", { nullable: true }),
    gender: t.exposeString("gender", { nullable: true }),
    updatedAt: t.expose("updatedAt", { type: "DateTime" }),
  }),
});

// ─── DeactivateParentResult Object ──────────────────────────────────────────

export type DeactivateParentResultDefinition = {
  id: string;
  userId: string;
  status: string;
};

const DeactivateParentResultRef = gqlSchemaBuilder.objectRef<DeactivateParentResultDefinition>("DeactivateParentResult");

export const DeactivateParentResultPothosObject = DeactivateParentResultRef.implement({
  fields: (t) => ({
    id: t.exposeString("id"),
    userId: t.exposeString("userId"),
    status: t.exposeString("status"),
  }),
});

// ─── EditQuotaResult Object ──────────────────────────────────────────────────

export type EditQuotaResultDefinition = {
  id: string;
  classesRemaining: number;
  classesTotal: number;
  version: number;
};

const EditQuotaResultRef = gqlSchemaBuilder.objectRef<EditQuotaResultDefinition>("EditQuotaResult");

export const EditQuotaResultPothosObject = EditQuotaResultRef.implement({
  fields: (t) => ({
    id: t.exposeString("id"),
    classesRemaining: t.exposeInt("classesRemaining"),
    classesTotal: t.exposeInt("classesTotal"),
    version: t.exposeInt("version"),
  }),
});

// ─── Queries ─────────────────────────────────────────────────────────────────

gqlSchemaBuilder.queryField("parentProfile", (t) =>
  t.field({
    type: ParentProfileRef,
    nullable: true,
    args: {
      parentId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      return ParentProfileService.getProfile(ctx.userId, args.parentId, ctx.locale);
    },
  })
);

gqlSchemaBuilder.queryField("parentAssociatedStudents", (t) =>
  t.field({
    type: [AssociatedStudentRef],
    args: {
      parentId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      return ParentProfileService.getAssociatedStudents(ctx.userId, args.parentId, ctx.locale);
    },
  })
);

// ─── Mutations ───────────────────────────────────────────────────────────────

gqlSchemaBuilder.mutationField("deactivateParent", (t) =>
  t.field({
    type: DeactivateParentResultRef,
    args: {
      parentId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      return ParentProfileService.deactivateAccount(ctx.userId, args.parentId, ctx.locale);
    },
  })
);

gqlSchemaBuilder.mutationField("updateStudentQuota", (t) =>
  t.field({
    type: EditQuotaResultRef,
    args: {
      studentId: t.arg.string({ required: true }),
      newClassesRemaining: t.arg.int({ required: true }),
      expectedVersion: t.arg.int({ required: false }),
    },
    resolve: async (_root, args, ctx) => {
      return StudentManagementService.editQuota(
        ctx.userId,
        args.studentId,
        args.newClassesRemaining,
        args.expectedVersion ?? undefined,
        ctx.locale
      );
    },
  })
);
```

---

### Step 2: Create `backend/graphql/pothos/billing-history.pothos.ts`

```typescript
import { BillingHistoryService } from "@/backend/services/billing/billing-history.service";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";

export type ParentInvoiceRowDefinition = {
  id: string;
  issueDate: string;
  dueDate: string;
  paidDate: string | null;
  amount: string;
  currency: string;
  status: string;
  invoiceType: string;
  studentId: string | null;
};

const ParentInvoiceRowRef = gqlSchemaBuilder.objectRef<ParentInvoiceRowDefinition>("ParentInvoiceRow");

export const ParentInvoiceRowPothosObject = ParentInvoiceRowRef.implement({
  fields: (t) => ({
    id: t.exposeString("id"),
    issueDate: t.exposeString("issueDate"),
    dueDate: t.exposeString("dueDate"),
    paidDate: t.exposeString("paidDate", { nullable: true }),
    amount: t.exposeString("amount"),
    currency: t.exposeString("currency"),
    status: t.exposeString("status"),
    invoiceType: t.exposeString("invoiceType"),
    studentId: t.exposeString("studentId", { nullable: true }),
  }),
});

gqlSchemaBuilder.queryField("parentInvoiceHistory", (t) =>
  t.field({
    type: [ParentInvoiceRowRef],
    args: {
      parentId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      return BillingHistoryService.getParentInvoiceHistory(ctx.userId, args.parentId, ctx.locale);
    },
  })
);
```

---

### Step 3: Create `backend/graphql/pothos/parent-document.pothos.ts`

```typescript
import { ParentDocumentService } from "@/backend/services/parent/parent-document.service";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";

export type ParentDocumentDefinition = {
  id: string;
  fileId: string;
  filePath: string;
  isProtected: boolean;
  usageType: string;
  createdAt: Date;
};

const ParentDocumentRef = gqlSchemaBuilder.objectRef<ParentDocumentDefinition>("ParentDocument");

export const ParentDocumentPothosObject = ParentDocumentRef.implement({
  fields: (t) => ({
    id: t.exposeString("id"),
    fileId: t.exposeString("fileId"),
    filePath: t.exposeString("filePath"),
    isProtected: t.exposeBoolean("isProtected"),
    usageType: t.exposeString("usageType"),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
  }),
});

gqlSchemaBuilder.queryField("parentDocuments", (t) =>
  t.field({
    type: [ParentDocumentRef],
    args: {
      parentId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      return ParentDocumentService.getParentDocuments(ctx.userId, args.parentId, ctx.locale);
    },
  })
);

gqlSchemaBuilder.mutationField("linkDocumentToParent", (t) =>
  t.field({
    type: ParentDocumentRef,
    args: {
      parentId: t.arg.string({ required: true }),
      fileId: t.arg.string({ required: true }),
      usageType: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const result = await ParentDocumentService.linkDocumentToParent(
        ctx.userId,
        args.parentId,
        args.fileId,
        args.usageType,
        ctx.locale
      );
      // Shape the result to match ParentDocument type
      return {
        id: result.id,
        fileId: result.fileId,
        filePath: "",        // filePath resolved on next query — linking returns minimal data
        isProtected: false,  // default for newly linked docs
        usageType: result.usageType,
        createdAt: result.createdAt,
      };
    },
  })
);
```

---

### Step 4: Update `backend/graphql/pothos/index.ts`

Add the three new module imports to the barrel file, matching the existing pattern:

```typescript
// Add these three lines alongside existing imports in index.ts:
export * from "./parent-profile.pothos";
export * from "./billing-history.pothos";
export * from "./parent-document.pothos";
```

---

### Step 5: Run schema generation and codegen

```bash
bun run generate:gqlSchema
bun codegen
```

Both commands must complete with 0 errors.

---

## Test Execution Requirements

```bash
bun run generate:gqlSchema
bun codegen
bun tsgo
```

---

## Success Criteria / Check Progress Points

- [ ] All 4 new Pothos object types expose `id` field.
- [ ] All resolvers delegate to service layer with `ctx.locale` and `ctx.userId` propagation.
- [ ] No DB/repo imports in any Pothos file.
- [ ] `parentProfile`, `parentAssociatedStudents`, `parentInvoiceHistory`, `parentDocuments` queries registered.
- [ ] `deactivateParent`, `updateStudentQuota`, `linkDocumentToParent` mutations registered.
- [ ] `bun run generate:gqlSchema` succeeds with 0 errors.
- [ ] `bun codegen` succeeds with 0 errors.

**Quality Gate — Per-File Validation:**
- [ ] `bun tsgo` passes with 0 TypeScript errors & 0 warnings after each file
- [ ] `bun biome:check` passes with 0 errors & 0 warnings after each file
- [ ] `bun lint` passes with 0 errors & 0 warnings after each file
- [ ] `bun codescene` passes with 0 errors & 0 warnings after each file

**Quality Gate — Task Completion Validation:**
- [ ] `bun tsgo` passes with 0 TypeScript errors & 0 warnings after completing all steps
- [ ] `bun biome:check` passes with 0 errors & 0 warnings after completing all steps
- [ ] `bun lint` passes with 0 errors & 0 warnings after completing all steps
- [ ] `bun codescene` passes with 0 errors & 0 warnings after completing all steps
