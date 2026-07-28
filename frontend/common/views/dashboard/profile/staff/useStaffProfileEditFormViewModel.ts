"use client";

import type { StaffProfileViewLabels } from "@/frontend/common/views/dashboard/profile/staff/sections/staffProfileTypes";
import { Translation, useAppTranslation } from "@/shared/locale";
import type { ErrorsLabels } from "@/shared/locale/types/errors";

export interface StaffProfileEditFormViewModel {
  readonly labels: StaffProfileViewLabels;
  readonly errorLabels: ErrorsLabels;
}

export function useStaffProfileEditFormViewModel(): StaffProfileEditFormViewModel {
  const base = useAppTranslation(Translation.Profile.Base);
  const staff = useAppTranslation(Translation.Profile.Staff);
  const errorLabels = useAppTranslation(Translation.Errors);
  const labels: StaffProfileViewLabels = { base, staff };

  return { labels, errorLabels };
}
