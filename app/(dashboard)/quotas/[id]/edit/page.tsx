import type { Metadata } from "next";
import { AppPermission } from "@/backend/enum";
import { requirePermissionForPage } from "@/backend/lib/auth/require-permission";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { redirectToLogin } from "@/frontend/common/lib/redirectToLogin";
import { QuotaFormContainer } from "@/frontend/common/views/dashboard/billing/quota/QuotaFormContainer";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

interface EditQuotaPageProps {
  readonly params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: EditQuotaPageProps): Promise<Metadata> {
  const { id } = await params;
  const locale = await getLocale();
  const t = getTranslations(locale).dashboardTranslations.billingQuota;
  return { title: `${t.editQuota} — ${id}` };
}

export default async function EditQuotaPage({ params }: Readonly<EditQuotaPageProps>) {
  const { id } = await params;
  const locale = await getLocale();
  const { userId, context } = await getServerUserContext();
  if (!userId) {
    await redirectToLogin();
    return;
  }
  await requirePermissionForPage(userId, [AppPermission.QUOTAS_MANAGE], locale, context);
  return <QuotaFormContainer quotaId={id} />;
}
