import type { EnvConfigEntryFieldsFragment } from "@/frontend/common/graphql/generated/gql/graphql";
import { isEnvConfigSecretEntry } from "@/frontend/common/views/dashboard/settings/utils/environmentConfig.utils";

export function getEnvConfigDisplayValue(
  entry: EnvConfigEntryFieldsFragment,
  draftValues: Readonly<Record<string, string>>
): string {
  const key = entry.key ?? "";
  if (key in draftValues) {
    return draftValues[key] ?? "";
  }

  return entry.value ?? "";
}

export function isEnvConfigEntryDirty(
  entry: EnvConfigEntryFieldsFragment,
  draftValues: Readonly<Record<string, string>>
): boolean {
  const key = entry.key ?? "";
  if (!key || !(key in draftValues)) {
    return false;
  }

  const draftValue = draftValues[key] ?? "";
  if (isEnvConfigSecretEntry(entry)) {
    return draftValue.trim().length > 0;
  }

  return draftValue !== (entry.value ?? "");
}

export function isEnvConfigEntrySaving(key: string, savingKeys: Readonly<Record<string, boolean>>): boolean {
  return savingKeys[key];
}
