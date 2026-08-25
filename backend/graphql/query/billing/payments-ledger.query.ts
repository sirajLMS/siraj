// Auto-extracted from pothos/ (types-review R3-P3).
// Query field registrations relocated to the query layer per query/AGENTS.md.

import { AppPermission } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { PaymentLedgerEntryPothosObject } from "@/backend/graphql/pothos/billing/payments-ledger.pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { PaymentsLedgerService } from "@/backend/services";

gqlSchemaBuilder.queryField("myPaymentsLedger", t =>
  t.field({
    type: [PaymentLedgerEntryPothosObject],
    authScopes: { permission: AppPermission.PAYMENTS_LEDGER_VIEW },
    description: "Returns the authenticated user's payment ledger (parent sees all children; student sees own).",
    resolve: async (_root, _args, ctx) => {
      const userId = await requireAuth(ctx);
      const result = await PaymentsLedgerService.getMyPaymentsLedger(userId, ctx.locale);
      return result.entries;
    },
  })
);
