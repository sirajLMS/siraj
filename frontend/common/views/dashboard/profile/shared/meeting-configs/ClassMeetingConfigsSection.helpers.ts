import type {
  ClassMeetingConfigFieldsFragment,
  ClassMeetingConfigsWithStatusQuery_classMeetingConfigs,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { resolveLocalizedString } from "@/shared/lib/localized-string";

export type StatusConfigEntry = ClassMeetingConfigsWithStatusQuery_classMeetingConfigs;

export type StatusMap = ReadonlyMap<string, StatusConfigEntry>;

export type IndicatorStatus = "pending" | "success" | "failed";

export function isClassMeetingConfig(config: unknown): config is ClassMeetingConfigFieldsFragment {
  if (typeof config !== "object" || config === null) return false;
  return "classInstanceId" in config;
}

export function configLabel(config: ClassMeetingConfigFieldsFragment, locale: string): string {
  if (config.label?.trim()) return config.label.trim();
  if (config.provider?.name) return resolveLocalizedString(config.provider.name, locale);
  return config.provider?.slug ?? config.id ?? "";
}

export function resolveGenerationStatus(statusValue: string | null | undefined): IndicatorStatus {
  if (statusValue === "generated") return "success";
  if (statusValue === "failed") return "failed";
  return "pending";
}

export function buildStatusMap(entries: readonly StatusConfigEntry[] | null | undefined): StatusMap {
  const map = new Map<string, StatusConfigEntry>();
  for (const entry of entries ?? []) {
    if (entry?.id) {
      map.set(entry.id, entry);
    }
  }
  return map;
}
