import { AppPermission } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  WhatsappAccountCreateInputPothosObject,
  WhatsappAccountPothosObject,
  WhatsappAccountUpdateInputPothosObject,
  WhatsappSyncFromMetaResultPothosObject,
} from "@/backend/graphql/pothos/whatsapp/whatsapp-account.pothos";
import { withAuthResult } from "@/backend/graphql/utils";
import { WhatsappAccountService } from "@/backend/services";
import type { WhatsappAccountCreateSubmitInput, WhatsappAccountUpdateInput } from "@/backend/types";

gqlSchemaBuilder.mutationFields(t => ({
  createWhatsappAccount: t.field({
    type: WhatsappAccountPothosObject,
    description: "Create a new WhatsApp business account record.",
    authScopes: { permission: AppPermission.WHATSAPP_CONFIG_MANAGE },
    args: {
      input: t.arg({ type: WhatsappAccountCreateInputPothosObject, required: true }),
    },
    resolve: withAuthResult((actorUserId, args, tErrors) => {
      const input: WhatsappAccountCreateSubmitInput = {
        ...args.input,
        displayName: args.input.displayName
          ? Object.fromEntries(Object.entries(args.input.displayName).filter(([, v]) => v != null))
          : null,
        isActive: args.input.isActive ?? true,
      };
      return WhatsappAccountService.createAccount(actorUserId, tErrors, input);
    }),
  }),

  updateWhatsappAccount: t.field({
    type: WhatsappAccountPothosObject,
    description: "Update an existing WhatsApp account. Calls resetWhatsappChannel() on success (S4).",
    authScopes: { permission: AppPermission.WHATSAPP_CONFIG_MANAGE },
    args: {
      id: t.arg.string({ required: true }),
      input: t.arg({ type: WhatsappAccountUpdateInputPothosObject, required: true }),
    },
    resolve: withAuthResult((actorUserId, args, tErrors) => {
      const input: WhatsappAccountUpdateInput = {
        ...args.input,
        displayName: args.input.displayName
          ? Object.fromEntries(Object.entries(args.input.displayName).filter(([, v]) => v != null))
          : undefined,
        isActive: args.input.isActive ?? undefined,
        displayPhoneNumber: args.input.displayPhoneNumber ?? undefined,
        qualityRating: args.input.qualityRating ?? undefined,
        portfolioMessagingLimitTier: args.input.portfolioMessagingLimitTier ?? undefined,
        throughputLevel: args.input.throughputLevel ?? undefined,
      };
      return WhatsappAccountService.updateAccount(actorUserId, tErrors, args.id, input);
    }),
  }),

  deleteWhatsappAccount: t.field({
    type: WhatsappAccountPothosObject,
    description: "Deactivate a WhatsApp account. Calls resetWhatsappChannel() on success (S4).",
    authScopes: { permission: AppPermission.WHATSAPP_CONFIG_MANAGE },
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: withAuthResult((actorUserId, args, tErrors) =>
      WhatsappAccountService.deleteAccount(actorUserId, tErrors, args.id)
    ),
  }),

  setWhatsappAccessToken: t.field({
    type: WhatsappAccountPothosObject,
    description: "Set the access token for a WhatsApp account. Calls resetWhatsappChannel() on success (S4).",
    authScopes: { superAdmin: true },
    args: {
      id: t.arg.string({ required: true }),
      accessToken: t.arg.string({ required: true }),
    },
    resolve: withAuthResult((actorUserId, args, tErrors) =>
      WhatsappAccountService.setAccessToken(actorUserId, tErrors, args.id, args.accessToken)
    ),
  }),

  setWhatsappTwoStepPin: t.field({
    type: WhatsappAccountPothosObject,
    description:
      "Set the two-step verification PIN for a WhatsApp account. Calls resetWhatsappChannel() on success (S4).",
    authScopes: { superAdmin: true },
    args: {
      id: t.arg.string({ required: true }),
      twoStepPin: t.arg.string({ required: true }),
    },
    resolve: withAuthResult((actorUserId, args, tErrors) =>
      WhatsappAccountService.setTwoStepPin(actorUserId, tErrors, args.id, args.twoStepPin)
    ),
  }),

  syncWhatsappAccountsFromMeta: t.field({
    type: WhatsappSyncFromMetaResultPothosObject,
    description:
      "Sync WhatsApp phone numbers and message templates from Meta Graph API (BL3: includes template snapshot).",
    authScopes: { permission: AppPermission.WHATSAPP_CONFIG_MANAGE },
    resolve: withAuthResult((actorUserId, _args, tErrors) => WhatsappAccountService.syncFromMeta(actorUserId, tErrors)),
  }),

  /**
   * Toggle a user's WhatsApp notification opt-in status.
   *
   * Auth design: Requires WHATSAPP_CONFIG_MANAGE for all callers, including self-service
   * (userId = "me"). WhatsApp opt-in is an admin-managed action, not user-self-service.
   * The "me" alias simplifies userId resolution but does not relax the permission requirement.
   * Non-self toggles additionally require assertSuperAdmin at the service layer (defense-in-depth).
   */
  setUserWhatsappOptIn: t.field({
    type: WhatsappAccountPothosObject,
    description: "Enable or disable WhatsApp notification opt-in for a user (REQ-10/BL1).",
    authScopes: { permission: AppPermission.WHATSAPP_CONFIG_MANAGE },
    args: {
      userId: t.arg.string({ required: true }),
      enabled: t.arg.boolean({ required: true }),
      source: t.arg.string({ required: false }),
    },
    resolve: withAuthResult((actorUserId, args, tErrors) => {
      const targetUserId = args.userId === "me" ? actorUserId : args.userId;
      const source = args.source ?? "graphql";
      return WhatsappAccountService.setUserWhatsappOptIn(actorUserId, tErrors, targetUserId, args.enabled, source);
    }),
  }),
}));
