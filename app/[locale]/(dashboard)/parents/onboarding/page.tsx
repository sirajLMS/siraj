import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ParentOnboardingContainer } from "@/frontend/common/views/dashboard/admin/parents/onboarding/ParentOnboardingContainer";

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard.parentOnboarding" });
  return { title: t("pageTitle") };
}

export default function ParentOnboardingPage() {
  return <ParentOnboardingContainer />;
}
