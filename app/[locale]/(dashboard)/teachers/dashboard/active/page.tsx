import { redirect } from "@/shared/i18n/routing";

interface TeacherDashboardActiveRedirectPageProps {
  readonly params: Promise<{ locale: string }>;
}

export default async function TeacherDashboardActiveRedirectPage({ params }: TeacherDashboardActiveRedirectPageProps) {
  const { locale } = await params;
  redirect({ href: "/dashboard?mode=teacher-active", locale });
}
