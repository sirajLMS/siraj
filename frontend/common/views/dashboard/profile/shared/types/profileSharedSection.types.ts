import type { ProfileFieldAccessLabels, ProfileLabels } from "@/shared/locale/types/profile";

export type ProfileSharedBaseLabels = Pick<ProfileLabels, "notSet"> & {
  readonly fieldAccess: ProfileFieldAccessLabels;
};
