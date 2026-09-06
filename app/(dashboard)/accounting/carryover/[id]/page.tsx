import type { Metadata } from "next";
import { buildIdSuffixedTranslatedMetadata } from "@/app/__shared__/buildEntityPageTitle";
import { AppPermission } from "@/backend/enum";
import { withPageAuth } from "@/backend/lib/auth/withPageAuth";
import { CarryoverDetailDrawerRoute } from "@/frontend/common/views/dashboard/accounting/carryover/CarryoverDetailDrawerRoute";

interface CarryoverDetailPageProps {
  readonly params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Readonly<CarryoverDetailPageProps>): Promise<Metadata> {
  const { id } = await params;
  return buildIdSuffixedTranslatedMetadata(t => t.dashboardTranslations.accountingCarryover.title, id);
}

export default withPageAuth<Readonly<CarryoverDetailPageProps>>(
  [AppPermission.ACCOUNTING_CARRYOVER_VIEW],
  async (_auth, { params }) => {
    const { id } = await params;
    return <CarryoverDetailDrawerRoute carryoverId={id} />;
  }
);
