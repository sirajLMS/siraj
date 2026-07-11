import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getStudentPageTitle } from "@/backend/lib/titles/cached-page-title";
import { StudentProfilePageClient } from "@/frontend/views/dashboard/students/profile/StudentProfilePageClient";

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly id: string; readonly locale: string }>;
}): Promise<Metadata> {
  const { id, locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard.studentProfile" });
  const studentName = await getStudentPageTitle(id);
  if (studentName) {
    return { title: studentName };
  }
  return { title: t("title") };
}

export default function StudentProfilePage() {
  return <StudentProfilePageClient />;
}
