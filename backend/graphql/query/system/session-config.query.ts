// Auto-extracted from pothos/ (types-review R3-P3).
// Query field registrations relocated to the query layer per query/AGENTS.md.

import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  executeSessionConfigQuery,
  SessionConfigPothosObject,
} from "@/backend/graphql/pothos/system/session-config.pothos";
import { SessionConfigService } from "@/backend/services";

gqlSchemaBuilder.queryField("sessionConfigs", t =>
  t.field({
    type: [SessionConfigPothosObject],
    // Read access = loggedIn here; the SETTINGS_VIEW / SETTINGS_EDIT_SESSION OR
    // gate lives in assertCanViewSessionConfig (via executeSessionConfigQuery).
    // The authScopes plugin only supports AND-composed single permissions, so
    // the OR view rule cannot be expressed declaratively.
    authScopes: { loggedIn: true },
    description: "Lists all per-role session configurations.",
    resolve: async (_root, _args, ctx) => {
      return executeSessionConfigQuery(ctx, () => SessionConfigService.listSessionConfigs());
    },
  })
);

gqlSchemaBuilder.queryField("sessionConfig", t =>
  t.field({
    type: SessionConfigPothosObject,
    nullable: true,
    // Same as sessionConfigs: loggedIn declared here; the SETTINGS_VIEW /
    // SETTINGS_EDIT_SESSION OR gate is enforced by assertCanViewSessionConfig.
    authScopes: { loggedIn: true },
    description: "Fetches the session configuration for a single role.",
    args: {
      roleName: t.arg.string({ required: true, directives: { constraint: { maxLength: 100 } } }),
    },
    resolve: async (_root, args, ctx) => {
      return executeSessionConfigQuery(ctx, () => SessionConfigService.getSessionConfig(args.roleName));
    },
  })
);
