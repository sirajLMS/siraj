import { AppPermission } from "@/backend/enum";
import type { BaseContext } from "@/backend/graphql/gqlContext";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { mapQuotaErrorToGraphQLError } from "@/backend/graphql/mutation/billing/quota.mutation";
import {
  AccountingPaymentInput,
  AccountingPaymentPothosObject,
  AccountingPaymentTogglePaidInputObject,
  AccountingPaymentUpdateInputObject,
  PackagePlanInput,
  PackagePlanPothosObject,
  PackagePlanUpdateInputType,
} from "@/backend/graphql/pothos/billing/accounting.pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { NotFoundError } from "@/backend/lib/errors";
import { AccountingPaymentService, PackagePlanService, requirePermission } from "@/backend/services";
import type {
  AccountingPaymentSubmitInput,
  AccountingPaymentTogglePaidInput,
  AccountingPaymentUpdateInput,
  PackagePlanSubmitInput,
  PackagePlanUpdateInput,
} from "@/backend/types";
import { currencyOf, gatewayOf, isSharedCurrency, isSharedGateway } from "@/shared/constants/enum-guards";
import type { ErrorsLabels } from "@/shared/locale";

/**
 * Field-by-field normalizers bridging Pothos-generated input objects (whose
 * optional fields may carry explicit nulls) onto the canonical service input
 * shapes — mirrors the meeting.mutation normalize* convention.
 */
type PackagePlanInputShape = {
  readonly codename?: string | null;
  readonly displayName?: string | null;
  readonly description?: string | null;
  readonly creditHours?: number | null;
  readonly priceAmount?: number | null;
  readonly currency?: string | null;
  readonly active?: boolean | null;
  readonly sortOrder?: number | null;
  readonly metadata?: Record<string, unknown> | null;
};

type PackagePlanUpdateShape = {
  readonly id?: string | null;
  readonly displayName?: string | null;
  readonly description?: string | null;
  readonly creditHours?: number | null;
  readonly priceAmount?: number | null;
  readonly currency?: string | null;
  readonly active?: boolean | null;
  readonly sortOrder?: number | null;
  readonly version?: number | null;
};

type AccountingPaymentUpdateShape = {
  readonly id: string;
  readonly paymentGateway?: string | null;
  readonly paymentNote?: string | null;
  readonly creditHours?: number | null;
  readonly expectedInvoiceVersion?: number | null;
};

type AccountingPaymentTogglePaidShape = {
  readonly id: string;
  readonly isPaidStatusOn: boolean;
  readonly expectedInvoiceVersion?: number | null;
};

function requireString(value: string | null | undefined, message: string): string {
  if (value == null || value === "") {
    throw new Error(message);
  }
  return value;
}

function normalizePackagePlanSubmit(input: PackagePlanInputShape): PackagePlanSubmitInput {
  return {
    codename: requireString(input.codename ?? "", "codename required"),
    displayName: requireString(input.displayName ?? "", "displayName required"),
    description: input.description ?? null,
    creditHours: input.creditHours ?? 0,
    priceAmount: input.priceAmount ?? 0,
    currency: currencyOf(input.currency),
    active: input.active ?? true,
    sortOrder: input.sortOrder ?? 0,
    metadata: input.metadata ?? null,
  };
}

function normalizePackagePlanUpdate(input: PackagePlanUpdateShape): PackagePlanUpdateInput {
  const patch: PackagePlanUpdateInput = { id: requireString(input.id ?? "", "id required") };
  if (input.displayName != null) patch.displayName = input.displayName;
  if (input.description !== undefined && input.description !== null) patch.description = input.description;
  if (typeof input.creditHours === "number") patch.creditHours = input.creditHours;
  if (typeof input.priceAmount === "number") patch.priceAmount = input.priceAmount;
  const currencyRaw = input.currency ?? null;
  if (currencyRaw != null && isSharedCurrency(currencyRaw)) patch.currency = currencyRaw;
  if (input.active != null) patch.active = input.active;
  if (input.sortOrder != null) patch.sortOrder = input.sortOrder;
  if (input.version != null) patch.version = input.version;
  return patch;
}

function normalizeAccountingPaymentSubmit(input: AccountingPaymentSubmitInput): AccountingPaymentSubmitInput {
  return {
    studentId: input.studentId,
    packagePlanId: input.packagePlanId ?? null,
    creditHours: input.creditHours,
    amount: input.amount,
    currency: currencyOf(input.currency),
    paymentGateway: gatewayOf(input.paymentGateway),
    paymentDate: new Date(input.paymentDate),
    isPaidStatusOn: input.isPaidStatusOn ?? true,
    paymentNote: input.paymentNote ?? null,
  };
}

function normalizeAccountingPaymentUpdate(input: AccountingPaymentUpdateShape): AccountingPaymentUpdateInput {
  const payload: AccountingPaymentUpdateInput = {
    id: input.id,
    expectedInvoiceVersion: input.expectedInvoiceVersion ?? undefined,
  };
  const gatewayRaw = input.paymentGateway ?? null;
  if (gatewayRaw != null && isSharedGateway(gatewayRaw)) payload.paymentGateway = gatewayRaw;
  if (input.paymentNote !== undefined && input.paymentNote !== null) payload.paymentNote = input.paymentNote;
  if (typeof input.creditHours === "number") payload.creditHours = input.creditHours;
  return payload;
}

