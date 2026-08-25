// Auto-extracted from pothos/ (types-review R3-P3).
// Mutation field registrations relocated to the mutation layer per mutation/AGENTS.md.

import { AppPermission } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  EnvConfigDeleteResultPothosObject,
  EnvConfigUpsertInputPothosObject,
  EnvConfigUpsertResultPothosObject,
  executeEnvConfigMutation,
} from "@/backend/graphql/pothos/system/environment-config.pothos";
import { deleteEnvConfigOverride, upsertEnvConfigOverride } from "@/backend/services";

gqlSchemaBuilder.mutationField("upsertEnvConfigEntry", t =>
  t.field({
    type: EnvConfigUpsertResultPothosObject,
    authScopes: { permission: AppPermission.SETTINGS_EDIT_ENV, notImpersonating: true },
    args: {
      input: t.arg({ type: EnvConfigUpsertInputPothosObject, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      return executeEnvConfigMutation(
        ctx,
        args.input.key,
        "upsert",
        () => upsertEnvConfigOverride(args.input),
        args.input.value
      );
    },
  })
);

gqlSchemaBuilder.mutationField("deleteEnvConfigEntry", t =>
  t.field({
    type: EnvConfigDeleteResultPothosObject,
    authScopes: { permission: AppPermission.SETTINGS_EDIT_ENV, notImpersonating: true },
    args: {
      key: t.arg.string({ required: true, directives: { constraint: { maxLength: 100 } } }),
    },
    resolve: async (_root, args, ctx) => {
      return executeEnvConfigMutation(ctx, args.key, "delete", () => deleteEnvConfigOverride(args.key));
    },
  })
);
