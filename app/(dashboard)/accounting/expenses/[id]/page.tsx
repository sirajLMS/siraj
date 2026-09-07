import type { Metadata } from "next";
import { buildIdSuffixedTranslatedMetadata } from "@/app/__shared__/buildEntityPageTitle";
import { AppPermission } from "@/backend/enum";
import { withPageAuth } from "@/backend/lib/auth/withPageAuth";
import { ExpenseDetailDrawerRoute } from "@/frontend/common/views/dashboard/accounting/expenses/ExpenseDetailDrawerRoute";

interface ExpenseDetailPageProps {
  readonly params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Readonly<ExpenseDetailPageProps>): Promise<Metadata> {
  const { id } = await params;
  return buildIdSuffixedTranslatedMetadata(t => t.dashboardTranslations.accountingExpenses.title, id);
}

export default withPageAuth<Readonly<ExpenseDetailPageProps>>(
  [AppPermission.ACCOUNTING_EXPENSES_VIEW],
  async (_auth, { params }) => {
    const { id } = await params;
    return <ExpenseDetailDrawerRoute expenseId={id} />;
  }
);
