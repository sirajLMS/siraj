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

gqlSchemaBuilder.mutationField("createUserPaymentMethod", t =>
  t.field({
    type: UserPaymentMethodPothosObject,
    authScopes: { loggedIn: true },
    args: {
      input: t.arg({ type: UserPaymentMethodCreateInputPothos, required: true }),
    },
    resolve: async (_parent, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
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
        ctx.locale
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
      return PaymentMethodService.updateUserPaymentMethod(
        actorUserId,
        args.id,
        {
          ...(args.input.direction != null ? { direction: args.input.direction } : {}),
          ...(args.input.isDefault != null ? { isDefault: args.input.isDefault } : {}),
          ...(args.input.label !== undefined ? { label: args.input.label } : {}),
          ...(args.input.details != null ? { details: normalizePaymentMethodDetailsInput(args.input.details) } : {}),
        },
        ctx.locale
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
      await PaymentMethodService.deleteUserPaymentMethod(actorUserId, args.id, ctx.locale);
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
      return PaymentMethodService.setDefaultUserPaymentMethod(actorUserId, args.id, ctx.locale);
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
      return PaymentMethodService.verifyBankTransferPaymentMethod(actorUserId, args.id, ctx.locale);
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
      const actorUserId = await requireAuth(ctx);
      return PaymentCatalogService.createMobileWallet(
        actorUserId,
        args.input as SupportedMobileWalletSubmitInput,
        ctx.locale
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
      const actorUserId = await requireAuth(ctx);
      return PaymentCatalogService.updateMobileWallet(
        actorUserId,
        args.id,
        args.input as UpdateSupportedMobileWalletInput,
        ctx.locale
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
      const actorUserId = await requireAuth(ctx);
      return PaymentCatalogService.deactivateMobileWallet(actorUserId, args.id, ctx.locale);
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
      const actorUserId = await requireAuth(ctx);
      return PaymentCatalogService.createPaymentLink(
        actorUserId,
        args.input as SupportedPaymentLinkSubmitInput,
        ctx.locale
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
      const actorUserId = await requireAuth(ctx);
      return PaymentCatalogService.updatePaymentLink(
        actorUserId,
        args.id,
        args.input as UpdateSupportedPaymentLinkInput,
        ctx.locale
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
      const actorUserId = await requireAuth(ctx);
      return PaymentCatalogService.deactivatePaymentLink(actorUserId, args.id, ctx.locale);
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
      const actorUserId = await requireAuth(ctx);
      return PaymentCatalogService.createOnlineAccount(
        actorUserId,
        args.input as SupportedOnlineAccountSubmitInput,
        ctx.locale
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
      const actorUserId = await requireAuth(ctx);
      return PaymentCatalogService.updateOnlineAccount(
        actorUserId,
        args.id,
        args.input as UpdateSupportedOnlineAccountInput,
        ctx.locale
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
      const actorUserId = await requireAuth(ctx);
      return PaymentCatalogService.deactivateOnlineAccount(actorUserId, args.id, ctx.locale);
    },
  })
);
