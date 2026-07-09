import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { redirectToLogin } from "@/frontend/lib/redirectToLogin";
import { FutureScheduleContainer } from "@/frontend/views/dashboard/teachers/futureSchedule/FutureScheduleContainer";

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
    await redirectToLogin(locale);
    return;
  }

  return <FutureScheduleContainer teacherId={id} />;
}
