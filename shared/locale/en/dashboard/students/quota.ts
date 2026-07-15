import type { StudentQuotaLabels } from "@/shared/locale/types/dashboard/students";

export const quota: StudentQuotaLabels = {
  pageTitle: "Student Quota",
  studentId: id => `Student ID: ${id}`,
  common: {
    system: "System",
    notSet: "Not set",
  },
  breadcrumbs: {
    students: "Students",
    adjustQuota: "Adjust Quota",
  },
  sections: {
    studentInfo: "Student Information",
    courseDetails: "Course Details",
  },
  fields: {
    studentName: "Student Name",
    studentNamePlaceholder: "Enter student name",
    dateOfBirth: "Date of Birth",
    language: "Language",
    arabic: "Arabic",
    english: "English",
    gender: "Gender",
    male: "Male",
    female: "Female",
    teacher: "Teacher",
    loadingTeachers: "Loading teachers...",
    totalClasses: "Total Classes",
    classesLeft: "Classes Left",
    overrideActive: "Override Active",
    overrideNotice: "This quota was last adjusted by system. Manual changes will disable auto-updates.",
  },
  actions: {
    save: "Save Changes",
    cancel: "Cancel",
    saving: "Saving...",
    saved: "Saved!",
    saveSuccess: "Student quota updated successfully.",
    lastEditedAt: time => `Last edited ${time}`,
  },
  info: {
    quotaTitle: "Quota Management",
    quotaDesc: "Manage the student's class quota. Adjustments are synced with system invoicing.",
    publicTitle: "Public Profile",
    publicDesc: "Changes here affect public-facing profiles.",
  },
  validation: {
    nameRequired: "Student name is required",
    dobRequired: "Date of birth is required",
    languageRequired: "Language is required",
    genderRequired: "Gender is required",
    teacherRequired: "Teacher is required",
    totalClassesRequired: "Total classes is required",
    totalClassesMin: "Total classes must be at least 1",
    classesLeftRequired: "Classes left is required",
    classesLeftMin: "Classes left must be at least 0",
  },
  errors: {
    invalidId: "Invalid student ID",
  },
};
