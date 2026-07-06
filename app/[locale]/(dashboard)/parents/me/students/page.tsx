import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { ParentStudentsContainer } from "@/frontend/views/dashboard/parents/students/ParentStudentsContainer";
import { redirect } from "@/shared/i18n/routing";

export const metadata: Metadata = {
  title: "Your Students - Siraj LMS",
};

interface PageProps {
  readonly params: Promise<{ readonly locale: string }>;
}

export default async function ParentMeStudentsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const { userId } = await getServerUserContext();
  if (!userId) {
    redirect({ href: "/login", locale });
    return;
  }

  return <ParentStudentsContainer />;
}
