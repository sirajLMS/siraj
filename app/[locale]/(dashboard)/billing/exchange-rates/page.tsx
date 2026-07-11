import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ExchangeRatesContainer } from "@/frontend/views/dashboard/admin/billing/exchange-rates/ExchangeRatesContainer";

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard.billing.exchangeRates" });
  return { title: t("pageTitle") };
}

export default function ExchangeRatesPage() {
  return <ExchangeRatesContainer />;
}
