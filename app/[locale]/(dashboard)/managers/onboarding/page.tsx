import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ManagerOnboardingContainer } from "@/frontend/views/dashboard/managers/onboarding/ManagerOnboardingContainer";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ readonly locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard.managerOnboarding" });
  return { title: t("pageTitle") };
}

export default async function ManagerOnboardingPage({ params }: Readonly<Props>) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ManagerOnboardingContainer />;
}
