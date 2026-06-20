import type { Metadata } from "next";
import TeacherWeeklyScheduleContainer from "@/frontend/views/dashboard/teachers/schedule/weekly/TeacherWeeklyScheduleContainer";

export const metadata: Metadata = {
  title: "Teacher Weekly Schedule - Siraj LMS",
};

interface PageProps {
  readonly params: Promise<{
    readonly id: string;
    readonly locale: string;
  }>;
}

export default async function TeacherWeeklySchedulePage({ params }: PageProps) {
  const { id } = await params;
  return <TeacherWeeklyScheduleContainer teacherId={id} />;
}
