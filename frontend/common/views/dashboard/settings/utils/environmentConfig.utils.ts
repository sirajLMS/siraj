import type { EnvConfigEntryFieldsFragment } from "@/frontend/common/graphql/generated/gql/graphql";
import type { SettingsEnvironmentCategoryKey } from "@/shared/locale/types/dashboard/settings/environment";

const ENV_CONFIG_CATEGORY_ORDER: readonly SettingsEnvironmentCategoryKey[] = [
  "email",
  "sms",
  "push",
  "fx",
  "cache",
  "redis",
  "storage",
  "auth",
  "app",
  "meeting",
  "billing",
  "general",
] as const;

export type EnvConfigGroupedEntries = {
  readonly category: SettingsEnvironmentCategoryKey;
  readonly entries: readonly EnvConfigEntryFieldsFragment[];
};

function isSettingsEnvironmentCategoryKey(value: string): value is SettingsEnvironmentCategoryKey {
  return (ENV_CONFIG_CATEGORY_ORDER as readonly string[]).includes(value);
}

export function groupEnvConfigEntriesByCategory(
  entries: readonly EnvConfigEntryFieldsFragment[]
): EnvConfigGroupedEntries[] {
  const grouped = new Map<SettingsEnvironmentCategoryKey, EnvConfigEntryFieldsFragment[]>();

  for (const entry of entries) {
    const rawCategory = entry.category ?? "";
    const resolvedCategory: SettingsEnvironmentCategoryKey = isSettingsEnvironmentCategoryKey(rawCategory)
      ? rawCategory
      : "general";
    const bucket = grouped.get(resolvedCategory) ?? [];
    bucket.push(entry);
    grouped.set(resolvedCategory, bucket);
  }

  return ENV_CONFIG_CATEGORY_ORDER.filter(category => grouped.has(category)).map(category => ({
    category,
    entries: (grouped.get(category) ?? []).toSorted((left, right) => (left.key ?? "").localeCompare(right.key ?? "")),
  }));
}

export function resolveLocalizedEnvDescription(
  description: EnvConfigEntryFieldsFragment["description"],
  locale: "en" | "ar"
): string {
  if (!description) {
    return "";
  }

  return description[locale] ?? description.en ?? description.ar ?? "";
}

export function isEnvConfigSecretEntry(entry: EnvConfigEntryFieldsFragment): boolean {
  return entry.isSecret === true || entry.displayStrategy === "db_with_mask_only";
}
