import SchemaBuilder from "@pothos/core";
import AddGraphQL from "@pothos/plugin-add-graphql";
import DataloaderPlugin from "@pothos/plugin-dataloader";
import DirectivesPlugin from "@pothos/plugin-directives";
import DrizzlePlugin from "@pothos/plugin-drizzle";
import ErrorsPlugin from "@pothos/plugin-errors";
import ScopeAuthPlugin from "@pothos/plugin-scope-auth";
import SimpleObjectsPlugin from "@pothos/plugin-simple-objects";
import TracingPlugin, { isRootField, wrapResolver } from "@pothos/plugin-tracing";
import WithInputPlugin from "@pothos/plugin-with-input";
import { getTableConfig } from "drizzle-orm/pg-core";
import { GraphQLError } from "graphql";
import { type DrizzleRelations, db } from "@/backend/db/drizzleDb";
import { relations } from "@/backend/db/drizzleRelations";
import type { AppPermission } from "@/backend/enum";
import type { AuthContexts, BaseContext } from "@/backend/graphql/gqlContext";
import { enablePothosDevHmr } from "@/backend/graphql/pothos-hmr";
import type { Email } from "@/backend/lib";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services";
import type { PhoneNumber } from "@/shared/lib/phone";
import type { LocalizedString } from "@/shared/types/localized-string";

// Allow Pothos plugins to re-register during Turbopack/Webpack HMR.
if (process.env.NODE_ENV !== "production") {
  SchemaBuilder.allowPluginReRegistration = true;
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

// Detects whether an auth-scope failure represents an unauthenticated request
// (i.e. the `loggedIn` scope failed) so we can emit UNAUTHENTICATED vs FORBIDDEN.
const hasLoggedInFailure = (failure: unknown): boolean => {
  if (!isRecord(failure)) return false;
  if (failure.kind === "AuthScope") {
    return failure.scope === "loggedIn";
  }
  if (failure.kind === "AnyAuthScopes" || failure.kind === "AllAuthScopes") {
    const failures = failure.failures;
    return Array.isArray(failures) && failures.some(hasLoggedInFailure);
  }
  return false;
};

export interface PothosTypes {
  DrizzleRelations: DrizzleRelations;
  Context: BaseContext;
  AuthScopes: {
    loggedIn: boolean;
    permission: AppPermission;
    superAdmin: boolean;
    notImpersonating: boolean;
    notSimulatingGroup: boolean;
  };
  AuthContexts: AuthContexts;
  Scalars: {
    DateTime: { Input: Date; Output: Date | string };
    Date: { Input: Date; Output: Date };
    JSON: { Input: unknown; Output: unknown };
    StringMap: {
      Input: Record<string, string>;
      Output: Record<string, string>;
    };
    LocalizedString: {
      Input: LocalizedString;
      Output: LocalizedString;
    };
    // use following scalars for input types only for automatic validation
    PhoneNumber: { Input: PhoneNumber; Output: PhoneNumber };
    Email: { Input: Email; Output: Email };
  };
  Directives: {
    constraint: {
      locations: "INPUT_FIELD_DEFINITION" | "ARGUMENT_DEFINITION" | "FIELD_DEFINITION";
      args: {
        maxLength?: number;
        minLength?: number;
        max?: number;
        min?: number;
        maxItems?: number;
        minItems?: number;
        pattern?: string;
        format?: string;
      };
    };
  };
}

// Always create a fresh builder when this module evaluates. Do NOT cache on
// globalThis — that keeps a stale ConfigStore across HMR and causes either
// Duplicate typename errors or broken onConfig patches.
export const gqlSchemaBuilder = new SchemaBuilder<PothosTypes>({
  plugins: [
    DrizzlePlugin,
    AddGraphQL,
    DirectivesPlugin,
    ErrorsPlugin,
    ScopeAuthPlugin,
    WithInputPlugin,
    SimpleObjectsPlugin,
    DataloaderPlugin,
    TracingPlugin,
  ],
  drizzle: {
    client: () => db,
    getTableConfig,
    relations,
  },
  scopeAuth: {
    authScopes: async ctx => {
      const realUserId = ctx.realUserId ?? ctx.actorUserId ?? ctx.user?.id;
      let actorIsSuperAdmin = ctx.isSuperAdmin;
      if (realUserId) {
        const actorContext = await PermissionsService.getUserContext(realUserId);
        actorIsSuperAdmin = actorContext.isSuperAdmin;
      } else if (ctx.actorUserId) {
        const actorContext = await PermissionsService.getUserContext(ctx.actorUserId);
        actorIsSuperAdmin = actorContext.isSuperAdmin;
      }

      return {
        loggedIn: !!ctx.user,
        permission: (key: AppPermission) => ctx.isSuperAdmin || ctx.permissions.includes(key),
        superAdmin: actorIsSuperAdmin,
        notImpersonating: !ctx.isImpersonating,
        notSimulatingGroup: !ctx.isSimulatingGroup,
      };
    },
    unauthorizedError: (_parent, _context, _info, result) => {
      const isUnauthenticated = hasLoggedInFailure(result.failure);

      return new GraphQLError(result.message, {
        extensions: {
          code: isUnauthenticated ? "UNAUTHENTICATED" : "FORBIDDEN",
        },
      });
    },
  },
  errors: {
    defaultTypes: [],
    onResolvedError: error => {
      logger.error("Handled error:", error);
    },
  },
  tracing: {
    // Enable tracing for rootFields by default, other fields need to opt in
    default: config => isRootField(config),
    // Log resolver execution duration
    wrap: (resolver, _options, config) =>
      wrapResolver(resolver, (_error, duration) => {
        logger.log(`Executed resolver ${config.parentType}.${config.name} in ${duration}ms`);
      }),
  },
});

enablePothosDevHmr(gqlSchemaBuilder);

// Drop any builder cached by earlier HMR experiments so a stuck process can recover.
if (process.env.NODE_ENV !== "production") {
  const BUILDER_KEY = "__sirajGqlSchemaBuilder";
  const globalForPothos = globalThis as typeof globalThis & {
    [BUILDER_KEY]?: unknown;
  };
  delete globalForPothos[BUILDER_KEY];
}

// HMR dependency edge (hayes/pothos#49): when any schema definition module
// changes, invalidate this builder module too so type registration runs against
// a fresh SchemaBuilder instead of throwing Duplicate typename.
if (process.env.NODE_ENV !== "production") {
  import("@/backend/graphql/gqlSchema.definitions").catch(error => {
    logger.error("Failed to load GraphQL schema definitions for HMR edge", error);
  });
}
