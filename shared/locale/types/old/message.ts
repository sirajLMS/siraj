/** Flattened, dot-free top-level translation schema. */

import type { AppLocale } from "@/shared/locale/AppLocale.ts";
import type { AuthLabels } from "@/shared/locale/types/auth";
import type { CommonLabels } from "@/shared/locale/types/common";
import type { EmailsLabels } from "@/shared/locale/types/emails";
import type { ErrorsLabels } from "@/shared/locale/types/errors";
import type { NotificationsLabels } from "@/shared/locale/types/notifications";
import type { DashboardTranslations } from "@/shared/locale/types/old/dashboard.ts";
import type { ProfileTranslations } from "@/shared/locale/types/old/profile-translations.ts";
import type { UiTranslations } from "@/shared/locale/types/old/ui-translations.ts";
import type { SessionLabels } from "@/shared/locale/types/session";
import type { SmsLabels } from "@/shared/locale/types/sms";

export type { AppLocale };

export type Translations = {
  authTranslations: AuthLabels;
  commonTranslations: CommonLabels;
  errorsTranslations: ErrorsLabels;
  emailsTranslations: EmailsLabels;
  sessionTranslations: SessionLabels;
  smsTranslations: SmsLabels;
  uiTranslations: UiTranslations;
  dashboardTranslations: DashboardTranslations;
  profileTranslations: ProfileTranslations;
  notificationsTranslations: NotificationsLabels;
};
