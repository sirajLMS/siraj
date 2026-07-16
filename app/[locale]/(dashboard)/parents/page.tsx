import type { Metadata } from "next";
import { ParentsContainer } from "@/frontend/common/views/dashboard/admin/parents/home/ParentsContainer";
import { getTranslations } from "@/shared/locale/server";

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = getTranslations(locale).dashboardTranslations.parentsDirectory;
  return { title: t.pageTitle };
}

export default function ParentsPage() {
  return <ParentsContainer />;
}
