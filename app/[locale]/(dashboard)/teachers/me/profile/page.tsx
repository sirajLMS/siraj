import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { TeacherOwnProfileContainer } from "@/frontend/views/dashboard/teachers/own-profile/TeacherOwnProfileContainer";
import { redirect } from "@/shared/i18n/routing";

export const metadata: Metadata = {
  title: "Salary Details - Siraj LMS",
};

interface PageProps {
  readonly params: Promise<{ readonly locale: string }>;
}

export default async function TeacherMeProfilePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const { userId } = await getServerUserContext();
  if (!userId) {
    redirect({ href: "/login", locale });
    return;
  }

  return <TeacherOwnProfileContainer />;
}
