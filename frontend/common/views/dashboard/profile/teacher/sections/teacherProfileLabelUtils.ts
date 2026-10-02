import type { ProfilePersonalFieldLabels } from "@/frontend/common/views/dashboard/profile/shared/types/profileSharedSection.types";
import {
  type TeacherProfileViewLabels,
  toTeacherBaseLabels,
} from "@/frontend/common/views/dashboard/profile/teacher/sections/teacherProfileTypes";

export function toTeacherSectionLabels(labels: TeacherProfileViewLabels) {
  return {
    teacher: labels.teacher,
    baseLabels: toTeacherBaseLabels(labels.base),
  };
}

export function toTeacherPersonalFieldLabels(labels: TeacherProfileViewLabels): ProfilePersonalFieldLabels {
  const t = labels.teacher;
  return {
    nationality: t.fields.nationality,
    address: t.fields.address,
    dateOfBirth: t.fields.dateOfBirth,
    gender: t.fields.gender,
    male: t.gender.male,
    female: t.gender.female,
    qualifications: t.fields.qualifications,
  };
}
