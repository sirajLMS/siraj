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

/**
 * Builds the Pothos scope-auth scope map for a given request context.
 *
 * The `superAdmin` scope is a lazy function (scope loader) — it only evaluates
 * when a field with `authScopes: { superAdmin: true }` is actually queried.
 * When the actor is the same as the logged-in user (no impersonation/group-sim),
 * it returns `ctx.isSuperAdmin` directly, avoiding a redundant `getUserContext`
 * DB call (3 queries). When the actor differs (impersonation/group-sim), it
 * fetches the real actor's super-admin status.
 *
 * Invariant: `ctx.isSuperAdmin` and `ctx.permissions` are populated by
 * `createContext` from `PermissionsService.getUserContext(userId)` (or
 * `getPermissionGroupContext` for group simulation). They are guaranteed to be
 * in sync with the logged-in user's *current* permissions at context-creation
 * time. The `superAdmin` scope's fast path (`actorUserId === ctx.user?.id`)
 * relies on this invariant — if `ctx.isSuperAdmin` is `true`, the logged-in
 * user IS a super admin. The defensive fallback (`return false` if
 * `actorContext` lacks `isSuperAdmin`) guards against a malformed context
 * from a future auth flow that doesn't go through `createContext`.
 */
export function buildAuthScopes(
  ctx: BaseContext,
  getUserContext: (userId: string) => Promise<{ isSuperAdmin: boolean }> = PermissionsService.getUserContext
) {
  return {
    loggedIn: !!ctx.user,
    permission: (key: AppPermission) => ctx.isSuperAdmin || ctx.permissions.includes(key),
    superAdmin: async () => {
      const actorUserId = ctx.realUserId ?? ctx.actorUserId ?? ctx.user?.id;
      if (!actorUserId || actorUserId === ctx.user?.id) {
        return ctx.isSuperAdmin;
      }
      const actorContext = await getUserContext(actorUserId);
      // Defensive fallback: if the returned context is malformed (missing
      // isSuperAdmin), default to `false` — never grant super admin inadvertently.
      return actorContext?.isSuperAdmin ?? false;
    },
    notImpersonating: !ctx.isImpersonating,
    notSimulatingGroup: !ctx.isSimulatingGroup,
  };
}

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
    authScopes: async ctx => buildAuthScopes(ctx),
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
    wrap: (resolver, _options, config) => {
      if (process.env.NODE_ENV === "production" && process.env.NEXT_RUNTIME === "nodejs") {
        // Conditional require: newrelic module is NEVER loaded in dev/test.
        // @pothos/tracing-newrelic imports newrelic at module top level.
        // The NODE_ENV gate guarantees newrelic is never evaluated in dev.
        // eslint-disable-next-line @typescript-eslint/no-require-imports -- gated by NODE_ENV + NEXT_RUNTIME; CommonJS require is the only synchronous way to conditionally load @pothos/tracing-newrelic
        const { createNewrelicWrapper } = require("@pothos/tracing-newrelic");
        return createNewrelicWrapper({ includeArgs: true, includeSource: true })(resolver, _options, config);
      }
      // Dev/test fallback: existing wrapResolver duration logging
      return wrapResolver(resolver, (_error, duration) => {
        logger.log(`Executed resolver ${config.parentType}.${config.name} in ${duration}ms`);
      });
    },
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
