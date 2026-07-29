"use client";

import type { ProfileSharedBaseLabels } from "@/frontend/common/views/dashboard/profile/shared/types/profileSharedSection.types";
import { Translation, useAppTranslation } from "@/shared/locale";

export function useProfileSharedBaseLabels(): ProfileSharedBaseLabels {
  const base = useAppTranslation(Translation.Profile.Base);
  return {
    notSet: base.notSet,
    fieldAccess: base.fieldAccess,
  };
}
