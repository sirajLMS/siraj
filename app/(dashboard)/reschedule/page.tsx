import type { Metadata } from "next";
import { AppPermission } from "@/backend/enum";
import { requirePermissionForPage } from "@/backend/lib/auth/require-permission";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { redirectToLogin } from "@/frontend/common/lib/redirectToLogin";
import { RescheduleContainer } from "@/frontend/common/views/dashboard/reschedule/home/RescheduleContainer";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ readonly locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = getTranslations(locale).dashboardTranslations.rescheduleForm;
  return { title: t.pageTitle };
}

export default async function ReschedulePage() {
  const locale = await getLocale();
  const { userId, context } = await getServerUserContext();
  if (!userId) {
    await redirectToLogin();
    return;
  }
  await requirePermissionForPage(userId, [AppPermission.SESSION_RESCHEDULE], locale, context);
  return <RescheduleContainer />;
}
