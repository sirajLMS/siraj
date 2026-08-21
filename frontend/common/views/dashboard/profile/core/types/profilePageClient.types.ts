import type { ProfileAudience, ProfileMode, ProfileScope } from "@/shared/constants/profile.enum";
import type { ProfileLabels, ProfileParentLabels, ProfileTeacherLabels } from "@/shared/locale/types/profile";

export type ProfilePageClientProps = {
  readonly scope: ProfileScope;
  readonly mode: ProfileMode;
  readonly audience: ProfileAudience;
  readonly targetUserId: string;
  readonly studentId?: string;
  /** Server-provided gate for teacher own-profile edit force-complete redirects. */
  readonly nationalIdComplete?: boolean;
};

export type ProfilePageClientLabels = {
  readonly base: ProfileLabels;
  readonly teacher: ProfileTeacherLabels;
};

export type ProfileActionBarLabels = ProfileLabels["actions"];

export type ParentAccountActionsLabels = ProfileParentLabels["actions"];
