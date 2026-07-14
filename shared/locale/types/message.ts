import type { AuthLabels } from "@/shared/locale/types/auth";
import type { CommonLabels } from "@/shared/locale/types/common";
import type { AdminDashboardLabels } from "@/shared/locale/types/dashboard/admin";
import type { DashboardCoreLayoutLabels } from "@/shared/locale/types/dashboard/core/layout";
import type { DashboardCoreNotificationsLabels } from "@/shared/locale/types/dashboard/core/notifications";
import type { ErrorsLabels } from "@/shared/locale/types/errors";
import type { ProfileLabels } from "@/shared/locale/types/profile";
import type { SessionLabels } from "@/shared/locale/types/session";
import type { UiLabels } from "@/shared/locale/types/ui";

export type MessageSchema = {
  auth: AuthLabels;
  common: CommonLabels;
  errors: ErrorsLabels;
  "dashboard.admin": AdminDashboardLabels;
  "dashboard.core.layout": DashboardCoreLayoutLabels;
  "dashboard.core.notifications": DashboardCoreNotificationsLabels;
  profile: ProfileLabels;
  session: SessionLabels;
  ui: UiLabels;
};
