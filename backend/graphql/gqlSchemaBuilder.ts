import SchemaBuilder from "@pothos/core";
import AddGraphQL from "@pothos/plugin-add-graphql";
import DataloaderPlugin from "@pothos/plugin-dataloader";
import DrizzlePlugin from "@pothos/plugin-drizzle";
import ErrorsPlugin from "@pothos/plugin-errors";
import ScopeAuthPlugin from "@pothos/plugin-scope-auth";
import SimpleObjectsPlugin from "@pothos/plugin-simple-objects";
import TracingPlugin, { isRootField, wrapResolver } from "@pothos/plugin-tracing";
import WithInputPlugin from "@pothos/plugin-with-input";
import { getTableConfig } from "drizzle-orm/pg-core";
import { GraphQLError } from "graphql";
import { type DrizzleRelations, db, relations } from "@/backend/db/drizzleDb";
import logger from "@/backend/lib/logger";
import type { AppPermission } from "@/shared/lib/enum";
import type { Email, PhoneNumber } from "../lib";
import type { AuthContexts, BaseContext } from "./gqlContext";

export interface PothosTypes {
  DrizzleRelations: DrizzleRelations;
  Context: BaseContext;
  AuthScopes: {
    loggedIn: boolean;
    permission: AppPermission;
    superAdmin: boolean;
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
    // use following scalars for input types only for automatic validation
    PhoneNumber: { Input: PhoneNumber; Output: PhoneNumber };
    Email: { Input: Email; Output: Email };
  };
}

export const gqlSchemaBuilder = new SchemaBuilder<PothosTypes>({
  plugins: [
    DrizzlePlugin,
    AddGraphQL,
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
    authScopes: ctx => ({
      loggedIn: !!ctx.user,
      permission: (key: AppPermission) => ctx.isSuperAdmin || ctx.permissions.includes(key),
      superAdmin: ctx.isSuperAdmin,
    }),
    unauthorizedError: (_parent, _context, _info, result) => {
      const hasLoggedInFailure = (failure: unknown): boolean => {
        if (!failure || typeof failure !== "object") return false;
        const failureObj = failure as Record<string, unknown>;
        if (failureObj.kind === "AuthScope") {
          return failureObj.scope === "loggedIn";
        }
        if (failureObj.kind === "AnyAuthScopes" || failureObj.kind === "AllAuthScopes") {
          const failures = failureObj.failures;
          return Array.isArray(failures) && failures.some(hasLoggedInFailure);
        }
        return false;
      };

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
