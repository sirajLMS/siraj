import type { Metadata } from "next";
import { buildIdSuffixedTranslatedMetadata } from "@/app/__shared__/buildEntityPageTitle";
import { AppPermission } from "@/backend/enum";
import { withPageAuth } from "@/backend/lib/auth/withPageAuth";
import { QuotaFormContainer } from "@/frontend/common/views/dashboard/billing/quota/QuotaFormContainer";

interface EditQuotaPageProps {
  readonly params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Readonly<EditQuotaPageProps>): Promise<Metadata> {
  const { id } = await params;
  return buildIdSuffixedTranslatedMetadata(t => t.dashboardTranslations.billingQuota.editQuota, id);
}

export default withPageAuth<Readonly<EditQuotaPageProps>>([AppPermission.QUOTAS_MANAGE], async (_auth, { params }) => {
  const { id } = await params;
  return <QuotaFormContainer quotaId={id} />;
});
