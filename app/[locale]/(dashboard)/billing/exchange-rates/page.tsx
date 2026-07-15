import type { Metadata } from "next";
import { ExchangeRatesContainer } from "@/frontend/common/views/dashboard/admin/billing/exchange-rates/ExchangeRatesContainer";
import { getTranslations } from "@/shared/locale/server";

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations(locale, "dashboard.billing");
  return { title: t.exchangeRates.pageTitle };
}

export default function ExchangeRatesPage() {
  return <ExchangeRatesContainer />;
}
