import type { Metadata } from "next";
import { AppPermission } from "@/backend/enum";
import { requirePermissionForPage } from "@/backend/lib/auth/require-permission";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { redirectToLogin } from "@/frontend/common/lib/redirectToLogin";
import { ParentRulesContainer } from "@/frontend/common/views/dashboard/parent/rules/ParentRulesContainer";
import { getTranslations } from "@/shared/locale/server";
import { getLocale } from "@/shared/locale/server-cookies";

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = getTranslations(locale).dashboardTranslations.parentRules;
  return { title: t.pageTitle };
}

interface PageProps {
  readonly params: Promise<{ readonly locale: string }>;
}

export default async function ParentRulesPage({ params }: PageProps) {
  await params;

  const locale = await getLocale();
  const { userId, context } = await getServerUserContext();
  if (!userId) {
    await redirectToLogin();
    return;
  }
  await requirePermissionForPage(userId, [AppPermission.SCHEDULE_VIEW_FAMILY], locale, context);

  return <ParentRulesContainer />;
}
