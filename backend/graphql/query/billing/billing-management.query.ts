// Auto-extracted from pothos/ (types-review R3-P3).
// Query field registrations relocated to the query layer per query/AGENTS.md.

import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { InvoicePaymentSubmissionRef } from "@/backend/graphql/pothos/billing/billing-management.pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { BillingManagementService, setBillingFxDisplayCurrencyForInvoiceParent } from "@/backend/services";

gqlSchemaBuilder.queryField("invoicePaymentSubmission", t =>
  t.field({
    type: InvoicePaymentSubmissionRef,
    nullable: true,
    authScopes: { loggedIn: true },
    args: {
      invoiceId: t.arg.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
    },
    resolve: async (_root, args, ctx) => {
      const userId = await requireAuth(ctx);
      await setBillingFxDisplayCurrencyForInvoiceParent(ctx, args.invoiceId, userId);
      const tErrors = ctx.t().errorsTranslations;
      return BillingManagementService.getInvoicePaymentSubmission(userId, args.invoiceId, tErrors);
    },
  })
);
