import type { EnvironmentConfigViewModel } from "@/frontend/common/views/dashboard/settings/types/environmentConfig.types";

const SOURCE_BADGE_STATUSES: Record<string, string> = {
  db: "success",
  env: "partial",
  unset: "unknown",
};

export function resolveSourceStatus(source: string | null | undefined): string {
  return SOURCE_BADGE_STATUSES[source ?? "unset"] ?? SOURCE_BADGE_STATUSES.unset;
}

export function resolveSourceLabel(
  source: string | null | undefined,
  labels: EnvironmentConfigViewModel["labels"]
): string {
  switch (source) {
    case "db":
      return labels.source.db;
    case "env":
      return labels.source.env;
    case "unset":
      return labels.source.unset;
    default:
      return labels.source.unset;
  }
}
