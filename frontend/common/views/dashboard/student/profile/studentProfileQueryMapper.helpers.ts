import { formatDate } from "@/frontend/common/components/intl/dateFormat";
import type { StudentProfileQuery } from "@/frontend/common/graphql/generated/gql/graphql";
import type { StudentProfileRow } from "@/frontend/common/views/dashboard/student/profile/types/studentProfileTypes";

export function mapStudentProfileFromQuery(profileData: StudentProfileQuery | undefined): StudentProfileRow | null {
  if (!profileData?.studentProfile) return null;
  const p = profileData.studentProfile;
  return {
    id: p.id ?? "",
    name: p.name ?? "",
    status: p.status ?? "",
    avatarUrl: p.avatarUrl ?? null,
    dateOfBirth: p.dateOfBirth ?? null,
    gender: p.gender ?? null,
    language: p.language ?? null,
    timezoneOverride: p.timezoneOverride ?? null,
    email: p.email ?? null,
    phone: p.phone ?? null,
    timezone: p.timezone ?? null,
    displayCurrency: p.displayCurrency ?? null,
    parentId: p.parentId ?? null,
    parentUserId: p.parentUserId ?? null,
    parentName: p.parentName ?? null,
    parentEmail: p.parentEmail ?? null,
    parentPhone: p.parentPhone ?? null,
    isAssociatedViewer: p.isAssociatedViewer ?? false,
    primaryTeacherId: p.primaryTeacherId ?? null,
    teacherUserId: p.teacherUserId ?? null,
    teacherName: p.teacherName ?? null,
    hoursPerWeek: p.hoursPerWeek ?? null,
    classesRemaining: p.classesRemaining ?? null,
    classesTotal: p.classesTotal ?? null,
    version: p.version ?? 0,
    createdAt: p.createdAt ?? null,
    updatedAt: p.updatedAt ?? null,
  };
}

export function formatStudentDateOfBirth(dateOfBirth: string | null, locale: string): string {
  if (!dateOfBirth) return "—";
  try {
    return formatDate(dateOfBirth, locale);
  } catch {
    return dateOfBirth;
  }
}
