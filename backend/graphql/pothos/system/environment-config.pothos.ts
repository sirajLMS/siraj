import { GraphQLError } from "graphql";
import { AppPermission } from "@/backend/enum";
import type { BaseContext } from "@/backend/graphql/gqlContext";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { logger } from "@/backend/lib/logger";
import { auditEnvConfigChange, EnvConfigServiceError, listEnvConfigEntries } from "@/backend/services";
import type {
  EnvConfigDeleteReturnType,
  EnvConfigEntry,
  EnvConfigUpsertInput,
  EnvConfigUpsertReturnType,
} from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

// ─── Object Types ─────────────────────────────────────────────────────────────

export const EnvConfigEntryRef = gqlSchemaBuilder.objectRef<EnvConfigEntry>("EnvConfigEntry");

export const EnvConfigEntryPothosObject = EnvConfigEntryRef.implement({
  fields: t => ({
    id: t.field({
      type: "String",
      resolve: entry => entry.key,
    }),
    key: t.exposeString("key"),
    category: t.exposeString("category"),
    displayStrategy: t.exposeString("displayStrategy"),
    description: t.expose("description", { type: "LocalizedString" }),
    isSecret: t.exposeBoolean("isSecret"),
    excludeFromDb: t.exposeBoolean("excludeFromDb"),
    value: t.exposeString("value", { nullable: true }),
    source: t.exposeString("source"),
    hasDbOverride: t.exposeBoolean("hasDbOverride"),
    editable: t.exposeBoolean("editable"),
  }),
});

export const EnvConfigUpsertResultRef = gqlSchemaBuilder.objectRef<EnvConfigUpsertReturnType>("EnvConfigUpsertResult");

export const EnvConfigUpsertResultPothosObject = EnvConfigUpsertResultRef.implement({
  fields: t => ({
    id: t.field({
      type: "String",
      resolve: result => result.key,
    }),
    key: t.exposeString("key"),
    source: t.exposeString("source"),
    hasDbOverride: t.exposeBoolean("hasDbOverride"),
    updatedAt: t.expose("updatedAt", { type: "DateTime" }),
  }),
});

export const EnvConfigDeleteResultRef = gqlSchemaBuilder.objectRef<EnvConfigDeleteReturnType>("EnvConfigDeleteResult");

export const EnvConfigDeleteResultPothosObject = EnvConfigDeleteResultRef.implement({
  fields: t => ({
    id: t.field({
      type: "String",
      resolve: result => result.key,
    }),
    key: t.exposeString("key"),
    deleted: t.exposeBoolean("deleted"),
    source: t.exposeString("source"),
  }),
});

// ─── Input Types ──────────────────────────────────────────────────────────────

export const EnvConfigUpsertInputPothosObject = gqlSchemaBuilder
  .inputRef<EnvConfigUpsertInput>("EnvConfigUpsertInput")
  .implement({
    fields: t => ({
      key: t.string({ required: true, directives: { constraint: { maxLength: 100 } } }),
      value: t.string({ required: true, directives: { constraint: { maxLength: 2000 } } }),
    }),
  });

// ─── Helpers ──────────────────────────────────────────────────────────────────

export async function findEnvConfigEntry(key: string): Promise<EnvConfigEntry | null> {
  const entries = await listEnvConfigEntries();
  return entries.find(entry => entry.key === key) ?? null;
}

/**
 * Projects an unrecognized resolver error into stable, non-sensitive metadata
 * (the error class name and a driver/domain code) for logging and for the
 * thrown GraphQL error's extensions.
 *
 * Why the message is dropped: drizzle (1.0.0-rc.4) wraps failed queries in a
 * `DrizzleQueryError` whose own `message` embeds the FULL bound parameters —
 * for an `env::` override upsert that includes the plaintext override VALUE,
 * which for secret keys (e.g. `WHATSAPP_VERIFY_TOKEN`) is credential material.
 * A raw rethrow would echo that message through the GraphQL error response.
 * Detection of the wrapper is structural (`query`/`params` fields), not
 * name-based, but the projection does not even need it: the message is
 * unconditionally dropped for unknown errors. What survives — only stable
 * identifiers, never message/params/detail — is the error class name and the
 * first string `code` found on the error or its driver-level `cause`
 * (e.g. a Postgres SQLSTATE), which carries no user data.
 */
