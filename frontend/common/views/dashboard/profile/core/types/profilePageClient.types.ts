import type { ProfileAudience, ProfileMode, ProfileScope } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { ProfileLabels, ProfileParentLabels, ProfileTeacherLabels } from "@/shared/locale/types/profile";

export type ProfilePageClientProps = {
  readonly scope: ProfileScope;
  readonly mode: ProfileMode;
  readonly audience: ProfileAudience;
  readonly targetUserId: string;
};

export type ProfilePageClientLabels = {
  readonly base: ProfileLabels;
  readonly teacher: ProfileTeacherLabels;
};

export type ProfileActionBarLabels = ProfileLabels["actions"];

export type ParentAccountActionsLabels = ProfileParentLabels["actions"];
