import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { TeacherOnboardingContainer } from "@/frontend/common/views/dashboard/teachers/onboarding/TeacherOnboardingContainer";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ readonly locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard.teacherOnboarding" });
  return { title: t("pageTitle") };
}

export default function TeacherOnboardingPage() {
  return <TeacherOnboardingContainer />;
}