function toSafeErrorProjection(error: unknown): { name: string; code?: string } {
  if (typeof error !== "object" || error === null) {
    return { name: "UnknownError" };
  }
  const source = error as {
    name?: unknown;
    code?: unknown;
    cause?: unknown;
  };
  const cause = typeof source.cause === "object" && source.cause !== null ? source.cause : undefined;
  // `in` narrowing keeps the cause's code readable without a type assertion —
  // the cause's shape stays fully opaque otherwise.
  const causeCode = cause !== undefined && "code" in cause ? cause.code : undefined;
  const code = [source.code, causeCode].find(value => typeof value === "string");
  return {
    name: typeof source.name === "string" ? source.name : "UnknownError",
    ...(typeof code === "string" ? { code } : {}),
  };
}

export function handleEnvConfigServiceError(error: unknown, tErrors: ErrorsLabels): never {
  if (error instanceof EnvConfigServiceError) {
    const message = error.code === "ENOT_IN_REGISTRY" ? tErrors.notFound : tErrors.invalidInput;
    throw new GraphQLError(message, {
      extensions: { code: error.code },
    });
  }

  // Unknown/unrecognized error: never rethrow raw. The original message can
  // embed bound query parameters (plaintext override values on an
  // upsertSetting failure), so the resolver surfaces the stable localized
  // internal-server-error copy plus the projected name/code only — and the
  // log line carries the same projection (no params). The original error is
  // deliberately NOT attached as `originalError`/`cause` so it can never
  // leak through error serializers.
  const projected = toSafeErrorProjection(error);
  logger.error(
    `env-config resolver: unexpected error of type "${projected.name}"${
      projected.code ? ` (code: ${projected.code})` : ""
    } — original message suppressed (may embed bound query parameters)`
  );
  throw new GraphQLError(tErrors.internalServerError, {
    extensions: {
      code: "INTERNAL_SERVER_ERROR",
      errorName: projected.name,
      ...(projected.code ? { errorCode: projected.code } : {}),
    },
  });
}

export async function resolveEnvConfigAuthCtx(
  ctx: BaseContext
): Promise<{ actorUserId: string; tErrors: ErrorsLabels }> {
  const actorUserId = await requireAuth(ctx);
  const tErrors = ctx.t().errorsTranslations;
  return { actorUserId, tErrors };
}

export function canViewEnvironmentConfig(ctx: BaseContext): boolean {
  return (
    ctx.isSuperAdmin ||
    ctx.permissions.includes(AppPermission.SETTINGS_VIEW) ||
    ctx.permissions.includes(AppPermission.SETTINGS_EDIT_ENV)
  );
}

export function assertCanViewEnvironmentConfig(ctx: BaseContext, tErrors: ErrorsLabels): void {
  if (!canViewEnvironmentConfig(ctx)) {
    throw new GraphQLError(tErrors.insufficientPermissions, {
      extensions: { code: "FORBIDDEN" },
    });
  }
}

/**
 * Executes an env config mutation with standard auth, audit, and error handling.
 * Extracts the common pattern from upsert/delete mutations to eliminate duplication.
 */
export async function executeEnvConfigMutation<TResult>(
  ctx: BaseContext,
  key: string,
  operation: "upsert" | "delete",
  mutationFn: () => Promise<TResult>,
  auditValue?: string,
  priorValue?: string
): Promise<TResult> {
  const { actorUserId, tErrors } = await resolveEnvConfigAuthCtx(ctx);
  const priorEntry = await findEnvConfigEntry(key);

  try {
    const result = await mutationFn();
    await auditEnvConfigChange(actorUserId, operation, key, priorEntry?.value ?? priorValue, auditValue);
    return result;
  } catch (error) {
    return handleEnvConfigServiceError(error, tErrors);
  }
}

// ─── Queries ──────────────────────────────────────────────────────────────────

// ─── Mutations ────────────────────────────────────────────────────────────────
