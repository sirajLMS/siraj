import type { Metadata } from "next";
import { AppPermission } from "@/backend/enum";
import { withPageAuth } from "@/backend/lib/auth/withPageAuth";
import { CreditAdjustForm } from "@/frontend/common/views/dashboard/accounting/credits/CreditAdjustForm";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getTranslations(locale).dashboardTranslations.billingCreditAdjustment;
  return { title: t.adjustCredits };
}

export default withPageAuth<{ readonly searchParams: Promise<{ readonly studentId?: string }> }>(
  [AppPermission.ACCOUNTING_CREDITS_MANAGE],
  async (_auth, { searchParams }) => {
    const { studentId } = await searchParams;
    return <CreditAdjustForm studentId={studentId ?? null} />;
  }
);
