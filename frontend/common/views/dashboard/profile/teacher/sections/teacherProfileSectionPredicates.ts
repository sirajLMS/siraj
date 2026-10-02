// NEW FOR PLAN v5: predicates that previously leaked as lowercase helpers in both
// teacherProfile.mobile.tsx and teacherProfile.desktop.tsx (specs.md §3 N9). Lifted here
// so both tiers import the same pure-data helpers instead of re-declaring them inline.
import {
  isTeacherAdminData,
  type TeacherAdminData,
  type TeacherViewData,
} from "@/frontend/common/views/dashboard/profile/teacher/sections/teacherProfileTypes";

export function hasTeacherCompensationData(teacherData: TeacherViewData): boolean {
  return teacherData.hourlyRate != null ? teacherData.hourlyRate.trim() !== "" : teacherData.rateCurrency != null;
}

export function hasTeacherStatsData(teacherData: TeacherViewData): boolean {
  const adminData = isTeacherAdminData(teacherData) ? teacherData : null;
  return teacherData.totalClasses != null || adminData?.avgEngagementScore != null;
}

export function hasTeacherPersonalData(teacherData: TeacherViewData): boolean {
  const adminData = isTeacherAdminData(teacherData) ? teacherData : null;
  return [
    teacherData.nationality?.trim(),
    adminData?.address?.trim(),
    adminData?.dateOfBirth?.trim(),
    adminData?.gender,
    adminData?.qualifications?.trim(),
  ].some(Boolean);
}

export function hasTeacherAdminOnlyData(adminData: TeacherAdminData): boolean {
  return [adminData.nationalId?.number?.trim(), adminData.status].some(Boolean);
}
