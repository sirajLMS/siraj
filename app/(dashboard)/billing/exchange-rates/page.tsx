import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "@/shared/locale";
import { getLocale } from "@/shared/locale/server-cookies";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getTranslations(locale);
  return { title: t.commonTranslations.redirecting };
}

export default async function ExchangeRatesRedirectPage() {
  redirect("/billing?tab=exchangeRates");
}
