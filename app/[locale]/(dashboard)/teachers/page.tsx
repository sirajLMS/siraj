import type { Metadata } from "next";
import { TeachersContainer } from "@/frontend/common/views/dashboard/teachers/home/TeachersContainer";
import { getTranslations } from "@/shared/locale/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ readonly locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = getTranslations(locale).dashboardTranslations.teachersDirectory;
  return { title: t.pageTitle };
}

export default function TeachersPage() {
  return <TeachersContainer />;
}
