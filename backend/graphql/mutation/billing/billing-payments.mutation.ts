import { AppPermission } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  PaymentPothosObject,
  TeacherPaymentPothosObject,
} from "@/backend/graphql/pothos/billing/billing-payments.pothos";
import {
  resolveDisplayAmountFields,
  setBillingFxDisplayCurrencyForInvoiceParent,
} from "@/backend/graphql/pothos/billing/fx-display.pothos";
import { CurrencyCodePothosObject } from "@/backend/graphql/pothos/shared/enum.pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { PaymentMethodService, PermissionsService } from "@/backend/services";

gqlSchemaBuilder.mutationField("recordPayment", t =>
  t.field({
    type: PaymentPothosObject,
    authScopes: { loggedIn: true },
    args: {
      invoiceId: t.arg.id({ required: true }),
      amount: t.arg.string({ required: true }),
      currency: t.arg({ type: CurrencyCodePothosObject, required: true }),
      userPaymentMethodId: t.arg.id({ required: true }),
      transactionId: t.arg.string({ required: false }),
    },
    resolve: async (_root, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      const hasPermission = await PermissionsService.hasPermission(
        actorUserId,
        AppPermission.BILLING_UPDATE_STATUS_PAID
      );
      if (!hasPermission) {
        const tErrors = ctx.t().errorsTranslations;
        throw new Error(tErrors.insufficientPermissions);
      }

      const tErrors = ctx.t().errorsTranslations;
      const payment = await PaymentMethodService.recordPayin(
        {
          invoiceId: args.invoiceId,
          amount: args.amount,
          currency: args.currency,
          paymentDate: new Date(),
          userPaymentMethodId: args.userPaymentMethodId,
          transactionId: args.transactionId ?? null,
          gatewayResponse: null,
          exchangeRateSnapshot: null,
          exchangeRateSource: null,
          idempotencyKey: `payin:${args.invoiceId}:${args.userPaymentMethodId}:${Date.now()}`,
        },
        tErrors
      );

      await setBillingFxDisplayCurrencyForInvoiceParent(ctx, args.invoiceId, actorUserId);
      const displayAmounts = await resolveDisplayAmountFields([payment], ctx, "amount", "currency");
      return {
        ...payment,
        displayAmount: displayAmounts.get(payment.id) ?? null,
      };
    },
  })
);

gqlSchemaBuilder.mutationField("createTeacherPayment", t =>
  t.field({
    type: TeacherPaymentPothosObject,
    authScopes: { superAdmin: true, notImpersonating: true },
    args: {
      teacherId: t.arg.id({ required: true }),
      amount: t.arg.string({ required: true }),
      currency: t.arg({ type: CurrencyCodePothosObject, required: true }),
      userPaymentMethodId: t.arg.id({ required: true }),
      paymentDate: t.arg.string({ required: false }),
      isTestPayment: t.arg.boolean({ required: false }),
    },
    resolve: async (_root, args, ctx) => {
      await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;
      const payment = await PaymentMethodService.recordPayout(
        {
          teacherId: args.teacherId,
          amount: args.amount,
          currency: args.currency,
          paymentDate: args.paymentDate ? new Date(args.paymentDate) : new Date(),
          userPaymentMethodId: args.userPaymentMethodId,
          isTestPayment: args.isTestPayment ?? false,
        },
        tErrors
      );

      const displayAmounts = await resolveDisplayAmountFields([payment], ctx, "amount", "currency");
      return {
        ...payment,
        displayAmount: displayAmounts.get(payment.id) ?? null,
      };
    },
  })
);
