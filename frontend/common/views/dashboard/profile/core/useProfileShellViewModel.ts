"use client";

import type { ProfileShellProps } from "@/frontend/common/views/dashboard/profile/core/profileShellTypes";
import type { ProfileShellViewModel } from "@/frontend/common/views/dashboard/profile/core/types/profileShell.types";
import { Translation, useAppTranslation } from "@/shared/locale";

export type { ProfileShellViewModel };

export function useProfileShellViewModel(props: Readonly<ProfileShellProps>): ProfileShellViewModel {
  const labels = useAppTranslation(Translation.Profile.Base);

  return {
    ...props,
    labels,
  };
}
