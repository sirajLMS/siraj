import type { Metadata } from "next";
import { AdminComplaintsContainer } from "@/frontend/common/views/dashboard/complaints/AdminComplaintsContainer";
import { getTranslations } from "@/shared/locale/server";

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = getTranslations(locale).dashboardTranslations.complaints;
  return { title: t.admin.pageTitle };
}

export default function ComplaintsManagePage() {
  return <AdminComplaintsContainer />;
}
