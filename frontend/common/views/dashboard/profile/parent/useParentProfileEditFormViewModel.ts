"use client";

import type { ParentProfileViewLabels } from "@/frontend/common/views/dashboard/profile/parent/sections/parentProfileTypes";
import { Translation, useAppTranslation } from "@/shared/locale";

export interface ParentProfileEditFormViewModel {
  readonly labels: ParentProfileViewLabels;
}

export function useParentProfileEditFormViewModel(): ParentProfileEditFormViewModel {
  const base = useAppTranslation(Translation.Profile.Base);
  const parent = useAppTranslation(Translation.Profile.Parent);
  const labels: ParentProfileViewLabels = { base, parent };

  return { labels };
}
