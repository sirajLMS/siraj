import type { Metadata } from "next";
import { ParentBillingView } from "@/frontend/common/views/dashboard/billing/ParentBillingView";
import { getTranslations } from "@/shared/locale";

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = getTranslations(locale).dashboardTranslations.billing;
  return { title: t.parentPageTitle };
}

export default function ParentBillingInvoicesPage() {
  return <ParentBillingView />;
}
