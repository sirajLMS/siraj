import { GraphQLError } from "graphql";
import { AppPermission } from "@/backend/enum";
import type { BaseContext } from "@/backend/graphql/gqlContext";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
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

export function handleEnvConfigServiceError(error: unknown, tErrors: ErrorsLabels): never {
  if (error instanceof EnvConfigServiceError) {
    const message = error.code === "ENOT_IN_REGISTRY" ? tErrors.notFound : tErrors.invalidInput;
    throw new GraphQLError(message, {
      extensions: { code: error.code },
    });
  }

  throw error;
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
