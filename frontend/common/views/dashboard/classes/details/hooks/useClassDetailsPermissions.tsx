import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";

export function useClassDetailsPermissions(hasPermission: (permission: AppPermission) => boolean) {
  const canOverride = hasPermission(AppPermission.SessionOverrideActions);
  const canActivate = hasPermission(AppPermission.SessionActivateClass);
  const isParentView = hasPermission(AppPermission.ScheduleViewFamily) && !canActivate && !canOverride;
  // NEW FOR PLAN v5: blogated SessionViewDetails check lifted out of tier-wide RequirePermission wrapper (specs.md §6.1, N3).
  const canViewSessionDetails = canOverride || hasPermission(AppPermission.SessionViewDetails);

  return { canOverride, canActivate, isParentView, canViewSessionDetails };
}
