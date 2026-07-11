import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ManualInvoiceContainer } from "@/frontend/views/dashboard/billing/manual/ManualInvoiceContainer";

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard.billing.manual" });
  return { title: t("pageTitle") };
}

export default function ManualInvoicePage() {
  return <ManualInvoiceContainer />;
}
