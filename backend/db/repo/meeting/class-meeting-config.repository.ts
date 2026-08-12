import { and, asc, eq } from "drizzle-orm";
import { queryDb } from "@/backend/db";
import { db } from "@/backend/db/drizzleDb";
import {
  buildMeetingConfigInsertValues,
  buildMeetingConfigUpdatePayload,
  labelCondition,
  requireConfigOrThrow,
} from "@/backend/db/repo/meeting/__shared__/meetingConfigRepoHelpers";
import { upsertManyWith } from "@/backend/db/repo/meeting/upsert-utils";
import { classMeetingConfigs } from "@/backend/db/schema";
import { logger } from "@/backend/lib/logger";
import type { DBTransaction } from "@/backend/types";
import type {
  ClassMeetingConfigInsertType,
  ClassMeetingConfigSelectType,
  UpdateClassMeetingConfigInput,
} from "@/backend/types/meeting/class-meeting-config.types";
import type { ErrorsLabels } from "@/shared/locale";

type ClassScope = { readonly classInstanceId: string };
type RecurringScope = { readonly recurringScheduleId: string };
export type ClassMeetingConfigScopeFilter = ClassScope | RecurringScope;

function scopeCondition(scope: ClassMeetingConfigScopeFilter) {
  return "classInstanceId" in scope
    ? eq(classMeetingConfigs.classInstanceId, scope.classInstanceId)
    : eq(classMeetingConfigs.recurringScheduleId, scope.recurringScheduleId);
}

export namespace ClassMeetingConfigRepository {
  export async function listByScope(
    scope: ClassMeetingConfigScopeFilter,
    tx?: DBTransaction
  ): Promise<ClassMeetingConfigSelectType[]> {
    const client = queryDb(tx);
    return client
      .select()
      .from(classMeetingConfigs)
      .where(scopeCondition(scope))
      .orderBy(asc(classMeetingConfigs.createdAt));
  }

  export async function getById(
    id: string,
    tx?: DBTransaction,
    _locale?: string
  ): Promise<ClassMeetingConfigSelectType | null> {
    const client = queryDb(tx);
    const [row] = await client.select().from(classMeetingConfigs).where(eq(classMeetingConfigs.id, id)).limit(1);
    return row ?? null;
  }

  export async function getByIdOrThrow(
    id: string,
    tErrors: ErrorsLabels,
    tx?: DBTransaction
  ): Promise<ClassMeetingConfigSelectType> {
    const row = await getById(id, tx);
    return requireConfigOrThrow(row, id, tErrors);
  }

  async function getDefaultForScope(
    scope: ClassMeetingConfigScopeFilter,
    tx?: DBTransaction
  ): Promise<ClassMeetingConfigSelectType | null> {
    const client = queryDb(tx);
    const [row] = await client
      .select()
      .from(classMeetingConfigs)
      .where(and(scopeCondition(scope), eq(classMeetingConfigs.isDefault, true)))
      .limit(1);
    return row ?? null;
  }

  export async function getDefaultForClassInstance(
    classInstanceId: string,
    tx?: DBTransaction
  ): Promise<ClassMeetingConfigSelectType | null> {
    return getDefaultForScope({ classInstanceId }, tx);
  }

  export async function getDefaultForRecurringSchedule(
    recurringScheduleId: string,
    tx?: DBTransaction
  ): Promise<ClassMeetingConfigSelectType | null> {
    return getDefaultForScope({ recurringScheduleId }, tx);
  }

  async function clearDefault(scope: ClassMeetingConfigScopeFilter, tx: DBTransaction): Promise<void> {
    await tx
      .update(classMeetingConfigs)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(and(scopeCondition(scope), eq(classMeetingConfigs.isDefault, true)));
  }

  function resolveScope(input: ClassMeetingConfigInsertType): ClassMeetingConfigScopeFilter {
    if (input.classInstanceId) {
      return { classInstanceId: input.classInstanceId };
    }
    if (input.recurringScheduleId) {
      return { recurringScheduleId: input.recurringScheduleId };
    }
    throw new Error("Class meeting config requires classInstanceId or recurringScheduleId");
  }

