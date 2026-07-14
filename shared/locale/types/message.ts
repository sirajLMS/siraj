import type { AuthLabels } from "@/shared/locale/types/auth";
import type { AdminDashboardLabels } from "@/shared/locale/types/dashboard/admin";
import type { ErrorsLabels } from "@/shared/locale/types/errors";

export type MessageSchema = {
  auth: AuthLabels;
  errors: ErrorsLabels;
  "dashboard.admin": AdminDashboardLabels;
  // Remaining namespaces will be added here as they are migrated:
  // common: CommonLabels;
  // ui: UiLabels;
  // profile: ProfileLabels;
  // session: SessionLabels;
};
