import { eq } from "drizzle-orm";
import { queryDb as queryDbFn } from "@/backend/db";
import { db } from "@/backend/db/drizzleDb";
import { systemSettings } from "@/backend/db/schema/shared/settings";
import type { DBTransaction, SystemSettingSelectType, SystemSettingUpsertInput } from "@/backend/types";
import {
  SystemSettingCategory as SettingCategory,
  SystemSettingDataType as SettingDataType,
} from "@/shared/constants/settings/system-settings.enum";

export namespace SystemSettingsRepository {
  /**
   * Fetches a system setting by its key.
   */
  export async function getByKey(key: string, tx?: DBTransaction): Promise<SystemSettingSelectType | null> {
    const q = queryDbFn(tx);
    const [setting] = await q.select().from(systemSettings).where(eq(systemSettings.key, key)).limit(1);
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
   * Fetches a boolean system setting by key. Returns `null` when the row is missing
   * (mirrors the null-on-missing semantics of `getIntValue`'s fallback contract).
   * Parses `"true"`/`"false"` case-insensitively; returns `null` for unrecognized values.
   */
  export async function getBooleanValue(key: string, tx?: DBTransaction): Promise<boolean | null> {
    const setting = await getByKey(key, tx);
    if (setting?.value == null) {
      return null;
    }
    const normalized = setting.value.trim().toLowerCase();
    if (normalized === "true") {
      return true;
    }
    if (normalized === "false") {
      return false;
    }
    return null;
  }

  /**
   * Fetches a JSON system setting by key and parses it as `T`. Returns `null` when the
   * row is missing or the stored value is the empty string. Does NOT swallow
   * `SyntaxError` — invalid JSON propagates so callers can reseed the row.
   */
  export async function getJsonValue<T>(key: string, tx?: DBTransaction): Promise<T | null> {
    const setting = await getByKey(key, tx);
    if (setting?.value == null || setting.value === "") {
      return null;
    }
    const parsed: T = JSON.parse(setting.value);
    return parsed;
  }

  /**
   * Upserts a system setting. The caller is responsible for serializing the `value`
   * string appropriately (e.g. `String(true)` for boolean rows, `JSON.stringify` for json rows).
   */
  export async function upsertSetting(
    input: SystemSettingUpsertInput & {
      updatedByUserId?: string | null;
    },
    tx?: DBTransaction
  ): Promise<SystemSettingSelectType> {
    const q = tx ?? db;
    const now = new Date();
    const [inserted] = await q
      .insert(systemSettings)
      .values({
        key: input.key,
        value: input.value,
        dataType: input.dataType ?? SettingDataType.String,
        description: input.description ?? "",
        category: input.category ?? SettingCategory.System,
        updatedByUserId: input.updatedByUserId ?? null,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: {
          value: input.value,
          dataType: input.dataType ?? SettingDataType.String,
          description: input.description ?? "",
          category: input.category ?? SettingCategory.System,
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
    const q = tx ?? db;
    try {
      await q.delete(systemSettings).where(eq(systemSettings.key, key));
      return true;
    } catch {
      return false;
    }
  }
}
