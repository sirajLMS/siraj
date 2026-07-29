"use client";

import type {
  StaffPermissionGroups,
  StaffPermissionOverrides,
  StaffPermissionsSectionLabels,
} from "@/frontend/common/views/dashboard/profile/staff/sections/staffProfileTypes";
import { Translation, useAppTranslation } from "@/shared/locale";

export type PermissionsSectionProps = {
  readonly permissionGroups: StaffPermissionGroups;
  readonly permissionOverrides: StaffPermissionOverrides;
  readonly isOwnScope?: boolean;
};

export interface PermissionsSectionViewModel extends PermissionsSectionProps {
  readonly labels: StaffPermissionsSectionLabels;
}

export function usePermissionsSectionViewModel(props: Readonly<PermissionsSectionProps>): PermissionsSectionViewModel {
  const labels = useAppTranslation(Translation.Profile.Staff).permissions;

  return {
    labels,
    ...props,
  };
}
