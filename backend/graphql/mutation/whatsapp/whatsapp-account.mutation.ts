import { AppPermission } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { WhatsappAccountPurposePothosEnum } from "@/backend/graphql/pothos/shared/enum.pothos";
import {
  WhatsappAccessTokenTestResultPothosObject,
  WhatsappAccountCreateInputPothosObject,
  WhatsappAccountPothosObject,
  WhatsappAccountUpdateInputPothosObject,
  WhatsappEmbeddedSignupInputPothosObject,
  WhatsappSyncFromMetaResultPothosObject,
} from "@/backend/graphql/pothos/whatsapp/whatsapp-account.pothos";
import { withAuthResult } from "@/backend/graphql/utils";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { WhatsappAccountService } from "@/backend/services";
import type {
  UserPermissionContext,
  WhatsappAccountCreateSubmitInput,
  WhatsappAccountUpdateInput,
} from "@/backend/types";

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
        purpose: args.input.purpose ?? undefined,
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
      id: t.arg.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
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

  localDeactivateWhatsappAccount: t.field({
    type: WhatsappAccountPothosObject,
    description: "Stop using a WhatsApp account: deactivate it. Calls resetWhatsappChannel() on success (S4).",
    authScopes: { permission: AppPermission.WHATSAPP_CONFIG_MANAGE },
    args: {
      id: t.arg.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
    },
    resolve: withAuthResult((actorUserId, args, tErrors) =>
      WhatsappAccountService.localDeactivateAccount(actorUserId, tErrors, args.id)
    ),
  }),
}));

/**
 * Routing-purpose and credential management. The purpose mutation rejects
 * purpose assignment on inactive accounts (`whatsapp.purposeRequiresActive`)
 * and resets the channel cache so routing picks up the change immediately.
 * The permission context is taken from ctx (no extra user-context query).
 */
gqlSchemaBuilder.mutationFields(t => ({
  updateWhatsappAccountPurpose: t.field({
    type: WhatsappAccountPothosObject,
    description: "Assign or change the routing purpose of a WhatsApp account (active accounts only).",
    authScopes: { permission: AppPermission.WHATSAPP_CONFIG_MANAGE },
    args: {
      accountId: t.arg.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
      purpose: t.arg({ type: WhatsappAccountPurposePothosEnum, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      const context: UserPermissionContext = {
        permissions: ctx.permissions,
        permissionGroups: ctx.permissionGroups,
        isSuperAdmin: ctx.isSuperAdmin,
        role: ctx.role,
      };
      const tErrors = ctx.t().errorsTranslations;
      return WhatsappAccountService.updateAccountPurpose(actorUserId, context, tErrors, args.accountId, args.purpose);
    },
  }),

  setWhatsappAccessToken: t.field({
    type: WhatsappAccountPothosObject,
    description: "Set the access token for a WhatsApp account. Calls resetWhatsappChannel() on success (S4).",
    authScopes: { superAdmin: true },
    args: {
      id: t.arg.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
      accessToken: t.arg.string({ required: true, directives: { constraint: { maxLength: 512 } } }),
    },
    resolve: withAuthResult((actorUserId, args, tErrors) =>
      WhatsappAccountService.setAccessToken(actorUserId, tErrors, args.id, args.accessToken)
    ),
  }),

  testWhatsappAccessToken: t.field({
    type: WhatsappAccessTokenTestResultPothosObject,
    description:
      "Validate an access token against Meta for the account's phone number without persisting it (used to gate the token save action).",
    authScopes: { permission: AppPermission.WHATSAPP_CONFIG_MANAGE },
    args: {
      id: t.arg.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
      accessToken: t.arg.string({ required: true, directives: { constraint: { maxLength: 512 } } }),
    },
    resolve: withAuthResult((actorUserId, args, tErrors) =>
      WhatsappAccountService.testAccessToken(actorUserId, tErrors, args.id, args.accessToken)
    ),
  }),

  setWhatsappTwoStepPin: t.field({
    type: WhatsappAccountPothosObject,
    description:
      "Set the two-step verification PIN for a WhatsApp account. Calls resetWhatsappChannel() on success (S4).",
    authScopes: { superAdmin: true },
    args: {
      id: t.arg.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
      twoStepPin: t.arg.string({ required: true, directives: { constraint: { maxLength: 6 } } }),
    },
    resolve: withAuthResult((actorUserId, args, tErrors) =>
      WhatsappAccountService.setTwoStepPin(actorUserId, tErrors, args.id, args.twoStepPin)
    ),
  }),
}));

/**
 * Onboarding, Meta sync, and per-user notification opt-in.
 *
 * Embedded Signup exchanges the single-use ES authorization code, resolves +
 * confirms the phone number (`is_on_biz_app` && `platform_type === "CLOUD_API"`),
 * attaches the app to the WABA, creates the account with
 * `onboardingMode: COEXISTENCE`, and enqueues the one-shot contacts/history
 * sync. Failures surface as `whatsapp.embeddedSignupFailed`; a code replay
 * fails the Meta exchange (single-use).
 *
 * `setUserWhatsappOptIn` requires WHATSAPP_CONFIG_MANAGE for all callers,
 * including self-service (userId = "me"). WhatsApp opt-in is an admin-managed
 * action, not user-self-service. The "me" alias simplifies userId resolution
 * but does not relax the permission requirement. Non-self toggles additionally
 * require assertSuperAdmin at the service layer (defense-in-depth).
 */
gqlSchemaBuilder.mutationFields(t => ({
  completeWhatsappEmbeddedSignup: t.field({
    type: WhatsappAccountPothosObject,
    description: "Complete WhatsApp Embedded Signup (coexistence) onboarding for a Business-app number.",
    authScopes: { permission: AppPermission.WHATSAPP_CONFIG_MANAGE },
    args: {
      input: t.arg({ type: WhatsappEmbeddedSignupInputPothosObject, required: true }),
    },
    resolve: withAuthResult((actorUserId, args, tErrors) =>
      WhatsappAccountService.completeEmbeddedSignup(actorUserId, tErrors, {
        code: args.input.code,
        wabaId: args.input.wabaId,
        phoneNumberId: args.input.phoneNumberId ?? undefined,
        businessId: args.input.businessId ?? null,
      })
    ),
  }),

  syncWhatsappAccountsFromMeta: t.field({
    type: WhatsappSyncFromMetaResultPothosObject,
    description:
      "Sync WhatsApp phone numbers and message templates from Meta Graph API (BL3: includes template snapshot).",
    authScopes: { permission: AppPermission.WHATSAPP_CONFIG_MANAGE },
    resolve: withAuthResult((actorUserId, _args, tErrors) => WhatsappAccountService.syncFromMeta(actorUserId, tErrors)),
  }),

  setUserWhatsappOptIn: t.field({
    type: WhatsappAccountPothosObject,
    description: "Enable or disable WhatsApp notification opt-in for a user (REQ-10/BL1).",
    authScopes: { permission: AppPermission.WHATSAPP_CONFIG_MANAGE },
    args: {
      userId: t.arg.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
      enabled: t.arg.boolean({ required: true }),
      source: t.arg.string({ required: false, directives: { constraint: { maxLength: 50 } } }),
    },
    resolve: withAuthResult((actorUserId, args, tErrors) => {
      const targetUserId = args.userId === "me" ? actorUserId : args.userId;
      const source = args.source ?? "graphql";
      return WhatsappAccountService.setUserWhatsappOptIn(actorUserId, tErrors, targetUserId, args.enabled, source);
    }),
  }),
}));
