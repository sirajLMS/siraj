import type { ProfileShellProps } from "@/frontend/common/views/dashboard/profile/core/profileShellTypes";
import type { ProfileLabels } from "@/shared/locale/types/profile";

export type ProfileShellViewModel = ProfileShellProps & {
  readonly labels: ProfileLabels;
};

export type ProfileTabNavLabels = Pick<ProfileLabels, "shell">;
