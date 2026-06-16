import { redirect } from "next/navigation";

interface TeacherDashboardRedirectPageProps {
  readonly params: Promise<{ locale: string }>;
}

export default async function TeacherDashboardRedirectPage({ params }: TeacherDashboardRedirectPageProps) {
  const { locale } = await params;
  redirect(`/${locale}/dashboard?mode=teacher`);
}
