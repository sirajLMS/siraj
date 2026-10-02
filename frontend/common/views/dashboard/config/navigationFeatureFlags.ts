import type { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";

export interface NavFeatureFlags {
  readonly enableUsersDirectory: boolean;
}

export const DEFAULT_NAV_FEATURE_FLAGS: NavFeatureFlags = {
  enableUsersDirectory: false,
};

export function isNavFeatureFlags(
  value: readonly AppPermission[] | NavFeatureFlags | undefined
): value is NavFeatureFlags {
  return value !== undefined && !Array.isArray(value);
}

export function resolveNavFeatureFlags(
  maybeFlags: readonly AppPermission[] | NavFeatureFlags | undefined,
  fallbackFlags?: NavFeatureFlags
): NavFeatureFlags {
  if (isNavFeatureFlags(maybeFlags)) {
    return maybeFlags;
  }
  return fallbackFlags ?? DEFAULT_NAV_FEATURE_FLAGS;
}
