import type { BaseContext } from "@/backend/graphql/gqlContext";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  normalizePaymentMethodDetailsInput,
  SupportedMobileWalletCreateInputPothos,
  SupportedMobileWalletPothosObject,
  SupportedMobileWalletUpdateInputPothos,
  SupportedOnlineAccountCreateInputPothos,
  SupportedOnlineAccountPothosObject,
  SupportedOnlineAccountUpdateInputPothos,
  SupportedPaymentLinkCreateInputPothos,
  SupportedPaymentLinkPothosObject,
  SupportedPaymentLinkUpdateInputPothos,
  UserPaymentMethodCreateInputPothos,
  UserPaymentMethodPothosObject,
  UserPaymentMethodUpdateInputPothos,
} from "@/backend/graphql/pothos/billing/payment-method.pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { PaymentCatalogService } from "@/backend/services/payment-method/payment-catalog.service";
import { PaymentMethodService } from "@/backend/services/payment-method/payment-method.service";
import type {
  SupportedMobileWalletSubmitInput,
  SupportedOnlineAccountSubmitInput,
  SupportedPaymentLinkSubmitInput,
  UpdateSupportedMobileWalletInput,
  UpdateSupportedOnlineAccountInput,
  UpdateSupportedPaymentLinkInput,
} from "@/backend/types/billing/payment-method.types";

type ErrorsTranslations = ReturnType<BaseContext["t"]>["errorsTranslations"];

async function resolveAuthCtx(ctx: BaseContext): Promise<{ actorUserId: string; tErrors: ErrorsTranslations }> {
  const actorUserId = await requireAuth(ctx);
  const tErrors = ctx.t().errorsTranslations;
  return { actorUserId, tErrors };
}

gqlSchemaBuilder.mutationField("createUserPaymentMethod", t =>
  t.field({
    type: UserPaymentMethodPothosObject,
    authScopes: { loggedIn: true },
    args: {
      input: t.arg({ type: UserPaymentMethodCreateInputPothos, required: true }),
    },
    resolve: async (_parent, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;
      return PaymentMethodService.createUserPaymentMethod(
        actorUserId,
        {
          userId: args.input.userId,
          type: args.input.type,
          direction: args.input.direction,
          isDefault: args.input.isDefault ?? false,
          label: args.input.label,
          details: normalizePaymentMethodDetailsInput(args.input.details),
        },
        tErrors
      );
    },
  })
);

gqlSchemaBuilder.mutationField("updateUserPaymentMethod", t =>
  t.field({
    type: UserPaymentMethodPothosObject,
    authScopes: { loggedIn: true },
    args: {
      id: t.arg.id({ required: true }),
      input: t.arg({ type: UserPaymentMethodUpdateInputPothos, required: true }),
    },
    resolve: async (_parent, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;
      return PaymentMethodService.updateUserPaymentMethod(
        actorUserId,
        args.id,
        {
          ...(args.input.direction != null ? { direction: args.input.direction } : {}),
          ...(args.input.isDefault == null ? {} : { isDefault: args.input.isDefault }),
          ...(args.input.label !== undefined ? { label: args.input.label } : {}),
          ...(args.input.details != null ? { details: normalizePaymentMethodDetailsInput(args.input.details) } : {}),
        },
        tErrors
      );
    },
  })
);

gqlSchemaBuilder.mutationField("deleteUserPaymentMethod", t =>
  t.field({
    type: "Boolean",
    authScopes: { loggedIn: true },
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (_parent, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;
      await PaymentMethodService.deleteUserPaymentMethod(actorUserId, args.id, tErrors);
      return true;
    },
  })
);

gqlSchemaBuilder.mutationField("setDefaultUserPaymentMethod", t =>
  t.field({
    type: UserPaymentMethodPothosObject,
    authScopes: { loggedIn: true },
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (_parent, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;
      return PaymentMethodService.setDefaultUserPaymentMethod(actorUserId, args.id, tErrors);
    },
  })
);

gqlSchemaBuilder.mutationField("verifyBankTransferPaymentMethod", t =>
  t.field({
    type: UserPaymentMethodPothosObject,
    authScopes: { loggedIn: true },
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (_parent, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;
      return PaymentMethodService.verifyBankTransferPaymentMethod(actorUserId, args.id, tErrors);
    },
  })
);

gqlSchemaBuilder.mutationField("createSupportedMobileWallet", t =>
  t.field({
    type: SupportedMobileWalletPothosObject,
    authScopes: { loggedIn: true },
    args: {
      input: t.arg({ type: SupportedMobileWalletCreateInputPothos, required: true }),
    },
    resolve: async (_parent, args, ctx) => {
      const { actorUserId, tErrors } = await resolveAuthCtx(ctx);
      return PaymentCatalogService.createMobileWallet(
        actorUserId,
        args.input as SupportedMobileWalletSubmitInput,
        tErrors
      );
    },
  })
);

