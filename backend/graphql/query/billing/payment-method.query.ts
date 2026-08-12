import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  SupportedMobileWalletPothosObject,
  SupportedOnlineAccountPothosObject,
  SupportedPaymentLinkPothosObject,
  UserPaymentMethodPothosObject,
} from "@/backend/graphql/pothos/billing/payment-method.pothos";
import { CountryCodePothosObject, PaymentDirectionPothosEnum } from "@/backend/graphql/pothos/shared/enum.pothos";
import {
  supportedListArgs,
  supportedListResolve,
} from "@/backend/graphql/query/billing/__shared__/makeSupportedPaymentListQueryField";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { PaymentCatalogService } from "@/backend/services/payment-method/payment-catalog.service";
import { PaymentMethodService } from "@/backend/services/payment-method/payment-method.service";

gqlSchemaBuilder.queryField("userPaymentMethods", t =>
  t.field({
    type: [UserPaymentMethodPothosObject],
    authScopes: { loggedIn: true },
    args: {
      userId: t.arg.id({ required: true }),
      direction: t.arg({ type: PaymentDirectionPothosEnum, required: false }),
    },
    resolve: async (_parent, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      return PaymentMethodService.listUserPaymentMethods(
        actorUserId,
        args.userId,
        args.direction ?? undefined,
        ctx.locale
      );
    },
  })
);

gqlSchemaBuilder.queryField("userPaymentMethod", t =>
  t.field({
    type: UserPaymentMethodPothosObject,
    authScopes: { loggedIn: true },
    nullable: true,
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (_parent, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      return PaymentMethodService.getUserPaymentMethod(actorUserId, args.id, ctx.locale);
    },
  })
);

gqlSchemaBuilder.queryField("supportedMobileWallets", t =>
  t.field({
    type: [SupportedMobileWalletPothosObject],
    authScopes: { loggedIn: true },
    args: {
      countryCode: t.arg({ type: CountryCodePothosObject, required: false }),
      ...supportedListArgs(t),
    },
    resolve: async (_parent, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;
      return PaymentCatalogService.listMobileWallets(actorUserId, tErrors, {
        countryCode: args.countryCode ?? undefined,
        direction: args.direction ?? undefined,
        activeOnly: args.activeOnly ?? true,
      });
    },
  })
);

gqlSchemaBuilder.queryField("supportedPaymentLinks", t =>
  t.field({
    type: [SupportedPaymentLinkPothosObject],
    authScopes: { loggedIn: true },
    args: supportedListArgs(t),
    resolve: supportedListResolve((actorUserId, tErrors, filters) =>
      PaymentCatalogService.listPaymentLinks(actorUserId, tErrors, filters)
    ),
  })
);

gqlSchemaBuilder.queryField("supportedOnlineAccounts", t =>
  t.field({
    type: [SupportedOnlineAccountPothosObject],
    authScopes: { loggedIn: true },
    args: supportedListArgs(t),
    resolve: supportedListResolve((actorUserId, tErrors, filters) =>
      PaymentCatalogService.listOnlineAccounts(actorUserId, tErrors, filters)
    ),
  })
);
