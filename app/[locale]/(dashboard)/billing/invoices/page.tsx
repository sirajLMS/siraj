import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ParentBillingContainer } from "@/frontend/common/views/dashboard/billing/ParentBillingContainer";

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard.billing" });
  return { title: t("parentPageTitle") };
}

export default function ParentBillingInvoicesPage() {
  return <ParentBillingContainer />;
}
