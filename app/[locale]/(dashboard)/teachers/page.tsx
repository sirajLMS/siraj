import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { TeachersContainer } from "@/frontend/common/views/dashboard/teachers/home/TeachersContainer";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ readonly locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard.teachersDirectory" });
  return { title: t("pageTitle") };
}

export default function TeachersPage() {
  return <TeachersContainer />;
}
