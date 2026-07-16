import type { Metadata } from "next";
import { StudentOnboardingContainer } from "@/frontend/common/views/dashboard/students/onboarding/StudentOnboardingContainer";
import { getTranslations } from "@/shared/locale";

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = getTranslations(locale).dashboardTranslations.studentOnboarding;
  return { title: t.pageTitle };
}

export default function StudentOnboardingPage() {
  return <StudentOnboardingContainer />;
}
