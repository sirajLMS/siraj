import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ResourcesContainer } from "@/frontend/common/views/dashboard/resources/ResourcesContainer";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ readonly locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard.resources" });
  return { title: t("pageTitle") };
}

export default function ResourcesPage() {
  return <ResourcesContainer />;
}
