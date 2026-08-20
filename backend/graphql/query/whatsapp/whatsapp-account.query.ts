import { GraphQLError } from "graphql";
import { AppPermission } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { WhatsappAccountPothosObject } from "@/backend/graphql/pothos/whatsapp/whatsapp-account.pothos";
import { withAuthResult } from "@/backend/graphql/utils";
import { WhatsappAccountService } from "@/backend/services";

gqlSchemaBuilder.queryFields(t => ({
  whatsappAccounts: t.field({
    type: [WhatsappAccountPothosObject],
    description: "List all active WhatsApp business accounts.",
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
    description: "Check if WhatsApp Cloud API is configured and credentials are valid.",
    authScopes: { permission: AppPermission.WHATSAPP_VIEW },
    resolve: withAuthResult((_actorUserId, _args, _tErrors) => WhatsappAccountService.isConfigured()),
  }),
}));
