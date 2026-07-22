import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  SupportedMobileWalletPothosObject,
  SupportedOnlineAccountPothosObject,
  SupportedPaymentLinkPothosObject,
  UserPaymentMethodPothosObject,
} from "@/backend/graphql/pothos/billing/payment-method.pothos";
import { CountryCodePothosObject, PaymentDirectionPothosEnum } from "@/backend/graphql/pothos/shared/enum.pothos";
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
      direction: t.arg({ type: PaymentDirectionPothosEnum, required: false }),
      activeOnly: t.arg.boolean({ required: false, defaultValue: true }),
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
    args: {
      direction: t.arg({ type: PaymentDirectionPothosEnum, required: false }),
      activeOnly: t.arg.boolean({ required: false, defaultValue: true }),
    },
    resolve: async (_parent, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;
      return PaymentCatalogService.listPaymentLinks(actorUserId, tErrors, {
        direction: args.direction ?? undefined,
        activeOnly: args.activeOnly ?? true,
      });
    },
  })
);

gqlSchemaBuilder.queryField("supportedOnlineAccounts", t =>
  t.field({
    type: [SupportedOnlineAccountPothosObject],
    authScopes: { loggedIn: true },
    args: {
      direction: t.arg({ type: PaymentDirectionPothosEnum, required: false }),
      activeOnly: t.arg.boolean({ required: false, defaultValue: true }),
    },
    resolve: async (_parent, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;
      return PaymentCatalogService.listOnlineAccounts(actorUserId, tErrors, {
        direction: args.direction ?? undefined,
        activeOnly: args.activeOnly ?? true,
      });
    },
  })
);
