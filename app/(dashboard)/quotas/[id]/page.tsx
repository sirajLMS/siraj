import type { Metadata } from "next";
import { AppPermission } from "@/backend/enum";
import { requirePermissionForPage } from "@/backend/lib/auth/require-permission";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { redirectToLogin } from "@/frontend/common/lib/redirectToLogin";
import { QuotaDetailContainer } from "@/frontend/common/views/dashboard/billing/quota/QuotaDetailContainer";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

interface QuotaDetailPageProps {
  readonly params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Readonly<QuotaDetailPageProps>): Promise<Metadata> {
  const { id } = await params;
  const locale = await getLocale();
  const t = getTranslations(locale).dashboardTranslations.billingQuota;
  return { title: `${t.quotaDetails} — ${id}` };
}

export default async function QuotaDetailPage({ params }: Readonly<QuotaDetailPageProps>) {
  const { id } = await params;
  const locale = await getLocale();
  const { userId, context } = await getServerUserContext();
  if (!userId) {
    await redirectToLogin();
    return;
  }
  await requirePermissionForPage(userId, [AppPermission.QUOTAS_VIEW], locale, context);
  return <QuotaDetailContainer quotaId={id} />;
}
