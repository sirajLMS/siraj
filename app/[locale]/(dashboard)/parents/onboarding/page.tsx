import type { Metadata } from "next";
import { ParentOnboardingContainer } from "@/frontend/common/views/dashboard/admin/parents/onboarding/ParentOnboardingContainer";
import { getTranslations } from "@/shared/locale/server";

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations(locale, "dashboard.parentOnboarding");
  return { title: t.pageTitle };
}

export default function ParentOnboardingPage() {
  return <ParentOnboardingContainer />;
}
