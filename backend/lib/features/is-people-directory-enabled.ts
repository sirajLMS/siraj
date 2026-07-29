import { resolveEnvConfig } from "@/backend/lib/env-config-resolver";
import { PEOPLE_DIRECTORY_ENV_KEY, parseEnvConfigBoolean } from "@/shared/constants/features/sidebarFeatures.constants";

/**
 * Resolves whether the consolidated People directory (`/people`) is enabled.
 * DB override wins over `process.env` via `resolveEnvConfig`.
 */
export async function isPeopleDirectoryEnabled(): Promise<boolean> {
  const value = await resolveEnvConfig(PEOPLE_DIRECTORY_ENV_KEY);
  return parseEnvConfigBoolean(value);
}
