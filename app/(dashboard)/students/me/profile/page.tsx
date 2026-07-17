import type { Metadata } from "next";
import { StudentProfileView } from "@/frontend/common/views/dashboard/student/profile/StudentProfileContainer";
import { getTranslations } from "@/shared/locale";

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ readonly locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = getTranslations(locale).dashboardTranslations.studentPortalProfile;
  return { title: t.pageTitle };
}

export default function StudentProfilePage() {
  return <StudentProfileView />;
}
