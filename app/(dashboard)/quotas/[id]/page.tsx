import type { Metadata } from "next";
import { buildIdSuffixedTranslatedMetadata } from "@/app/__shared__/buildEntityPageTitle";
import { AppPermission } from "@/backend/enum";
import { withPageAuth } from "@/backend/lib/auth/withPageAuth";
import { QuotaDetailContainer } from "@/frontend/common/views/dashboard/billing/quota/QuotaDetailContainer";

interface QuotaDetailPageProps {
  readonly params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Readonly<QuotaDetailPageProps>): Promise<Metadata> {
  const { id } = await params;
  return buildIdSuffixedTranslatedMetadata(t => t.dashboardTranslations.billingQuota.quotaDetails, id);
}

export default withPageAuth<Readonly<QuotaDetailPageProps>>([AppPermission.QUOTAS_VIEW], async (_auth, { params }) => {
  const { id } = await params;
  return <QuotaDetailContainer quotaId={id} />;
});
