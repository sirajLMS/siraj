import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SupportedCurrenciesContainer } from "@/frontend/views/dashboard/admin/billing/currencies/SupportedCurrenciesContainer";

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard.billing.supportedCurrencies" });
  return { title: t("pageTitle") };
}

export default function SupportedCurrenciesPage() {
  return <SupportedCurrenciesContainer />;
}
