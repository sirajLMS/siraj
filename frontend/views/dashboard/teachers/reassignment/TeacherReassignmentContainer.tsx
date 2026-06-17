"use client";

import { useStudentsStore } from "@/frontend/stores/mockStudentsStore";
import { useTeachersStore } from "@/frontend/stores/mockTeachersStore";
import { TeacherReassignmentView } from "./TeacherReassignmentView";

export function TeacherReassignmentContainer() {
  const { rows: teachers } = useTeachersStore();
  const { rows: students } = useStudentsStore();

  // For this prototype, we'll use Zaid Al-Mansour (stu-005) or the first student if not found
  const student = students.find(s => s.id === "stu-005") || students[0];

  return <TeacherReassignmentView student={student} currentTeacherName="Unset" teachers={teachers} />;
}
