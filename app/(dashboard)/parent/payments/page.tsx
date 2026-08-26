import type { Metadata } from "next";
import { buildTranslatedMetadata } from "@/app/__shared__/buildEntityPageTitle";
import { AppPermission } from "@/backend/enum";
import { requirePermissionForPage } from "@/backend/lib/auth/require-permission";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { redirectToLogin } from "@/frontend/common/lib/redirectToLogin";
import { PaymentsLedgerContainer } from "@/frontend/desktop/views/dashboard/billing/paymentsLedger.desktop";
import { getLocale } from "@/shared/locale/server-cookies";

export async function generateMetadata(): Promise<Metadata> {
  return buildTranslatedMetadata(t => t.dashboardTranslations.billing.parentPageTitle);
}

export default async function ParentPaymentsPage() {
  const { userId, context } = await getServerUserContext();
  const locale = await getLocale();

  if (!userId) {
    await redirectToLogin();
    return undefined;
  }

  await requirePermissionForPage(userId, [AppPermission.PAYMENTS_LEDGER_VIEW], locale, context);
  return <PaymentsLedgerContainer />;
}
