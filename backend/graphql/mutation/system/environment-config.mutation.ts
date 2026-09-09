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
    // The scopes are wrapped in `$all` explicitly: the schema builder does not
    // set `scopeAuth.defaultStrategy`, so it defaults to "any" — a bare
    // multi-key map would grant on the FIRST truthy scope
    // (`notImpersonating: true`) without ever evaluating the permission check.
    authScopes: {
      $all: { permission: AppPermission.SETTINGS_EDIT_ENV, notImpersonating: true },
    },
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
    // Same `$all` wrap as the upsert above: under the builder's "any" default
    // a bare map would grant on `notImpersonating` alone and skip the
    // permission check.
    authScopes: {
      $all: { permission: AppPermission.SETTINGS_EDIT_ENV, notImpersonating: true },
    },
    args: {
      key: t.arg.string({ required: true, directives: { constraint: { maxLength: 100 } } }),
    },
    resolve: async (_root, args, ctx) => {
      return executeEnvConfigMutation(ctx, args.key, "delete", () => deleteEnvConfigOverride(args.key));
    },
  })
);
