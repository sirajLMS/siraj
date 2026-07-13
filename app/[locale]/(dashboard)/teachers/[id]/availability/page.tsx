// cspell:disable
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getTeacherPageTitle } from "@/backend/lib/titles/cached-page-title";
import { TeacherAvailabilityContainer } from "@/frontend/common/views/dashboard/teachers/availability/TeacherAvailabilityContainer";

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
  const t = await getTranslations({ locale, namespace: "dashboard.teacherAvailability" });
  const teacherName = await getTeacherPageTitle(id);
  if (teacherName) {
    return { title: `${teacherName} — ${t("pageTitle")}` };
  }
  return { title: t("pageTitle") };
}

export default async function TeacherAvailabilityPage({ params }: PageProps) {
  const { id } = await params;
  return <TeacherAvailabilityContainer teacherId={id} />;
}
