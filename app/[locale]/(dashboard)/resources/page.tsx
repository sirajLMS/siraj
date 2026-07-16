import type { Metadata } from "next";
import { ResourcesContainer } from "@/frontend/common/views/dashboard/resources/ResourcesContainer";
import { getTranslations } from "@/shared/locale/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ readonly locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = getTranslations(locale).dashboardTranslations.resources;
  return { title: t.pageTitle };
}

export default function ResourcesPage() {
  return <ResourcesContainer />;
}
