import { GraphQLError } from "graphql";
import { AppPermission } from "@/backend/enum";
import type { BaseContext } from "@/backend/graphql/gqlContext";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import {
  SessionConfigService,
  SessionConfigValidationError,
  type SessionConfigValidationErrorCode,
} from "@/backend/services/users/session-config.service";
import type { SessionConfigSelectType, SessionConfigUpsertInput } from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

function resolveSessionConfigValidationMessage(code: SessionConfigValidationErrorCode, tErrors: ErrorsLabels): string {
  switch (code) {
    case "EROLE_NAME_REQUIRED":
      return tErrors.sessionConfig.roleNameRequired;
    case "ETTL_OUT_OF_RANGE":
      return tErrors.sessionConfig.ttlOutOfRange;
    case "EMAX_CONCURRENT_OUT_OF_RANGE":
      return tErrors.sessionConfig.maxConcurrentOutOfRange;
    default:
      return tErrors.invalidInput;
  }
}

function handleSessionConfigServiceError(error: unknown, tErrors: ErrorsLabels): never {
  if (error instanceof SessionConfigValidationError) {
    throw new GraphQLError(resolveSessionConfigValidationMessage(error.code, tErrors), {
      extensions: { code: error.code },
    });
  }

  throw error;
}

const SessionConfigRef = gqlSchemaBuilder.objectRef<SessionConfigSelectType>("SessionConfig");

export const SessionConfigPothosObject = SessionConfigRef.implement({
  description: "Per-role session TTL and concurrent-session limits for the Settings Session & Security tab.",
  fields: t => ({
    id: t.exposeString("id"),
    roleName: t.exposeString("roleName"),
    ttlSeconds: t.exposeInt("ttlSeconds"),
    maxConcurrentSessions: t.exposeInt("maxConcurrentSessions"),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    updatedAt: t.expose("updatedAt", { type: "DateTime" }),
  }),
});

export const SessionConfigUpsertInputPothosObject = gqlSchemaBuilder
  .inputRef<SessionConfigUpsertInput>("SessionConfigUpsertInput")
  .implement({
    description: "Input for creating or updating a per-role session configuration.",
    fields: t => ({
      roleName: t.string({ required: true }),
      ttlSeconds: t.int({ required: true }),
      maxConcurrentSessions: t.int({ required: true }),
    }),
  });

function canViewSessionConfig(ctx: BaseContext): boolean {
  return (
    ctx.isSuperAdmin ||
    ctx.permissions.includes(AppPermission.SETTINGS_VIEW) ||
    ctx.permissions.includes(AppPermission.SETTINGS_EDIT_SESSION)
  );
}

function assertCanViewSessionConfig(ctx: BaseContext, tErrors: ErrorsLabels): void {
  if (!canViewSessionConfig(ctx)) {
    throw new GraphQLError(tErrors.insufficientPermissions, {
      extensions: { code: "FORBIDDEN" },
    });
  }
}

gqlSchemaBuilder.queryField("sessionConfigs", t =>
  t.field({
    type: [SessionConfigPothosObject],
    authScopes: { loggedIn: true },
    description: "Lists all per-role session configurations.",
    resolve: async (_root, _args, ctx) => {
      const tErrors = ctx.t().errorsTranslations;
      await requireAuth(ctx);
      assertCanViewSessionConfig(ctx, tErrors);
      return SessionConfigService.listSessionConfigs();
    },
  })
);

gqlSchemaBuilder.queryField("sessionConfig", t =>
  t.field({
    type: SessionConfigPothosObject,
    nullable: true,
    authScopes: { loggedIn: true },
    description: "Fetches the session configuration for a single role.",
    args: {
      roleName: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const tErrors = ctx.t().errorsTranslations;
      await requireAuth(ctx);
      assertCanViewSessionConfig(ctx, tErrors);
      return SessionConfigService.getSessionConfig(args.roleName);
    },
  })
);

gqlSchemaBuilder.mutationField("upsertSessionConfig", t =>
  t.field({
    type: SessionConfigPothosObject,
    authScopes: { permission: AppPermission.SETTINGS_EDIT_SESSION, notImpersonating: true },
    description: "Creates or updates a per-role session configuration.",
    args: {
      input: t.arg({ type: SessionConfigUpsertInputPothosObject, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const userId = await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;

      try {
        return await SessionConfigService.upsertSessionConfig(args.input, userId, tErrors);
      } catch (error) {
        handleSessionConfigServiceError(error, tErrors);
      }
    },
  })
);

gqlSchemaBuilder.mutationField("deleteSessionConfig", t =>
  t.field({
    type: "Boolean",
    authScopes: { permission: AppPermission.SETTINGS_EDIT_SESSION, notImpersonating: true },
    description: "Deletes a per-role session configuration.",
    args: {
      roleName: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const userId = await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;

      try {
        await SessionConfigService.deleteSessionConfig(args.roleName, userId, tErrors);
        return true;
      } catch (error) {
        handleSessionConfigServiceError(error, tErrors);
      }
    },
  })
);
