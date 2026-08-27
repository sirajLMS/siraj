import type { Metadata } from "next";
import { buildIdSuffixedTranslatedMetadata } from "@/app/__shared__/buildEntityPageTitle";
import { AppPermission } from "@/backend/enum";
import { withPageAuth } from "@/backend/lib/auth/withPageAuth";
import { PaymentDetailContainer } from "@/frontend/common/views/dashboard/accounting/PaymentDetailContainer";

interface PaymentDetailPageProps {
  readonly params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Readonly<PaymentDetailPageProps>): Promise<Metadata> {
  const { id } = await params;
  return buildIdSuffixedTranslatedMetadata(t => t.dashboardTranslations.accountingPayments.paymentDetails, id);
}

export default withPageAuth<Readonly<PaymentDetailPageProps>>(
  [AppPermission.ACCOUNTING_PAYMENTS_VIEW],
  async (_auth, { params }) => {
    const { id } = await params;
    return <PaymentDetailContainer paymentId={id} />;
  }
);