function normalizeTogglePaid(input: AccountingPaymentTogglePaidShape): AccountingPaymentTogglePaidInput {
  return {
    id: input.id,
    isPaidStatusOn: input.isPaidStatusOn,
    expectedInvoiceVersion: input.expectedInvoiceVersion ?? undefined,
  };
}

async function executeAccountingMutation<T>(
  ctx: BaseContext,
  action: (actorUserId: string, tErrors: ErrorsLabels) => Promise<T>
): Promise<T> {
  const actorUserId = await requireAuth(ctx);
  const tErrors = ctx.t().errorsTranslations;
  await requirePermission(actorUserId, AppPermission.ACCOUNTING_PAYMENTS_MANAGE, tErrors);
  try {
    return await action(actorUserId, tErrors);
  } catch (error) {
    throw mapQuotaErrorToGraphQLError(error);
  }
}

gqlSchemaBuilder.mutationField("createPackagePlan", t =>
  t.field({
    type: PackagePlanPothosObject,
    description: "Create a credit-hour package plan",
    authScopes: { $all: { loggedIn: true, notImpersonating: true } },
    args: { input: t.arg({ type: PackagePlanInput, required: true }) },
    resolve: (_root, args, ctx) =>
      executeAccountingMutation(ctx, (actorUserId, tErrors) =>
        PackagePlanService.create(actorUserId, normalizePackagePlanSubmit(args.input), tErrors)
      ),
  })
);

gqlSchemaBuilder.mutationField("updatePackagePlan", t =>
  t.field({
    type: PackagePlanPothosObject,
    description: "Update a credit-hour package plan (snapshot-invariant)",
    authScopes: { $all: { loggedIn: true, notImpersonating: true } },
    args: { input: t.arg({ type: PackagePlanUpdateInputType, required: true }) },
    resolve: (_root, args, ctx) =>
      executeAccountingMutation(ctx, (actorUserId, tErrors) =>
        PackagePlanService.update(actorUserId, normalizePackagePlanUpdate(args.input), tErrors)
      ),
  })
);

gqlSchemaBuilder.mutationField("archivePackagePlan", t =>
  t.field({
    type: PackagePlanPothosObject,
    description: "Soft-archive a package plan (hidden from catalogs, history intact)",
    authScopes: { $all: { loggedIn: true, notImpersonating: true } },
    args: { id: t.arg.id({ required: true }) },
    resolve: (_root, args, ctx) =>
      executeAccountingMutation(ctx, async (actorUserId, tErrors) => {
        await PackagePlanService.archive(actorUserId, args.id, tErrors);
        const plan = await PackagePlanService.getById(args.id);
        if (!plan) throw new NotFoundError("PACKAGE_PLAN", tErrors.notFound);
        return plan;
      }),
  })
);

gqlSchemaBuilder.mutationField("recordAccountingPayment", t =>
  t.field({
    type: AccountingPaymentPothosObject,
    description: "Record an accounting payment that credits hours to a student",
    authScopes: { $all: { loggedIn: true, notImpersonating: true } },
    args: { input: t.arg({ type: AccountingPaymentInput, required: true }) },
    resolve: (_root, args, ctx) =>
      executeAccountingMutation(ctx, (actorUserId, tErrors) =>
        AccountingPaymentService.recordPayment(actorUserId, normalizeAccountingPaymentSubmit(args.input), tErrors)
      ),
  })
);

gqlSchemaBuilder.mutationField("updateAccountingPayment", t =>
  t.field({
    type: AccountingPaymentPothosObject,
    description: "Edit an accounting payment (gateway/note-only or creditHours delta)",
    authScopes: { $all: { loggedIn: true, notImpersonating: true } },
    args: { input: t.arg({ type: AccountingPaymentUpdateInputObject, required: true }) },
    resolve: (_root, args, ctx) =>
      executeAccountingMutation(ctx, (actorUserId, tErrors) =>
        AccountingPaymentService.update(actorUserId, normalizeAccountingPaymentUpdate(args.input), tErrors)
      ),
  })
);

gqlSchemaBuilder.mutationField("toggleAccountingPaymentPaidStatus", t =>
  t.field({
    type: AccountingPaymentPothosObject,
    description: "Toggle the Paid status on an accounting payment (cascades to invoice)",
    authScopes: { $all: { loggedIn: true, notImpersonating: true } },
    args: { input: t.arg({ type: AccountingPaymentTogglePaidInputObject, required: true }) },
    resolve: (_root, args, ctx) =>
      executeAccountingMutation(ctx, (actorUserId, tErrors) =>
        AccountingPaymentService.togglePaidStatus(actorUserId, normalizeTogglePaid(args.input), tErrors)
      ),
  })
);
