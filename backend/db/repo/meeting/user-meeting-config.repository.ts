import { and, asc, eq, inArray } from "drizzle-orm";
import { db, queryDb } from "@/backend/db";
import {
  buildMeetingConfigInsertValues,
  buildMeetingConfigUpdatePayload,
  labelCondition,
  requireConfigOrThrow,
} from "@/backend/db/repo/meeting/__shared__/meetingConfigRepoHelpers";
import { upsertManyWith } from "@/backend/db/repo/meeting/upsert-utils";
import { userMeetingConfigs } from "@/backend/db/schema";
import { logger } from "@/backend/lib/logger";
import type {
  DBTransaction,
  UpdateUserMeetingConfigInput,
  UserMeetingConfigInsertType,
  UserMeetingConfigSelectType,
} from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

export namespace UserMeetingConfigRepository {
  export async function listByUserId(userId: string, tx?: DBTransaction): Promise<UserMeetingConfigSelectType[]> {
    const client = queryDb(tx);
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
    const client = queryDb(tx);
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
    return requireConfigOrThrow(row, id, tErrors);
  }

  export async function getDefaultForUser(
    userId: string,
    tx?: DBTransaction
  ): Promise<UserMeetingConfigSelectType | null> {
    const client = queryDb(tx);
    const [row] = await client
      .select()
      .from(userMeetingConfigs)
      .where(and(eq(userMeetingConfigs.userId, userId), eq(userMeetingConfigs.isDefault, true)))
      .limit(1);
    return row ?? null;
  }

  export async function getDefaultsForUsers(
    userIds: readonly string[],
    tx?: DBTransaction
  ): Promise<UserMeetingConfigSelectType[]> {
    if (userIds.length === 0) return [];
    const client = queryDb(tx);
    return client
      .select()
      .from(userMeetingConfigs)
      .where(and(inArray(userMeetingConfigs.userId, [...userIds]), eq(userMeetingConfigs.isDefault, true)));
  }

  async function clearDefault(userId: string, tx: DBTransaction): Promise<void> {
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
          ...buildMeetingConfigInsertValues(input, now),
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
      providerMetadata?: Record<string, unknown> | null;
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
        providerMetadata: Record<string, unknown> | null;
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
      if (input.providerMetadata !== undefined) {
        updateData.providerMetadata = input.providerMetadata;
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

  async function findByUserProviderLabel(
    userId: string,
    providerId: string,
    label: string | null | undefined,
    tx?: DBTransaction
  ): Promise<UserMeetingConfigSelectType | null> {
    const client = queryDb(tx);
    const [row] = await client
      .select()
      .from(userMeetingConfigs)
      .where(
        and(
          eq(userMeetingConfigs.userId, userId),
          eq(userMeetingConfigs.providerId, providerId),
          labelCondition(userMeetingConfigs.label, label)
        )
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
      (id, input, t) => update(id, buildMeetingConfigUpdatePayload(input), tErrors, t),
      tErrors,
      tx
    );
  }
}
