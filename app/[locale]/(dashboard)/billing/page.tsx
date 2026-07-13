import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AdminBillingContainer } from "@/frontend/common/views/dashboard/admin/billing/AdminBillingContainer";

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard.billing" });
  return { title: t("adminPageTitle") };
}

export default function BillingPage() {
  return <AdminBillingContainer />;
}
