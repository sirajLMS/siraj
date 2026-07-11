import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { StudentOnboardingContainer } from "@/frontend/views/dashboard/students/onboarding/StudentOnboardingContainer";

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard.studentOnboarding" });
  return { title: t("pageTitle") };
}

export default function StudentOnboardingPage() {
  return <StudentOnboardingContainer />;
}
