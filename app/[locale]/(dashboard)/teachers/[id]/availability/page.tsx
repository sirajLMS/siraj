// cspell:disable
import type { Metadata } from "next";
import { TeacherAvailabilityContainer } from "@/frontend/views/dashboard/teachers/availability/TeacherAvailabilityContainer";

export const metadata: Metadata = {
  title: "Teacher Availability | Siraj LMS",
  description: "Visualize and search available time slots across the faculty.",
};

export default function TeacherAvailabilityPage() {
  return <TeacherAvailabilityContainer />;
}
