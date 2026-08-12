import type { Metadata } from "next";
import { buildEntityNamePrefixedTranslatedMetadata } from "@/app/__shared__/buildEntityPageTitle";
import { AppPermission } from "@/backend/enum";
import { withPageAuth } from "@/backend/lib/auth/withPageAuth";
import { getUserPageTitle } from "@/backend/lib/titles/cached-page-title";
import { UserBillingProfileContainer } from "@/frontend/common/views/dashboard/users/billing-profile/UserBillingProfileContainer";

interface BillingProfilePageProps {
  readonly params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: BillingProfilePageProps): Promise<Metadata> {
  const { id } = await params;
  return buildEntityNamePrefixedTranslatedMetadata(
    () => getUserPageTitle(id),
    t => t.dashboardTranslations.billing.billingProfileTitle
  );
}

export default withPageAuth<Readonly<BillingProfilePageProps>>(
  [AppPermission.BILLING_VIEW_HISTORY],
  async (_auth, { params }) => {
    const { id } = await params;
    return <UserBillingProfileContainer userId={id} />;
  }
);
