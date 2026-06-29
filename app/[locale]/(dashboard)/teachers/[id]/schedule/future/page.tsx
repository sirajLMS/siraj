import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { FutureScheduleContainer } from "@/frontend/views/dashboard/teachers/futureSchedule/FutureScheduleContainer";
import { redirect } from "@/shared/i18n/routing";

export const metadata: Metadata = {
  title: "Teacher Future Schedule - Siraj LMS",
};

interface PageProps {
  readonly params: Promise<{
    readonly id: string;
    readonly locale: string;
  }>;
}

export default async function FutureSchedulePage({ params }: PageProps) {
  const { id, locale } = await params;
  setRequestLocale(locale);

  const { userId } = await getServerUserContext();

  if (!userId) {
    redirect({ href: "/login", locale });
    return;
  }

  return <FutureScheduleContainer teacherId={id} />;
}
