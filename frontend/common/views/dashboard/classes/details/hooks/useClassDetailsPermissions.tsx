import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";

export function useClassDetailsPermissions(hasPermission: (permission: AppPermission) => boolean) {
  const canOverride = hasPermission(AppPermission.SessionOverrideActions);
  const canActivate = hasPermission(AppPermission.SessionActivateClass);
  const isParentView = hasPermission(AppPermission.ScheduleViewFamily) && !canActivate && !canOverride;
  const canViewSessionDetails = canOverride || hasPermission(AppPermission.SessionViewDetails);
  const isStudentView =
    hasPermission(AppPermission.StudentViewOwnDashboard) && !canOverride && !canActivate && !isParentView;

  return { canOverride, canActivate, isParentView, canViewSessionDetails, isStudentView };
}
