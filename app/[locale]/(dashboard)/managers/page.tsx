import type { Metadata } from "next";
import { ManagersContainer } from "@/frontend/common/views/dashboard/managers/home/ManagersContainer";
import { getTranslations } from "@/shared/locale/server";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ readonly locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = getTranslations(locale).dashboardTranslations.managersDirectory;
  return { title: t.pageTitle };
}

export default async function ManagersPage({ params }: Readonly<Props>) {
  await params;

  return <ManagersContainer />;
}
