// cspell:disable
import type { Metadata } from "next";
import { TeacherAvailabilityContainer } from "@/frontend/views/dashboard/teachers/availability/TeacherAvailabilityContainer";

export const metadata: Metadata = {
  title: "Teacher Availability | Siraj LMS",
  description: "Visualize and search available time slots across the faculty.",
};

interface PageProps {
  readonly params: Promise<{
    readonly id: string;
    readonly locale: string;
  }>;
}

export default async function TeacherAvailabilityPage({ params }: PageProps) {
  const { id } = await params;
  return <TeacherAvailabilityContainer teacherId={id} />;
}
