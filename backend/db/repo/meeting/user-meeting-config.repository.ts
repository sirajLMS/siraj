import { and, asc, eq } from "drizzle-orm";
import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { userMeetingConfigs } from "@/backend/db/schema";
import { getBackendTranslations } from "@/backend/lib/intl";
import { logger } from "@/backend/lib/logger";
import type {
  UpdateUserMeetingConfigInput,
  UserMeetingConfigInsertType,
  UserMeetingConfigSelectType,
} from "@/backend/types/meeting/meeting-config.types";

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
    tx?: DBTransaction,
    locale?: string
  ): Promise<UserMeetingConfigSelectType> {
    const row = await getById(id, tx, locale);
    if (!row) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("meetingConfigNotFound", { id }));
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
    tx?: DBTransaction,
    locale?: string
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
        const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
        throw new Error(tFunc("meetingConfigCreateFailed"));
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
    tx?: DBTransaction,
    locale?: string
  ): Promise<UserMeetingConfigSelectType> {
    const run = async (t: DBTransaction): Promise<UserMeetingConfigSelectType> => {
      const existing = await getByIdOrThrow(id, t, locale);

      if (input.isDefault === true) {
        await clearDefault(existing.userId, t);
      }

      const [result] = await t
        .update(userMeetingConfigs)
        .set({
          ...(input.providerId !== undefined ? { providerId: input.providerId } : {}),
          ...(input.label !== undefined ? { label: input.label } : {}),
          ...(input.isDefault !== undefined ? { isDefault: input.isDefault } : {}),
          ...(input.details !== undefined ? { details: input.details } : {}),
          ...(input.encryptedSecret !== undefined ? { encryptedSecret: input.encryptedSecret } : {}),
          updatedAt: new Date(),
        })
        .where(eq(userMeetingConfigs.id, id))
        .returning();

      if (!result) {
        const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
        throw new Error(tFunc("meetingConfigUpdateFailed"));
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
    tx?: DBTransaction,
    locale?: string
  ): Promise<UserMeetingConfigSelectType> {
    const run = async (t: DBTransaction): Promise<UserMeetingConfigSelectType> => {
      const existing = await getByIdOrThrow(id, t, locale);
      await clearDefault(existing.userId, t);
      return update(id, { isDefault: true }, t, locale);
    };

    if (tx) {
      return run(tx);
    }
    return db.transaction(run);
  }

  export async function deleteConfig(id: string, tx?: DBTransaction, locale?: string): Promise<void> {
    const run = async (t: DBTransaction): Promise<void> => {
      await getByIdOrThrow(id, t, locale);
      await t.delete(userMeetingConfigs).where(eq(userMeetingConfigs.id, id));
    };

    if (tx) {
      await run(tx);
      return;
    }
    await db.transaction(run);
  }
}
