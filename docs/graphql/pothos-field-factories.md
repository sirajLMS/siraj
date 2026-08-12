# Pothos Field Factory Pattern

## Overview

When multiple Pothos object types or input types share identical field definitions, extract the shared fields into a `__shared__/` helper module. This eliminates duplication while preserving Pothos type safety.

## When to Use

- Two Pothos **object types** expose the same set of fields (e.g., `StudentPayment` and `TeacherPayment` both expose `amount`, `currency`, `paymentDate`, etc.)
- Two Pothos **input types** share the same fields with different `required` flags (e.g., `CreateInput` requires `name`, `UpdateInput` makes it optional)
- Two **query fields** share the same args + resolve structure, differing only in the entity type or service function

## Object Field Helpers

### Pattern

```typescript
// backend/graphql/pothos/billing/__shared__/paymentFieldHelpers.ts
import type { ObjectFieldBuilder } from "@pothos/core";
import type { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";

type BuilderTypes = typeof gqlSchemaBuilder extends { $inferSchemaTypes: infer T } ? T : never;

export function paymentFields(t: ObjectFieldBuilder<BuilderTypes, PaymentReturnType>) {
  return {
    amount: t.exposeString("amount"),
    currency: t.expose("currency", { type: CurrencyCodePothosObject }),
    paymentDate: t.exposeString("paymentDate"),
    // ...8 shared fields
  };
}
```

### Usage

```typescript
// backend/graphql/pothos/billing/billing-payments.pothos.ts
export const PaymentPothosObject = PaymentRef.implement({
  fields: t => ({
    ...paymentFields(t),
    // type-specific fields remain inline:
    invoiceId: t.exposeString("invoiceId", { nullable: true }),
  }),
});
```

## Input Field Helpers

### Pattern

```typescript
// backend/graphql/pothos/classes/__shared__/classSubjectFieldHelpers.ts
import type { InputFieldBuilder } from "@pothos/core";

export function classSubjectInputFields(
  t: InputFieldBuilder<BuilderTypes, "InputObject">,
  required: { name: boolean; slug: boolean; categoryId: boolean }
) {
  return {
    name: t.string({ required: required.name }),
    slug: t.string({ required: required.slug }),
    categoryId: t.string({ required: required.categoryId }),
    description: t.string({ required: false }),
    // ...always-optional fields
  };
}
```

### Usage

```typescript
export const ClassSubjectCreateInputPothos = gqlSchemaBuilder.inputType("ClassSubjectCreateInput", {
  fields: t => classSubjectInputFields(t, { name: true, slug: true, categoryId: true }),
});

export const ClassSubjectUpdateInputPothos = gqlSchemaBuilder.inputType("ClassSubjectUpdateInput", {
  fields: t => classSubjectInputFields(t, { name: false, slug: false, categoryId: false }),
});
```

## Query Field Factories

### Pattern

When two query fields share the same args structure and resolver pattern, extract a factory:

```typescript
// backend/graphql/query/reports/__shared__/makeMonthlyReportQueryField.ts
export function makeTeacherMonthlyReportQueryField(opts: Opts<TeacherMonthlyReportReturnType>) {
  return gqlSchemaBuilder.queryField(opts.fieldName, t =>
    t.field({
      type: opts.returnType,
      args: { month: t.arg({ type: MonthInputPothos, required: true }) },
      resolve: async (_parent, args, ctx) => {
        const userId = assertAuthenticated(ctx);
        return opts.getReport(userId, args.month);
      },
    })
  );
}
```

### Important: Pothos Generic Limitation

Pothos's `Resolver<Parent, Args, Context, Type, Return>` type uses a conditional that TypeScript cannot evaluate when `Type` is a generic parameter. **Do NOT** write a fully generic `makeQueryField<R>()` — tsgo will reject it. Instead, create **concrete specializations** (one per entity type) or use helper-only functions (`sharedArgs(t)` + `sharedResolve(svcFn)`).

## Existing Helpers

| Helper | Location | Used By |
|--------|----------|---------|
| `paymentFields` | `backend/graphql/pothos/billing/__shared__/paymentFieldHelpers.ts` | `StudentPayment`, `TeacherPayment` |
| `creditTransactionFields` | `backend/graphql/pothos/billing/__shared__/creditFieldHelpers.ts` | `CreditTransaction`, `CreditPurchaseResult` |
| `classSubjectInputFields` | `backend/graphql/pothos/classes/__shared__/classSubjectFieldHelpers.ts` | `ClassSubjectCreateInput`, `ClassSubjectUpdateInput` |
| `teacherNoteInputFields` | `backend/graphql/pothos/teachers/__shared__/teacherNoteFieldHelpers.ts` | `CreateTeacherNoteInput`, `UpdateTeacherNoteInput` |
| `whatsappAccountSharedInputFields` | `backend/graphql/pothos/whatsapp/__shared__/whatsappAccountFieldHelpers.ts` | `WhatsappAccountCreateInput`, `WhatsappAccountUpdateInput` |
| `supportedListArgs` / `supportedListResolve` | `backend/graphql/query/billing/__shared__/makeSupportedPaymentListQueryField.ts` | `supportedPaymentLinks`, `supportedOnlineAccounts`, `supportedMobileWallets` |
| `makeTeacherMonthlyReportQueryField` / `makeStudentMonthlyReportQueryField` | `backend/graphql/query/reports/__shared__/makeMonthlyReportQueryField.ts` | `teacherMonthlyReport`, `studentMonthlyReport` |
| `resolveStudentIdFromArgsOrUser` | `backend/graphql/query/students/__shared__/resolveStudentIdFromArgsOrUser.ts` | `studentClassHistory`, `studentProfile` |
