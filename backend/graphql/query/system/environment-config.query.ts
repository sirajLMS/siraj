// Auto-extracted from pothos/ (types-review R3-P3).
// Query field registrations relocated to the query layer per query/AGENTS.md.

import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  assertCanViewEnvironmentConfig,
  EnvConfigEntryPothosObject,
} from "@/backend/graphql/pothos/system/environment-config.pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { listEnvConfigEntries } from "@/backend/services";

gqlSchemaBuilder.queryField("envConfigEntries", t =>
  t.field({
    type: [EnvConfigEntryPothosObject],
    authScopes: { loggedIn: true },
    resolve: async (_root, _args, ctx) => {
      const tErrors = ctx.t().errorsTranslations;
      await requireAuth(ctx);
      assertCanViewEnvironmentConfig(ctx, tErrors);
      return listEnvConfigEntries();
    },
  })
);
