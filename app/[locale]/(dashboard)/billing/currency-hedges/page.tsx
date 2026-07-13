import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CurrencyHedgesContainer } from "@/frontend/common/views/dashboard/admin/billing/currency-hedges/CurrencyHedgesContainer";

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard.billing.currencyHedges" });
  return { title: t("pageTitle") };
}

export default function CurrencyHedgesPage() {
  return <CurrencyHedgesContainer />;
}
