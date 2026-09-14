import { GraphQLError } from "graphql";
import { AppPermission } from "@/backend/enum";
import type { BaseContext } from "@/backend/graphql/gqlContext";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { SessionConfigValidationError } from "@/backend/services";
import type {
  SessionConfigSelectType,
  SessionConfigUpsertInput,
  SessionConfigValidationErrorCode,
} from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

export function resolveSessionConfigValidationMessage(
  code: SessionConfigValidationErrorCode,
  tErrors: ErrorsLabels
): string {
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

export function handleSessionConfigServiceError(error: unknown, tErrors: ErrorsLabels): never {
  if (error instanceof SessionConfigValidationError) {
    throw new GraphQLError(resolveSessionConfigValidationMessage(error.code, tErrors), {
      extensions: { code: error.code },
    });
  }

  throw error;
}

/**
 * Helper to execute a session-config service operation with standard auth + error handling.
 * Extracts common pattern from mutation resolvers to eliminate CodeScene duplication warnings.
 */
export async function executeSessionConfigMutation<T>(
  ctx: BaseContext,
  operation: (userId: string, tErrors: ErrorsLabels) => Promise<T>
): Promise<T> {
  const userId = await requireAuth(ctx);
  const tErrors = ctx.t().errorsTranslations;

  try {
    return await operation(userId, tErrors);
  } catch (error) {
    handleSessionConfigServiceError(error, tErrors);
  }
  throw new Error("executeSessionConfigMutation: unreachable");
}

/**
 * Helper for query fields that need auth + permission check but no mutation.
 */
export async function executeSessionConfigQuery<T>(ctx: BaseContext, operation: () => Promise<T>): Promise<T> {
  const tErrors = ctx.t().errorsTranslations;
  await requireAuth(ctx);
  assertCanViewSessionConfig(ctx, tErrors);
  return operation();
}

export const SessionConfigRef = gqlSchemaBuilder.objectRef<SessionConfigSelectType>("SessionConfig");

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
      roleName: t.string({ required: true, directives: { constraint: { maxLength: 100 } } }),
      ttlSeconds: t.int({ required: true, directives: { constraint: { min: 1, max: 604800 } } }),
      maxConcurrentSessions: t.int({ required: true, directives: { constraint: { min: 0, max: 1000 } } }),
    }),
  });

export function canViewSessionConfig(ctx: BaseContext): boolean {
  return (
    ctx.isSuperAdmin ||
    ctx.permissions.includes(AppPermission.SETTINGS_VIEW) ||
    ctx.permissions.includes(AppPermission.SETTINGS_EDIT_SESSION)
  );
}

export function assertCanViewSessionConfig(ctx: BaseContext, tErrors: ErrorsLabels): void {
  if (!canViewSessionConfig(ctx)) {
    throw new GraphQLError(tErrors.insufficientPermissions, {
      extensions: { code: "FORBIDDEN" },
    });
  }
}
