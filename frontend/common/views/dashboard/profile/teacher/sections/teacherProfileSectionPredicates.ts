// NEW FOR PLAN v5: predicates that previously leaked as lowercase helpers in both
// teacherProfile.mobile.tsx and teacherProfile.desktop.tsx (specs.md §3 N9). Lifted here
// so both tiers import the same pure-data helpers instead of re-declaring them inline.
import type {
  TeacherAdminData,
  TeacherViewData,
} from "@/frontend/common/views/dashboard/profile/teacher/sections/teacherProfileTypes";
import { isTeacherAdminData } from "@/frontend/common/views/dashboard/profile/teacher/sections/teacherProfileTypes";

export function hasTeacherProfessionalData(teacherData: TeacherViewData): boolean {
  return hasTeacherCompensationData(teacherData) || hasTeacherStatsData(teacherData);
}

export function hasTeacherCompensationData(teacherData: TeacherViewData): boolean {
  return Boolean(teacherData.hourlyRate?.trim() || teacherData.rateCurrency);
}

export function hasTeacherStatsData(teacherData: TeacherViewData): boolean {
  const adminData = isTeacherAdminData(teacherData) ? teacherData : null;
  return teacherData.totalClasses != null || adminData?.avgEngagementScore != null;
}

export function hasTeacherIdentityData(adminData: TeacherAdminData): boolean {
  return Boolean(
    adminData.nationalId?.trim() ||
      adminData.dateOfBirth?.trim() ||
      adminData.gender ||
      adminData.address?.trim() ||
      adminData.qualifications?.trim() ||
      adminData.timezone?.trim() ||
      adminData.status
  );
}
