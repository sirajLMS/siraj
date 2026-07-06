import { redirect } from "@/shared/i18n/routing";

interface TeacherDashboardRedirectPageProps {
  readonly params: Promise<{ locale: string }>;
}

export default async function TeacherDashboardRedirectPage({ params }: TeacherDashboardRedirectPageProps) {
  const { locale } = await params;
  redirect({ href: "/dashboard", locale });
}
