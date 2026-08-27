import type { Metadata } from "next";
import { buildIdSuffixedTranslatedMetadata } from "@/app/__shared__/buildEntityPageTitle";
import { AppPermission } from "@/backend/enum";
import { withPageAuth } from "@/backend/lib/auth/withPageAuth";
import { PackagePlanFormContainer } from "@/frontend/common/views/dashboard/accounting/PackagePlanFormContainer";

interface PackagePlanEditPageProps {
  readonly params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Readonly<PackagePlanEditPageProps>): Promise<Metadata> {
  const { id } = await params;
  return buildIdSuffixedTranslatedMetadata(t => t.dashboardTranslations.accountingPackages.editTitle, id);
}

export default withPageAuth<Readonly<PackagePlanEditPageProps>>(
  [AppPermission.ACCOUNTING_PAYMENTS_MANAGE],
  async (_auth, { params }) => {
    const { id } = await params;
    return <PackagePlanFormContainer planId={id} />;
  }
);
