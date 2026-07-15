import type { Metadata } from "next";
import { CurrencyHedgesContainer } from "@/frontend/common/views/dashboard/admin/billing/currency-hedges/CurrencyHedgesContainer";
import { getTranslations } from "@/shared/locale/server";

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations(locale, "dashboard.billing");
  return { title: t.currencyHedges.pageTitle };
}

export default function CurrencyHedgesPage() {
  return <CurrencyHedgesContainer />;
}
