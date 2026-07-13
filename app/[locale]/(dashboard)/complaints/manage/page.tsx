import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AdminComplaintsContainer } from "@/frontend/common/views/dashboard/complaints/AdminComplaintsContainer";

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard.complaints.admin" });
  return { title: t("pageTitle") };
}

export default function ComplaintsManagePage() {
  return <AdminComplaintsContainer />;
}
