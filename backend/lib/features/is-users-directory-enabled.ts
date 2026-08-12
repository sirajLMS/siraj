import { SystemSettingsRepository } from "@/backend/db/repo/shared";
import { invalidateEnvConfigCache, resolveEnvConfig } from "@/backend/services/system";
import { parseEnvConfigBoolean, USERS_DIRECTORY_ENV_KEY } from "@/shared/constants/features/sidebarFeatures.constants";

const LEGACY_PEOPLE_DIRECTORY_ENV_KEY = "NEXT_PUBLIC_ENABLE_PEOPLE_DIRECTORY" as const;
const ENV_SETTING_KEY_PREFIX = "env::";

/**
 * Resolves whether the consolidated Users directory (`/users`) is enabled.
 * DB override wins over `process.env` via `resolveEnvConfig`.
 */
export async function isUsersDirectoryEnabled(): Promise<boolean> {
  await migrateLegacyPeopleDirectorySettingIfNeeded();
  const value =
    (await resolveEnvConfig(USERS_DIRECTORY_ENV_KEY)) ?? (await resolveEnvConfig(LEGACY_PEOPLE_DIRECTORY_ENV_KEY));
  return parseEnvConfigBoolean(value);
}

async function migrateLegacyPeopleDirectorySettingIfNeeded(): Promise<void> {
  const newDbKey = `${ENV_SETTING_KEY_PREFIX}${USERS_DIRECTORY_ENV_KEY}`;
  const oldDbKey = `${ENV_SETTING_KEY_PREFIX}${LEGACY_PEOPLE_DIRECTORY_ENV_KEY}`;

  const newSetting = await SystemSettingsRepository.getByKey(newDbKey);
  if (newSetting?.value != null && newSetting.value !== "") {
    return;
  }

  const oldSetting = await SystemSettingsRepository.getByKey(oldDbKey);
  if (oldSetting?.value == null || oldSetting.value === "") {
    return;
  }

  await SystemSettingsRepository.upsertSetting({
    key: newDbKey,
    value: oldSetting.value,
    dataType: oldSetting.dataType,
    description: oldSetting.description ?? "",
    category: oldSetting.category,
  });
  await SystemSettingsRepository.deleteSetting(oldDbKey);
  invalidateEnvConfigCache(USERS_DIRECTORY_ENV_KEY);
  invalidateEnvConfigCache(LEGACY_PEOPLE_DIRECTORY_ENV_KEY);
}
