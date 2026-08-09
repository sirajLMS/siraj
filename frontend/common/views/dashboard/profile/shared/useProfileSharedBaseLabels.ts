"use client";

import type { ProfileSharedBaseLabels } from "@/frontend/common/views/dashboard/profile/shared/types/profileSharedSection.types";
import { Translation, useAppTranslation } from "@/shared/locale";

export function useProfileSharedBaseLabels(): ProfileSharedBaseLabels {
  const base = useAppTranslation(Translation.Profile.Base);
  return {
    notSet: base.notSet,
    fieldAccess: base.fieldAccess,
    actions: {
      edit: base.actions.edit,
      save: base.actions.save,
      cancel: base.actions.cancel,
      retry: base.actions.retry,
      saveSuccess: base.actions.saveSuccess,
      saveError: base.actions.saveError,
      manageLifecycle: base.actions.manageLifecycle,
    },
  };
}
