import { eq } from "drizzle-orm";
import type { SystemSettingSelectType } from "@/backend/types";
import type { DBTransaction } from "../db.types";
import { db } from "../drizzleDb";
import { systemSettings } from "../schema/settings";

export namespace SystemSettingsRepository {
  /**
   * Fetches a system setting by its key.
   */
  export async function getByKey(key: string, tx?: DBTransaction): Promise<SystemSettingSelectType | null> {
    const queryDb = tx ?? db;
    const [setting] = await queryDb.select().from(systemSettings).where(eq(systemSettings.key, key)).limit(1);
    return setting ?? null;
  }

  /**
   * Fetches an integer system setting by key, falling back to defaultValue if missing or invalid.
   */
  export async function getIntValue(key: string, defaultValue: number, tx?: DBTransaction): Promise<number> {
    const setting = await getByKey(key, tx);
    if (setting?.value == null) {
      return defaultValue;
    }
    const parsed = Number.parseInt(setting.value, 10);
    return Number.isNaN(parsed) ? defaultValue : parsed;
  }

  /**
   * Fetches a string system setting by key, falling back to defaultValue if missing.
   */
  export async function getStringValue(key: string, defaultValue: string, tx?: DBTransaction): Promise<string> {
    const setting = await getByKey(key, tx);
    if (setting?.value == null) {
      return defaultValue;
    }
    return setting.value;
  }

  /**
   * Upserts a system setting.
   */
  export async function upsertSetting(
    input: {
      key: string;
      value: string;
      dataType?: "string" | "integer";
      description?: string;
      category?: string;
      updatedByUserId?: string | null;
    },
    tx?: DBTransaction
  ): Promise<SystemSettingSelectType> {
    const queryDb = tx ?? db;
    const now = new Date();
    const [inserted] = await queryDb
      .insert(systemSettings)
      .values({
        key: input.key,
        value: input.value,
        dataType: input.dataType ?? "string",
        description: input.description ?? "",
        category: input.category ?? "system",
        updatedByUserId: input.updatedByUserId ?? null,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: {
          value: input.value,
          dataType: input.dataType ?? "string",
          description: input.description ?? "",
          category: input.category ?? "system",
          updatedByUserId: input.updatedByUserId ?? null,
          updatedAt: now,
        },
      })
      .returning();
    return inserted;
  }

  /**
   * Deletes a system setting by key.
   */
  export async function deleteSetting(key: string, tx?: DBTransaction): Promise<boolean> {
    const queryDb = tx ?? db;
    try {
      await queryDb.delete(systemSettings).where(eq(systemSettings.key, key));
      return true;
    } catch {
      return false;
    }
  }
}
