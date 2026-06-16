import { redirect } from "next/navigation";

interface TeacherDashboardActiveRedirectPageProps {
  readonly params: Promise<{ locale: string }>;
}

export default async function TeacherDashboardActiveRedirectPage({ params }: TeacherDashboardActiveRedirectPageProps) {
  const { locale } = await params;
  redirect(`/${locale}/dashboard?mode=teacher-active`);
}
