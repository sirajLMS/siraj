import type { Metadata } from "next";
import { ManualInvoiceView } from "@/frontend/common/views/dashboard/billing/manual/ManualInvoiceView";
import { getTranslations } from "@/shared/locale";

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = getTranslations(locale).dashboardTranslations.billingManual;
  return { title: t.pageTitle };
}

export default function ManualInvoicePage() {
  return <ManualInvoiceView />;
}
