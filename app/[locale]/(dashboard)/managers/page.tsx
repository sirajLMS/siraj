import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ManagersContainer } from "@/frontend/views/dashboard/managers/home/ManagersContainer";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ readonly locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard.managersDirectory" });
  return { title: t("pageTitle") };
}

export default async function ManagersPage({ params }: Readonly<Props>) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ManagersContainer />;
}
