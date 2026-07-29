import type { ErrorsLabels } from "@/shared/locale/types/errors";
import type { ProfileLabels } from "@/shared/locale/types/profile";

export type ChangePasswordSectionLabels = {
  readonly profile: Pick<ProfileLabels, "changePassword">;
  readonly errors: Pick<ErrorsLabels, "auth">;
};
