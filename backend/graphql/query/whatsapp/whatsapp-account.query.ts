import { GraphQLError } from "graphql";
import { AppPermission } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  WhatsappAccountPothosObject,
  WhatsappConfigurationStatusPothosObject,
} from "@/backend/graphql/pothos/whatsapp/whatsapp-account.pothos";
import { withAuthResult } from "@/backend/graphql/utils";
import { WhatsappAccountService } from "@/backend/services";

gqlSchemaBuilder.queryFields(t => ({
  whatsappAccounts: t.field({
    type: [WhatsappAccountPothosObject],
    description:
      "List all WhatsApp business accounts (active and inactive) for the numbers management surface — synced numbers start inactive and must remain visible.",
    authScopes: { permission: AppPermission.WHATSAPP_VIEW },
    resolve: withAuthResult((actorUserId, _args, tErrors) => WhatsappAccountService.listAccounts(actorUserId, tErrors)),
  }),

  isUserWhatsappOptIn: t.boolean({
    nullable: false,
    description: "Check if a user has opted in to WhatsApp notifications (REQ-10/BL1).",
    authScopes: { loggedIn: true },
    args: {
      userId: t.arg.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
    },
    resolve: withAuthResult((actorUserId, args, tErrors) => {
      const userId = args.userId === "me" ? actorUserId : args.userId;
      if (userId !== actorUserId) {
        throw new GraphQLError(tErrors.insufficientPermissions, {
          extensions: { code: "FORBIDDEN" },
        });
      }
      return WhatsappAccountService.isUserWhatsappOptIn(userId);
    }),
  }),

  isWhatsappConfigured: t.boolean({
    nullable: false,
    description:
      "Check if WhatsApp Cloud API is configured — true when at least one active account resolves healthy credentials, or when the env bootstrap path (WHATSAPP_ACCESS_TOKEN + WHATSAPP_WABA_ID) is fully configured.",
    authScopes: { permission: AppPermission.WHATSAPP_VIEW },
    resolve: withAuthResult((_actorUserId, _args, _tErrors) => WhatsappAccountService.isConfigured()),
  }),

  whatsappConfigurationStatus: t.field({
    type: WhatsappConfigurationStatusPothosObject,
    description:
      "Detailed WhatsApp Cloud API configuration status — which configuration path (DB account vs env bootstrap) is satisfied and which env keys are missing.",
    authScopes: { permission: AppPermission.WHATSAPP_VIEW },
    resolve: withAuthResult((_actorUserId, _args, _tErrors) => WhatsappAccountService.getConfigurationStatus()),
  }),

  whatsappEmbeddedSignupAllowedOriginsUrl: t.string({
    nullable: true,
    description:
      "Meta App Dashboard 'Facebook Login for Business' settings URL for this app's id, where Embedded Signup allowed origins/redirect URIs are registered. Null when WHATSAPP_APP_ID is not configured.",
    authScopes: { permission: AppPermission.WHATSAPP_VIEW },
    resolve: withAuthResult((_actorUserId, _args, _tErrors) =>
      WhatsappAccountService.resolveEmbeddedSignupAllowedOriginsUrl()
    ),
  }),
}));
