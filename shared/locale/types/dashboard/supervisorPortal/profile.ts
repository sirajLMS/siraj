import type { ProfileAdminResetPasswordLabels } from "@/shared/locale/types/profile";

export interface SupervisorPortalProfileLabels {
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly notSet: string;
  readonly loadingMessage: string;
  readonly sections: {
    readonly account: string;
    readonly contact: string;
    readonly role: string;
  };
  readonly fields: {
    readonly fullName: string;
    readonly email: string;
    readonly phone: string;
    readonly roleName: string;
    readonly status: string;
  };
  readonly errors: {
    readonly failedToLoad: string;
    readonly notFound: string;
  };
  readonly adminResetPassword: ProfileAdminResetPasswordLabels;
  readonly actions: {
    readonly manageLifecycle: string;
  };
}
