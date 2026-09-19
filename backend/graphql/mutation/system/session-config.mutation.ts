// Auto-extracted from pothos/ (types-review R3-P3).
// Mutation field registrations relocated to the mutation layer per mutation/AGENTS.md.

import { AppPermission } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  executeSessionConfigMutation,
  SessionConfigPothosObject,
  SessionConfigUpsertInputPothosObject,
} from "@/backend/graphql/pothos/system/session-config.pothos";
import { SessionConfigService } from "@/backend/services";

gqlSchemaBuilder.mutationField("upsertSessionConfig", t =>
  t.field({
    type: SessionConfigPothosObject,
    authScopes: { $all: { permission: AppPermission.SETTINGS_EDIT_SESSION, notImpersonating: true } },
    description: "Creates or updates a per-role session configuration.",
    args: {
      input: t.arg({ type: SessionConfigUpsertInputPothosObject, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      return executeSessionConfigMutation(ctx, (userId, tErrors) =>
        SessionConfigService.upsertSessionConfig(args.input, userId, tErrors)
      );
    },
  })
);

gqlSchemaBuilder.mutationField("deleteSessionConfig", t =>
  t.field({
    type: "Boolean",
    authScopes: { $all: { permission: AppPermission.SETTINGS_EDIT_SESSION, notImpersonating: true } },
    description: "Deletes a per-role session configuration.",
    args: {
      roleName: t.arg.string({ required: true, directives: { constraint: { maxLength: 100 } } }),
    },
    resolve: async (_root, args, ctx) => {
      await executeSessionConfigMutation(ctx, async (userId, tErrors) => {
        await SessionConfigService.deleteSessionConfig(args.roleName, userId, tErrors);
      });
      return true;
    },
  })
);
