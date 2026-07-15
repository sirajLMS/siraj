import type { Metadata } from "next";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { redirectToLogin } from "@/frontend/common/lib/redirectToLogin";
import { ParentRulesContainer } from "@/frontend/common/views/dashboard/parent/rules/ParentRulesContainer";
import { getTranslations } from "@/shared/locale/server";

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations(locale, "dashboard.parentRules");
  return { title: t.pageTitle };
}

interface PageProps {
  readonly params: Promise<{ readonly locale: string }>;
}

export default async function ParentRulesPage({ params }: PageProps) {
  const { locale } = await params;

  const { userId } = await getServerUserContext();
  if (!userId) {
    await redirectToLogin(locale);
    return;
  }

  return <ParentRulesContainer />;
}
