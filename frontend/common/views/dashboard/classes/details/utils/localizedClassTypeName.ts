import type { ClassType } from "@/frontend/common/graphql/generated/gql/graphql";
import type { SessionLabels } from "@/shared/locale/types/session";

type ClassTypeKey = keyof SessionLabels["classTypes"];

function isClassTypeKey(value: string): value is ClassTypeKey {
  return value === "REGULAR" || value === "TRIAL" || value === "ADVANCE";
}

/**
 * Resolve a localized class-type label on the client.
 * Prefer this over GraphQL `courseName`, which is baked in the request locale and can go stale in Apollo after a language switch.
 */
export function getLocalizedClassTypeName(
  classType: ClassType | string | null | undefined,
  classTypes: SessionLabels["classTypes"],
  fallback?: string | null
): string {
  if (typeof classType === "string" && isClassTypeKey(classType)) {
    return classTypes[classType];
  }
  return fallback ?? "";
}
