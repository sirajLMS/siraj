import { setRequestLocale } from "next-intl/server";
import { ManagerOnboardingContainer } from "@/frontend/views/dashboard/managers/onboarding/ManagerOnboardingContainer";

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function ManagerOnboardingPage({ params }: Readonly<Props>) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ManagerOnboardingContainer />;
}
