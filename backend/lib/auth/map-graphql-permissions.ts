import { AppPermission as BackendAppPermission } from "@/backend/enum";

const backendValueToGraphqlName = new Map<string, string>(
  Object.entries(BackendAppPermission).map(([graphqlName, backendValue]) => [backendValue, graphqlName])
);

const graphqlPermissionNames = new Set(Object.keys(BackendAppPermission));

/**
 * Maps backend permission keys (dot notation, e.g. "dashboard.view") to GraphQL
 * enum names (e.g. "DASHBOARD_VIEW"). Already-mapped names pass through unchanged.
 */
export function mapBackendPermissionsToGraphql(permissions: readonly string[]): string[] {
  const mapped: string[] = [];

  for (const permission of permissions) {
    if (graphqlPermissionNames.has(permission)) {
      mapped.push(permission);
      continue;
    }

    const graphqlName = backendValueToGraphqlName.get(permission);
    if (graphqlName) {
      mapped.push(graphqlName);
    }
  }

  return mapped;
}
