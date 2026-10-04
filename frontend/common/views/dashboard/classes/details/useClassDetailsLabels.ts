import { useMemo } from "react";
import { buildAdminViewLabels } from "@/frontend/common/views/dashboard/classes/details/useClassDetailsLabels.helpers";
import type {
  StudentViewLabels,
  TeacherViewLabels,
} from "@/frontend/common/views/dashboard/classes/details/useClassDetailsLabels.types";
import {
  buildStudentViewLabels,
  buildTeacherViewLabels,
} from "@/frontend/common/views/dashboard/classes/details/useClassDetailsLabels.viewBuilders.helpers";
import { type AdminViewLabels, Translation, useAppTranslation } from "@/shared/locale";

/**
 * View-layer label bags for the class details screen, re-exported from this
 * module so consumers importing from the original path resolve unchanged.
 */
export type {
  StudentViewLabels,
  TeacherViewLabels,
} from "@/frontend/common/views/dashboard/classes/details/useClassDetailsLabels.types";

export const useAdminViewLabels = (_timezone: string): AdminViewLabels => {
  const t = useAppTranslation(Translation.Dashboard.ClassDetails);

  return useMemo(() => buildAdminViewLabels(t), [t]);
};

export const useTeacherViewLabels = (_timezone: string): TeacherViewLabels => {
  const t = useAppTranslation(Translation.Dashboard.ClassDetails);

  return useMemo(() => buildTeacherViewLabels(t), [t]);
};

export const useStudentViewLabels = (_timezone: string): StudentViewLabels => {
  const t = useAppTranslation(Translation.Dashboard.ClassDetails);

  return useMemo(() => buildStudentViewLabels(t), [t]);
};
