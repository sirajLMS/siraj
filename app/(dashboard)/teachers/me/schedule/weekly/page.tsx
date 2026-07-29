import { redirect } from "@/shared/i18n/routing";

export default function TeacherMeWeeklyScheduleRedirectPage() {
  redirect({ href: "/schedule/weekly" });
}