  export async function create(
    input: ClassMeetingConfigInsertType,
    tErrors: ErrorsLabels,
    tx?: DBTransaction
  ): Promise<ClassMeetingConfigSelectType> {
    const run = async (t: DBTransaction): Promise<ClassMeetingConfigSelectType> => {
      const scope = resolveScope(input);

      if (input.isDefault) {
        await clearDefault(scope, t);
      }

      const now = new Date();
      const [result] = await t
        .insert(classMeetingConfigs)
        .values({
          classInstanceId: input.classInstanceId ?? null,
          recurringScheduleId: input.recurringScheduleId ?? null,
          ...buildMeetingConfigInsertValues(input, now),
        })
        .returning();

      if (!result) {
        throw new Error(tErrors.meetingConfigCreateFailed);
      }

      logger.info("Class meeting config created", {
        configId: result.id,
        classInstanceId: result.classInstanceId,
        recurringScheduleId: result.recurringScheduleId,
      });
      return result;
    };

    if (tx) {
      return run(tx);
    }
    return db.transaction(run);
  }

  export async function update(
    id: string,
    input: UpdateClassMeetingConfigInput & {
      details?: ClassMeetingConfigInsertType["details"];
      encryptedSecret?: string | null;
      providerId?: string;
      providerMetadata?: Record<string, unknown> | null;
    },
    tErrors: ErrorsLabels,
    tx?: DBTransaction
  ): Promise<ClassMeetingConfigSelectType> {
    const run = async (t: DBTransaction): Promise<ClassMeetingConfigSelectType> => {
      const existing = await getByIdOrThrow(id, tErrors, t);
      const scope = resolveScope(existing);

      if (input.isDefault === true) {
        await clearDefault(scope, t);
      }

      const updateData: Record<string, unknown> = { updatedAt: new Date() };

      const UPDATABLE_KEYS = [
        "label",
        "isDefault",
        "details",
        "encryptedSecret",
        "providerId",
        "providerMetadata",
      ] as const;

      for (const key of UPDATABLE_KEYS) {
        if (key in input) {
          updateData[key] = input[key];
        }
      }

      const [result] = await t
        .update(classMeetingConfigs)
        .set(updateData)
        .where(eq(classMeetingConfigs.id, id))
        .returning();

      if (!result) {
        throw new Error(tErrors.meetingConfigUpdateFailed);
      }

      return result;
    };

    if (tx) {
      return run(tx);
    }
    return db.transaction(run);
  }

  export async function findByScopeProviderLabel(
    scope: ClassMeetingConfigScopeFilter,
    providerId: string,
    label: string | null | undefined,
    tx?: DBTransaction
  ): Promise<ClassMeetingConfigSelectType | null> {
    const client = queryDb(tx);
    const [row] = await client
      .select()
      .from(classMeetingConfigs)
      .where(
        and(
          scopeCondition(scope),
          eq(classMeetingConfigs.providerId, providerId),
          labelCondition(classMeetingConfigs.label, label)
        )
      )
      .limit(1);
    return row ?? null;
  }

  export async function upsertMany(
    inputs: readonly ClassMeetingConfigInsertType[],
    tErrors: ErrorsLabels,
    tx?: DBTransaction
  ): Promise<ClassMeetingConfigSelectType[]> {
    return upsertManyWith(
      inputs,
      (input, t) => {
        const scope = resolveScope(input);
        return findByScopeProviderLabel(scope, input.providerId, input.label, t);
      },
      (input, t) => create(input, tErrors, t),
      (id, input, t) => update(id, buildMeetingConfigUpdatePayload(input), tErrors, t),
      tErrors,
      tx
    );
  }

  export async function setDefault(
    id: string,
    tErrors: ErrorsLabels,
    tx?: DBTransaction
  ): Promise<ClassMeetingConfigSelectType> {
    return update(id, { isDefault: true }, tErrors, tx);
  }

  export async function deleteConfig(id: string, _tErrors: ErrorsLabels, tx?: DBTransaction): Promise<void> {
    const client = tx ?? db;
    await client.delete(classMeetingConfigs).where(eq(classMeetingConfigs.id, id));
  }
}
