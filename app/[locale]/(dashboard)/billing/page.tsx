import type { Metadata } from "next";
import { AdminBillingContainer } from "@/frontend/common/views/dashboard/admin/billing/AdminBillingContainer";
import { getTranslations } from "@/shared/locale/server";

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations(locale, "dashboard.billing");
  return { title: t.adminPageTitle };
}

export default function BillingPage() {
  return <AdminBillingContainer />;
}
