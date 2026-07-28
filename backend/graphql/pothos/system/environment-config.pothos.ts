import { GraphQLError } from "graphql";
import { AppPermission } from "@/backend/enum";
import type { BaseContext } from "@/backend/graphql/gqlContext";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import {
  auditEnvConfigChange,
  deleteEnvConfigOverride,
  EnvConfigServiceError,
  listEnvConfigEntries,
  upsertEnvConfigOverride,
} from "@/backend/services/system/environment-config.service";
import type {
  EnvConfigDeleteReturnType,
  EnvConfigEntry,
  EnvConfigUpsertInput,
  EnvConfigUpsertReturnType,
} from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

// ─── Object Types ─────────────────────────────────────────────────────────────

const EnvConfigEntryRef = gqlSchemaBuilder.objectRef<EnvConfigEntry>("EnvConfigEntry");

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

const EnvConfigUpsertResultRef = gqlSchemaBuilder.objectRef<EnvConfigUpsertReturnType>("EnvConfigUpsertResult");

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

const EnvConfigDeleteResultRef = gqlSchemaBuilder.objectRef<EnvConfigDeleteReturnType>("EnvConfigDeleteResult");

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
      key: t.string({ required: true }),
      value: t.string({ required: true }),
    }),
  });

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function findEnvConfigEntry(key: string): Promise<EnvConfigEntry | undefined> {
  const entries = await listEnvConfigEntries();
  return entries.find(entry => entry.key === key);
}

function handleEnvConfigServiceError(error: unknown, tErrors: ErrorsLabels): never {
  if (error instanceof EnvConfigServiceError) {
    const message = error.code === "ENOT_IN_REGISTRY" ? tErrors.notFound : tErrors.invalidInput;
    throw new GraphQLError(message, {
      extensions: { code: error.code },
    });
  }

  throw error;
}

async function resolveAuthCtx(ctx: BaseContext): Promise<{ actorUserId: string; tErrors: ErrorsLabels }> {
  const actorUserId = await requireAuth(ctx);
  const tErrors = ctx.t().errorsTranslations;
  return { actorUserId, tErrors };
}

function canViewEnvironmentConfig(ctx: BaseContext): boolean {
  return (
    ctx.isSuperAdmin ||
    ctx.permissions.includes(AppPermission.SETTINGS_VIEW) ||
    ctx.permissions.includes(AppPermission.SETTINGS_EDIT_ENV)
  );
}

function assertCanViewEnvironmentConfig(ctx: BaseContext, tErrors: ErrorsLabels): void {
  if (!canViewEnvironmentConfig(ctx)) {
    throw new GraphQLError(tErrors.insufficientPermissions, {
      extensions: { code: "FORBIDDEN" },
    });
  }
}

// ─── Queries ──────────────────────────────────────────────────────────────────

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

// ─── Mutations ────────────────────────────────────────────────────────────────

gqlSchemaBuilder.mutationField("upsertEnvConfigEntry", t =>
  t.field({
    type: EnvConfigUpsertResultPothosObject,
    authScopes: { permission: AppPermission.SETTINGS_EDIT_ENV, notImpersonating: true },
    args: {
      input: t.arg({ type: EnvConfigUpsertInputPothosObject, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const { actorUserId, tErrors } = await resolveAuthCtx(ctx);
      const priorEntry = await findEnvConfigEntry(args.input.key);

      try {
        const result = await upsertEnvConfigOverride(args.input);
        await auditEnvConfigChange(actorUserId, "upsert", args.input.key, priorEntry?.value, args.input.value);
        return result;
      } catch (error) {
        return handleEnvConfigServiceError(error, tErrors);
      }
    },
  })
);

gqlSchemaBuilder.mutationField("deleteEnvConfigEntry", t =>
  t.field({
    type: EnvConfigDeleteResultPothosObject,
    authScopes: { permission: AppPermission.SETTINGS_EDIT_ENV, notImpersonating: true },
    args: {
      key: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const { actorUserId, tErrors } = await resolveAuthCtx(ctx);
      const priorEntry = await findEnvConfigEntry(args.key);

      try {
        const result = await deleteEnvConfigOverride(args.key);
        await auditEnvConfigChange(actorUserId, "delete", args.key, priorEntry?.value);
        return result;
      } catch (error) {
        return handleEnvConfigServiceError(error, tErrors);
      }
    },
  })
);
