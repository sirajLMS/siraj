import type { Metadata } from "next";
import { buildIdSuffixedTranslatedMetadata } from "@/app/__shared__/buildEntityPageTitle";
import { AppPermission } from "@/backend/enum";
import { withPageAuth } from "@/backend/lib/auth/withPageAuth";
import { PaymentFormContainer } from "@/frontend/common/views/dashboard/accounting/PaymentFormContainer";

interface PaymentEditPageProps {
  readonly params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Readonly<PaymentEditPageProps>): Promise<Metadata> {
  const { id } = await params;
  return buildIdSuffixedTranslatedMetadata(t => t.dashboardTranslations.accountingPayments.editPayment, id);
}

export default withPageAuth<Readonly<PaymentEditPageProps>>(
  [AppPermission.ACCOUNTING_PAYMENTS_MANAGE],
  async (_auth, { params }) => {
    const { id } = await params;
    return <PaymentFormContainer paymentId={id} />;
  }
);
