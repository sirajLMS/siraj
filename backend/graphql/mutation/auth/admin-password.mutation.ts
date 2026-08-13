import { GraphQLError } from "graphql";
import { AppPermission } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { AdminResetPasswordInputPothosObject, AdminResetPasswordResultPothosObject } from "@/backend/graphql/pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { logger } from "@/backend/lib/logger";
import { AuthPasswordService } from "@/backend/services";

gqlSchemaBuilder.mutationField("adminResetPassword", t =>
  t.field({
    type: AdminResetPasswordResultPothosObject,
    authScopes: {
      permission: AppPermission.USER_ADMIN_RESET_PASSWORD,
      notImpersonating: true,
    },
    args: {
      input: t.arg({ type: AdminResetPasswordInputPothosObject, required: true }),
    },
    resolve: async (_parent, args, ctx) => {
      const tErrors = ctx.t().errorsTranslations;
      const actorUserId = await requireAuth(ctx);

      // Handle potential null sendNotificationEmail (Pothos sets defaultValue: true but can be null)
      const input = {
        ...args.input,
        sendNotificationEmail: args.input.sendNotificationEmail ?? true,
      };

      try {
        const result = await AuthPasswordService.adminResetPassword(actorUserId, args.input.userId, input, ctx.locale);
        return result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        if (err.message.includes(tErrors.auth.cannotResetOwnPasswordViaAdmin)) {
          throw new GraphQLError(tErrors.auth.cannotResetOwnPasswordViaAdmin, {
            extensions: { code: "FORBIDDEN" },
          });
        }
        logger.error("Admin reset password failed", { error: err, actorUserId });
        throw new GraphQLError(tErrors.auth.serviceUnavailable, {
          extensions: { code: "SERVICE_UNAVAILABLE" },
        });
      }
    },
  })
);
