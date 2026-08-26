import type { Metadata } from "next";
import { buildTranslatedMetadata } from "@/app/__shared__/buildEntityPageTitle";
import { StudentWeekCalendarContainer } from "@/frontend/desktop/views/dashboard/scheduling/studentWeekCalendar.desktop";

export async function generateMetadata(): Promise<Metadata> {
  return buildTranslatedMetadata(t => t.dashboardTranslations.coreNav.studentWeekSchedule);
}

export default function StudentWeekCalendarPage() {
  return <StudentWeekCalendarContainer />;
}
