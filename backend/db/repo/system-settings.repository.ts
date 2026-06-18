import { eq } from "drizzle-orm";
import type { SystemSettingSelectType } from "@/backend/types";
import { db } from "../drizzleDb";
import { systemSettings } from "../schema/settings";

type DBTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

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
}
