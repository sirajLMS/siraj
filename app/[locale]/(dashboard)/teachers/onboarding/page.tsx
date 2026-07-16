import type { Metadata } from "next";
import { TeacherOnboardingContainer } from "@/frontend/common/views/dashboard/teachers/onboarding/TeacherOnboardingContainer";
import { getTranslations } from "@/shared/locale/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ readonly locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = getTranslations(locale).dashboardTranslations.teacherOnboarding;
  return { title: t.pageTitle };
}

export default function TeacherOnboardingPage() {
  return <TeacherOnboardingContainer />;
}
