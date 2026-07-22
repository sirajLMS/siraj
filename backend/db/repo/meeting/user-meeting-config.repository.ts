import { and, asc, eq, isNull } from "drizzle-orm";
import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { upsertManyWith } from "@/backend/db/repo/meeting/upsert-utils";
import { userMeetingConfigs } from "@/backend/db/schema";
import { logger } from "@/backend/lib/logger";
import type {
  UpdateUserMeetingConfigInput,
  UserMeetingConfigInsertType,
  UserMeetingConfigSelectType,
} from "@/backend/types/meeting/meeting-config.types";
import type { ErrorsLabels } from "@/shared/locale";

export namespace UserMeetingConfigRepository {
  export async function listByUserId(userId: string, tx?: DBTransaction): Promise<UserMeetingConfigSelectType[]> {
    const client = tx ?? db;
    return client
      .select()
      .from(userMeetingConfigs)
      .where(eq(userMeetingConfigs.userId, userId))
      .orderBy(asc(userMeetingConfigs.createdAt));
  }

  export async function getById(
    id: string,
    tx?: DBTransaction,
    _locale?: string
  ): Promise<UserMeetingConfigSelectType | null> {
    const client = tx ?? db;
    const [row] = await client.select().from(userMeetingConfigs).where(eq(userMeetingConfigs.id, id)).limit(1);
    return row ?? null;
  }

  export async function getByIdOrThrow(
    id: string,
    tErrors: ErrorsLabels,
    tx?: DBTransaction,
    locale?: string
  ): Promise<UserMeetingConfigSelectType> {
    const row = await getById(id, tx, locale);
    if (!row) {
      throw new Error(tErrors.meetingConfigNotFound(id));
    }
    return row;
  }

  export async function getDefaultForUser(
    userId: string,
    tx?: DBTransaction
  ): Promise<UserMeetingConfigSelectType | null> {
    const client = tx ?? db;
    const [row] = await client
      .select()
      .from(userMeetingConfigs)
      .where(and(eq(userMeetingConfigs.userId, userId), eq(userMeetingConfigs.isDefault, true)))
      .limit(1);
    return row ?? null;
  }

  export async function clearDefault(userId: string, tx: DBTransaction): Promise<void> {
    await tx
      .update(userMeetingConfigs)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(and(eq(userMeetingConfigs.userId, userId), eq(userMeetingConfigs.isDefault, true)));
  }

  export async function create(
    input: UserMeetingConfigInsertType,
    tErrors: ErrorsLabels,
    tx?: DBTransaction
  ): Promise<UserMeetingConfigSelectType> {
    const run = async (t: DBTransaction): Promise<UserMeetingConfigSelectType> => {
      if (input.isDefault) {
        await clearDefault(input.userId, t);
      }

      const now = new Date();
      const [result] = await t
        .insert(userMeetingConfigs)
        .values({
          userId: input.userId,
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

      logger.info("User meeting config created", { configId: result.id, userId: result.userId });
      return result;
    };

    if (tx) {
      return run(tx);
    }
    return db.transaction(run);
  }

  export async function update(
    id: string,
    input: UpdateUserMeetingConfigInput & {
      details?: UserMeetingConfigInsertType["details"];
      encryptedSecret?: string | null;
    },
    tErrors: ErrorsLabels,
    tx?: DBTransaction
  ): Promise<UserMeetingConfigSelectType> {
    const run = async (t: DBTransaction): Promise<UserMeetingConfigSelectType> => {
      const existing = await getByIdOrThrow(id, tErrors, t);

      if (input.isDefault === true) {
        await clearDefault(existing.userId, t);
      }

      const updateData: Partial<{
        providerId: string;
        label: string | null;
        isDefault: boolean;
        details: UserMeetingConfigInsertType["details"];
        encryptedSecret: string | null;
        updatedAt: Date;
      }> = {
        updatedAt: new Date(),
      };

      if (input.providerId !== undefined) {
        updateData.providerId = input.providerId;
      }
      if (input.label !== undefined) {
        updateData.label = input.label;
      }
      if (input.isDefault !== undefined) {
        updateData.isDefault = input.isDefault;
      }
      if (input.details !== undefined) {
        updateData.details = input.details;
      }
      if (input.encryptedSecret !== undefined) {
        updateData.encryptedSecret = input.encryptedSecret;
      }

      const [result] = await t
        .update(userMeetingConfigs)
        .set(updateData)
        .where(eq(userMeetingConfigs.id, id))
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
  ): Promise<UserMeetingConfigSelectType> {
    const run = async (t: DBTransaction): Promise<UserMeetingConfigSelectType> => {
      const existing = await getByIdOrThrow(id, tErrors, t);
      await clearDefault(existing.userId, t);
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
      await t.delete(userMeetingConfigs).where(eq(userMeetingConfigs.id, id));
    };

    if (tx) {
      await run(tx);
      return;
    }
    await db.transaction(run);
  }

  function labelCondition(label: string | null | undefined) {
    return label ? eq(userMeetingConfigs.label, label) : isNull(userMeetingConfigs.label);
  }

  export async function findByUserProviderLabel(
    userId: string,
    providerId: string,
    label: string | null | undefined,
    tx?: DBTransaction
  ): Promise<UserMeetingConfigSelectType | null> {
    const client = tx ?? db;
    const [row] = await client
      .select()
      .from(userMeetingConfigs)
      .where(
        and(eq(userMeetingConfigs.userId, userId), eq(userMeetingConfigs.providerId, providerId), labelCondition(label))
      )
      .limit(1);
    return row ?? null;
  }

  export async function upsertMany(
    inputs: readonly UserMeetingConfigInsertType[],
    tErrors: ErrorsLabels,
    tx?: DBTransaction
  ): Promise<UserMeetingConfigSelectType[]> {
    return upsertManyWith(
      inputs,
      (input, t) => findByUserProviderLabel(input.userId, input.providerId, input.label, t),
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
