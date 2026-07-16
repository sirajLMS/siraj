import { and, asc, eq, isNull } from "drizzle-orm";
import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { upsertManyWith } from "@/backend/db/repo/meeting/upsert-utils";
import { classMeetingConfigs } from "@/backend/db/schema";
import { logger } from "@/backend/lib/logger";
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
    const client = tx ?? db;
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
    const client = tx ?? db;
    const [row] = await client.select().from(classMeetingConfigs).where(eq(classMeetingConfigs.id, id)).limit(1);
    return row ?? null;
  }

  export async function getByIdOrThrow(
    id: string,
    tErrors: ErrorsLabels,
    tx?: DBTransaction
  ): Promise<ClassMeetingConfigSelectType> {
    const row = await getById(id, tx);
    if (!row) {
      throw new Error(tErrors.meetingConfigNotFound(id));
    }
    return row;
  }

  async function getDefaultForScope(
    scope: ClassMeetingConfigScopeFilter,
    tx?: DBTransaction
  ): Promise<ClassMeetingConfigSelectType | null> {
    const client = tx ?? db;
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
          providerId: input.providerId,
          label: input.label ?? null,
          isDefault: input.isDefault,
          details: input.details,
          encryptedSecret: input.encryptedSecret ?? null,
          createdAt: now,
          updatedAt: now,
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

      const [result] = await t
        .update(classMeetingConfigs)
        .set({
          ...(input.label !== undefined ? { label: input.label } : {}),
          ...(input.isDefault !== undefined ? { isDefault: input.isDefault } : {}),
          ...(input.details !== undefined ? { details: input.details } : {}),
          ...(input.encryptedSecret !== undefined ? { encryptedSecret: input.encryptedSecret } : {}),
          ...(input.providerId !== undefined ? { providerId: input.providerId } : {}),
          updatedAt: new Date(),
        })
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

  export async function setDefault(
    id: string,
    tErrors: ErrorsLabels,
    tx?: DBTransaction
  ): Promise<ClassMeetingConfigSelectType> {
    const run = async (t: DBTransaction): Promise<ClassMeetingConfigSelectType> => {
      const existing = await getByIdOrThrow(id, tErrors, t);
      const scope = resolveScope(existing);
      await clearDefault(scope, t);
      return update(id, { isDefault: true }, tErrors, t);
    };

    if (tx) {
      return run(tx);
    }
    return db.transaction(run);
  }

  export async function deleteConfig(id: string, tErrors: ErrorsLabels, tx?: DBTransaction): Promise<void> {
    const run = async (t: DBTransaction): Promise<void> => {
      await getByIdOrThrow(id, tErrors, t);
      await t.delete(classMeetingConfigs).where(eq(classMeetingConfigs.id, id));
    };

    if (tx) {
      await run(tx);
      return;
    }
    await db.transaction(run);
  }

  function labelCondition(label: string | null | undefined) {
    return label ? eq(classMeetingConfigs.label, label) : isNull(classMeetingConfigs.label);
  }

  export async function findByScopeProviderLabel(
    scope: ClassMeetingConfigScopeFilter,
    providerId: string,
    label: string | null | undefined,
    tx?: DBTransaction
  ): Promise<ClassMeetingConfigSelectType | null> {
    const client = tx ?? db;
    const [row] = await client
      .select()
      .from(classMeetingConfigs)
      .where(and(scopeCondition(scope), eq(classMeetingConfigs.providerId, providerId), labelCondition(label)))
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
      (id, input, t) =>
        update(
          id,
          {
            label: input.label,
            isDefault: input.isDefault,
            details: input.details,
            encryptedSecret: input.encryptedSecret,
            providerId: input.providerId,
          },
          tErrors,
          t
        ),
      tErrors,
      tx
    );
  }
}
