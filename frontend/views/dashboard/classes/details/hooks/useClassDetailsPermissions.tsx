import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";

export function useClassDetailsPermissions(hasPermission: (permission: AppPermission) => boolean) {
  const canOverride = hasPermission(AppPermission.SessionOverrideActions);
  const canActivate = hasPermission(AppPermission.SessionActivateClass);
  const isParentView = hasPermission(AppPermission.ScheduleViewFamily) && !canActivate && !canOverride;

  return { canOverride, canActivate, isParentView };
}
