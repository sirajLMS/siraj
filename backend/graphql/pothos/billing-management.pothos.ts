import { BillingManagementService } from "@/backend/services/billing/billing-management.service";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";

// ─── ManualInvoiceResult Object ──────────────────────────────────────────────

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

const ManualInvoiceResultRef = gqlSchemaBuilder.objectRef<ManualInvoiceResultDefinition>("ManualInvoiceResult");

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

// ─── MarkInvoicePaidResult Object ────────────────────────────────────────────

export type MarkInvoicePaidResultDefinition = {
  id: string;
  parentId: string;
  status: string;
  paidDate: string | null;
  version: number;
  notificationSummaryUpdated: boolean;
};

const MarkInvoicePaidResultRef = gqlSchemaBuilder.objectRef<MarkInvoicePaidResultDefinition>("MarkInvoicePaidResult");

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

// ─── DeleteInvoiceResult Object ──────────────────────────────────────────────

export type DeleteInvoiceResultDefinition = {
  id: string;
  parentId: string;
  deletedAt: string | null;
  version: number;
  notificationSummaryUpdated: boolean;
};

const DeleteInvoiceResultRef = gqlSchemaBuilder.objectRef<DeleteInvoiceResultDefinition>("DeleteInvoiceResult");

export const DeleteInvoiceResultPothosObject = DeleteInvoiceResultRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    parentId: t.exposeString("parentId"),
    deletedAt: t.exposeString("deletedAt", { nullable: true }),
    version: t.exposeInt("version"),
    notificationSummaryUpdated: t.exposeBoolean("notificationSummaryUpdated"),
  }),
});

// ─── Mutations ───────────────────────────────────────────────────────────────

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
      return BillingManagementService.createManualInvoice(
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
      const result = await BillingManagementService.deleteInvoice(ctx.user?.id || "", args.invoiceId, ctx.locale);
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