gqlSchemaBuilder.mutationField("updateSupportedMobileWallet", t =>
  t.field({
    type: SupportedMobileWalletPothosObject,
    authScopes: { loggedIn: true },
    args: {
      id: t.arg.id({ required: true }),
      input: t.arg({ type: SupportedMobileWalletUpdateInputPothos, required: true }),
    },
    resolve: async (_parent, args, ctx) => {
      const { actorUserId, tErrors } = await resolveAuthCtx(ctx);
      return PaymentCatalogService.updateMobileWallet(
        actorUserId,
        args.id,
        args.input as UpdateSupportedMobileWalletInput,
        tErrors
      );
    },
  })
);

gqlSchemaBuilder.mutationField("deactivateSupportedMobileWallet", t =>
  t.field({
    type: SupportedMobileWalletPothosObject,
    authScopes: { loggedIn: true },
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (_parent, args, ctx) => {
      const { actorUserId, tErrors } = await resolveAuthCtx(ctx);
      return PaymentCatalogService.deactivateMobileWallet(actorUserId, args.id, tErrors);
    },
  })
);

gqlSchemaBuilder.mutationField("createSupportedPaymentLink", t =>
  t.field({
    type: SupportedPaymentLinkPothosObject,
    authScopes: { loggedIn: true },
    args: {
      input: t.arg({ type: SupportedPaymentLinkCreateInputPothos, required: true }),
    },
    resolve: async (_parent, args, ctx) => {
      const { actorUserId, tErrors } = await resolveAuthCtx(ctx);
      return PaymentCatalogService.createPaymentLink(
        actorUserId,
        args.input as SupportedPaymentLinkSubmitInput,
        tErrors
      );
    },
  })
);

gqlSchemaBuilder.mutationField("updateSupportedPaymentLink", t =>
  t.field({
    type: SupportedPaymentLinkPothosObject,
    authScopes: { loggedIn: true },
    args: {
      id: t.arg.id({ required: true }),
      input: t.arg({ type: SupportedPaymentLinkUpdateInputPothos, required: true }),
    },
    resolve: async (_parent, args, ctx) => {
      const { actorUserId, tErrors } = await resolveAuthCtx(ctx);
      return PaymentCatalogService.updatePaymentLink(
        actorUserId,
        args.id,
        args.input as UpdateSupportedPaymentLinkInput,
        tErrors
      );
    },
  })
);

gqlSchemaBuilder.mutationField("deactivateSupportedPaymentLink", t =>
  t.field({
    type: SupportedPaymentLinkPothosObject,
    authScopes: { loggedIn: true },
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (_parent, args, ctx) => {
      const { actorUserId, tErrors } = await resolveAuthCtx(ctx);
      return PaymentCatalogService.deactivatePaymentLink(actorUserId, args.id, tErrors);
    },
  })
);

gqlSchemaBuilder.mutationField("createSupportedOnlineAccount", t =>
  t.field({
    type: SupportedOnlineAccountPothosObject,
    authScopes: { loggedIn: true },
    args: {
      input: t.arg({ type: SupportedOnlineAccountCreateInputPothos, required: true }),
    },
    resolve: async (_parent, args, ctx) => {
      const { actorUserId, tErrors } = await resolveAuthCtx(ctx);
      return PaymentCatalogService.createOnlineAccount(
        actorUserId,
        args.input as SupportedOnlineAccountSubmitInput,
        tErrors
      );
    },
  })
);

gqlSchemaBuilder.mutationField("updateSupportedOnlineAccount", t =>
  t.field({
    type: SupportedOnlineAccountPothosObject,
    authScopes: { loggedIn: true },
    args: {
      id: t.arg.id({ required: true }),
      input: t.arg({ type: SupportedOnlineAccountUpdateInputPothos, required: true }),
    },
    resolve: async (_parent, args, ctx) => {
      const { actorUserId, tErrors } = await resolveAuthCtx(ctx);
      return PaymentCatalogService.updateOnlineAccount(
        actorUserId,
        args.id,
        args.input as UpdateSupportedOnlineAccountInput,
        tErrors
      );
    },
  })
);

gqlSchemaBuilder.mutationField("deactivateSupportedOnlineAccount", t =>
  t.field({
    type: SupportedOnlineAccountPothosObject,
    authScopes: { loggedIn: true },
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (_parent, args, ctx) => {
      const { actorUserId, tErrors } = await resolveAuthCtx(ctx);
      return PaymentCatalogService.deactivateOnlineAccount(actorUserId, args.id, tErrors);
    },
  })
);
