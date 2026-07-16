// cspell:disable
import type { Metadata } from "next";
import { getTeacherPageTitle } from "@/backend/lib/titles/cached-page-title";
import { TeacherAvailabilityContainer } from "@/frontend/common/views/dashboard/teachers/availability/TeacherAvailabilityContainer";
import { getTranslations } from "@/shared/locale";

interface PageProps {
  readonly params: Promise<{
    readonly id: string;
    readonly locale: string;
  }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ readonly id: string; readonly locale: string }>;
}): Promise<Metadata> {
  const { id, locale } = await params;
  const t = getTranslations(locale).dashboardTranslations.teacherAvailability;
  const teacherName = await getTeacherPageTitle(id);
  if (teacherName) {
    return { title: `${teacherName} — ${t.pageTitle}` };
  }
  return { title: t.pageTitle };
}

export default async function TeacherAvailabilityPage({ params }: PageProps) {
  const { id } = await params;
  return <TeacherAvailabilityContainer teacherId={id} />;
}
