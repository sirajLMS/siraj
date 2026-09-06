import type { Metadata } from "next";
import { AppPermission } from "@/backend/enum";
import { withPageAuth } from "@/backend/lib/auth/withPageAuth";
import { CarryoverContainer } from "@/frontend/common/views/dashboard/accounting/carryover/CarryoverContainer";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getTranslations(locale).dashboardTranslations.accountingCarryover;
  return { title: t.title };
}

export default withPageAuth([AppPermission.ACCOUNTING_CARRYOVER_VIEW], async () => {
  return <CarryoverContainer />;
});
