import { type AppPermission, appPermissionStrings } from "@/backend/enum/permissions/permission.enum";

/**
 * Type guard to check if a string is a valid AppPermission.
 */
export function isAppPermission(value: string): value is AppPermission {
  return appPermissionStrings.includes(value);
}

/**
 * Parses a string value into an AppPermission enum, returning null if invalid.
 */
export function parseAppPermission(value: string | null | undefined): AppPermission | null {
  if (value == null) {
    return null;
  }
  if (isAppPermission(value)) {
    return value;
  }
  return null;
}

/** Drops DB rows whose keys were removed from the TypeScript/GraphQL enum (e.g. legacy profile ACL). */
export function filterKnownAppPermissions(keys: Iterable<string>): AppPermission[] {
  const result: AppPermission[] = [];
  const seen = new Set<string>();
  for (const key of keys) {
    const parsed = parseAppPermission(key);
    if (parsed && !seen.has(parsed)) {
      seen.add(parsed);
      result.push(parsed);
    }
  }
  return result;
}
