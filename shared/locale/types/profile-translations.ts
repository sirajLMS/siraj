/** ProfileTranslations — group collector for all profile-domain labels. */

import type {
  ProfileLabels,
  ProfileNotificationsLabels,
  ProfileParentLabels,
  ProfileStaffLabels,
  ProfileTeacherLabels,
} from "@/shared/locale/types/profile";

export interface ProfileTranslations {
  base: ProfileLabels;
  teacher: ProfileTeacherLabels;
  parent: ProfileParentLabels;
  staff: ProfileStaffLabels;
  notifications: ProfileNotificationsLabels;
}
