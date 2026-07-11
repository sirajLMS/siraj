import { cache } from "react";

import { ClassSubjectRepository } from "@/backend/db/repo/classes/class-subject.repository";
import { RecurringScheduleRepository } from "@/backend/db/repo/scheduling/recurring-schedule.repository";
import { StudentRepository } from "@/backend/db/repo/students/student.repository";
import { TeacherRepository } from "@/backend/db/repo/teachers/teacher.repository";
import { UserRepository } from "@/backend/db/repo/users/user.repository";

export const getStudentPageTitle = cache(async (studentId: string): Promise<string | null> => {
  const student = await StudentRepository.findById(studentId);
  return student?.name ?? null;
});

export const getSubjectPageTitle = cache(async (subjectId: string): Promise<string | null> => {
  try {
    const subject = await ClassSubjectRepository.getSubjectById(subjectId);
    return subject.name;
  } catch {
    return null;
  }
});

export const getTeacherPageTitle = cache(async (teacherId: string): Promise<string | null> => {
  const teacher = await TeacherRepository.findById(teacherId);
  if (!teacher) {
    return null;
  }
  const user = await UserRepository.findSafeById(teacher.userId);
  return user?.name ?? null;
});

export const getUserPageTitle = cache(async (userId: string): Promise<string | null> => {
  const user = await UserRepository.findSafeById(userId);
  return user?.name ?? null;
});

export const getRecurringSchedulePageTitle = cache(async (scheduleId: string): Promise<string | null> => {
  const schedule = await RecurringScheduleRepository.findById(scheduleId);
  if (!schedule) {
    return null;
  }
  return schedule.studentName ?? null;
});
