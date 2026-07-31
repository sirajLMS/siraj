import type { Metadata } from "next";
import { AppPermission } from "@/backend/enum";
import { requirePermissionForPage } from "@/backend/lib/auth/require-permission";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { redirectToLogin } from "@/frontend/common/lib/redirectToLogin";
import { SettingsPageContainer } from "@/frontend/common/views/dashboard/settings/SettingsPageContainer";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getTranslations(locale).dashboardTranslations.coreNav;
  return { title: t.settings };
}

export default async function SettingsPage() {
  const locale = await getLocale();
  const { userId, context } = await getServerUserContext();
  if (!userId) {
    await redirectToLogin();
    return;
  }
  await requirePermissionForPage(
    userId,
    [
      AppPermission.SETTINGS_VIEW,
      AppPermission.SETTINGS_EDIT_GENERAL,
      AppPermission.SETTINGS_EDIT_ENV,
      AppPermission.SETTINGS_EDIT_SESSION,
      AppPermission.SETTINGS_AUDIT_VIEW,
      AppPermission.SETTINGS_SITE_CONTENT_MANAGE,
      AppPermission.SCHEDULE_VIEW_TIMEZONES,
    ],
    locale,
    context
  );
  return <SettingsPageContainer />;
}
