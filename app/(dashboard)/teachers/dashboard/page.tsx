import { redirect } from "@/shared/i18n/routing";

export default async function TeacherDashboardRedirectPage() {
  redirect({ href: "/dashboard" });
}
