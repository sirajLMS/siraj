import type { Metadata } from "next";
import { StudentWeekCalendarContainer } from "@/frontend/desktop/views/dashboard/scheduling/studentWeekCalendar.desktop";

export const metadata: Metadata = { title: "Weekly Schedule" };

export default function StudentWeekCalendarPage() {
  return <StudentWeekCalendarContainer />;
}
