import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { ParentRulesContainer } from "@/frontend/views/dashboard/parent/rules/ParentRulesContainer";
import { redirect } from "@/shared/i18n/routing";

export const metadata: Metadata = {
  title: "Rules - Siraj LMS",
};

interface PageProps {
  readonly params: Promise<{ readonly locale: string }>;
}

export default async function ParentRulesPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const { userId } = await getServerUserContext();
  if (!userId) {
    redirect({ href: "/login", locale });
    return;
  }

  return <ParentRulesContainer />;
}
