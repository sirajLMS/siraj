import type { Metadata } from "next";
import { SupportedCurrenciesContainer } from "@/frontend/common/views/dashboard/admin/billing/currencies/SupportedCurrenciesContainer";
import { getTranslations } from "@/shared/locale/server";

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations(locale, "dashboard.billing");
  return { title: t.supportedCurrencies.pageTitle };
}

export default function SupportedCurrenciesPage() {
  return <SupportedCurrenciesContainer />;
}
