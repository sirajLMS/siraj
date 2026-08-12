import type { BaseContext } from "@/backend/graphql/gqlContext";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { makePaymentMethodIdMutationField } from "@/backend/graphql/mutation/billing/__shared__/makePaymentMethodListMutationField";
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

// Pothos input types are structurally compatible with the catalog submit-input
// types at runtime, but differ in optional/enum field shapes (e.g. `CountryCode`
// enum vs `string | null`). These guards replace unsafe `as` assertions with
// validated narrowing so the compiler can verify safety.
function isSupportedMobileWalletSubmitInput(value: unknown): value is SupportedMobileWalletSubmitInput {
  return typeof value === "object" && value !== null && "slug" in value && "name" in value;
}

function isUpdateSupportedMobileWalletInput(value: unknown): value is UpdateSupportedMobileWalletInput {
  return typeof value === "object" && value !== null;
}

function isSupportedPaymentLinkSubmitInput(value: unknown): value is SupportedPaymentLinkSubmitInput {
  return typeof value === "object" && value !== null && "slug" in value && "name" in value && "urlAllowlist" in value;
}

function isUpdateSupportedPaymentLinkInput(value: unknown): value is UpdateSupportedPaymentLinkInput {
  return typeof value === "object" && value !== null;
}

function isSupportedOnlineAccountSubmitInput(value: unknown): value is SupportedOnlineAccountSubmitInput {
  return typeof value === "object" && value !== null && "slug" in value && "name" in value && "identifierKind" in value;
}

function isUpdateSupportedOnlineAccountInput(value: unknown): value is UpdateSupportedOnlineAccountInput {
  return typeof value === "object" && value !== null;
}

/** Narrows `value` to `T` via `guard`, throwing when the shape does not match. */
function assertShape<T>(value: unknown, guard: (v: unknown) => v is T, message: string): T {
  if (!guard(value)) throw new Error(message);
  return value;
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
      const { actorUserId, tErrors } = await resolveAuthCtx(ctx);

      const input = args.input;
      const updatePayload: Record<string, unknown> = {};

      // Use positive checks to avoid negated conditions and make intent explicit
      if (input.direction != null) {
        updatePayload.direction = input.direction;
      }

      if (input.isDefault != null) {
        updatePayload.isDefault = input.isDefault;
      }

      if (input.label !== undefined) {
        updatePayload.label = input.label;
      }

      if (input.details != null) {
        updatePayload.details = normalizePaymentMethodDetailsInput(input.details);
      }

      return PaymentMethodService.updateUserPaymentMethod(actorUserId, args.id, updatePayload, tErrors);
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

makePaymentMethodIdMutationField({
  fieldName: "setDefaultUserPaymentMethod",
  returnType: UserPaymentMethodPothosObject,
  description: "Set a user payment method as default",
  getService: (actorUserId, id, tErrors) => PaymentMethodService.setDefaultUserPaymentMethod(actorUserId, id, tErrors),
});

makePaymentMethodIdMutationField({
  fieldName: "verifyBankTransferPaymentMethod",
  returnType: UserPaymentMethodPothosObject,
  description: "Verify a bank transfer payment method",
  getService: (actorUserId, id, tErrors) =>
    PaymentMethodService.verifyBankTransferPaymentMethod(actorUserId, id, tErrors),
});

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
        assertShape(args.input, isSupportedMobileWalletSubmitInput, "createSupportedMobileWallet: invalid input"),
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
        assertShape(args.input, isUpdateSupportedMobileWalletInput, "updateSupportedMobileWallet: invalid input"),
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
        assertShape(args.input, isSupportedPaymentLinkSubmitInput, "createSupportedPaymentLink: invalid input"),
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
        assertShape(args.input, isUpdateSupportedPaymentLinkInput, "updateSupportedPaymentLink: invalid input"),
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
        assertShape(args.input, isSupportedOnlineAccountSubmitInput, "createSupportedOnlineAccount: invalid input"),
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
        assertShape(args.input, isUpdateSupportedOnlineAccountInput, "updateSupportedOnlineAccount: invalid input"),
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
