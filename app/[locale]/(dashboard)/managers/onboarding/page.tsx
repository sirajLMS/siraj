import type { Metadata } from "next";
import { ManagerOnboardingContainer } from "@/frontend/common/views/dashboard/managers/onboarding/ManagerOnboardingContainer";
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
  const t = getTranslations(locale).dashboardTranslations.managerOnboarding;
  return { title: t.pageTitle };
}

export default async function ManagerOnboardingPage({ params }: Readonly<Props>) {
  await params;

  return <ManagerOnboardingContainer />;
}
