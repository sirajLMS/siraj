import {
  type StaffProfileViewLabels,
  toStaffSharedBaseLabels,
} from "@/frontend/common/views/dashboard/profile/staff/sections/staffProfileTypes";
import type { ErrorsLabels } from "@/shared/locale/types/errors";

export function buildSectionLabels(labels: StaffProfileViewLabels) {
  const { base: tc, staff: st } = labels;
  return {
    staff: st,
    baseLabels: toStaffSharedBaseLabels(tc),
  };
}

export function buildCompensationViewLabels(labels: StaffProfileViewLabels, errorLabels: ErrorsLabels) {
  const { base: tc, staff: st } = labels;
  return {
    staff: st,
    baseLabels: {
      convertedAmount: tc.convertedAmount,
      convertedTotalApprox: tc.convertedTotalApprox,
    },
    errorLabels,
  };
}

export type CompensationViewLabels = ReturnType<typeof buildCompensationViewLabels>;
