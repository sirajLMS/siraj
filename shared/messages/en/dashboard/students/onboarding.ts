import type { StudentOnboardingLabels } from "@/shared/messages/types/dashboard/students";

export const onboarding: StudentOnboardingLabels = {
  pageTitle: "New Student Registration",
  pageSubtitle: "Complete the following fields to enroll a new student under an existing parent.",
  statusBanner: "Account Status: Pending Registration",
  sections: {
    parentAssignment: "Parent Assignment",
    studentInfo: "Student Information",
    teacherAssignment: "Teacher Assignment",
  },
  fields: {
    parent: "Parent",
    name: "Student Name",
    dateOfBirth: "Date of Birth",
    gender: "Gender",
    language: "Language",
    status: "Status",
    primaryTeacher: "Primary Teacher",
    male: "Male",
    female: "Female",
  },
  placeholders: {
    parent: "Select parent",
    name: "e.g. Ahmed Mohammed",
    dateOfBirth: "YYYY-MM-DD",
    gender: "Select gender",
    language: "Select language",
    status: "Select status",
    primaryTeacher: "Select teacher (optional)",
  },
  options: {
    status: {
      onTrial: "On Trial",
      regular: "Regular",
    },
  },
  actions: {
    create: "Create Student",
    processing: "Creating...",
    successMessage: "Student created successfully.",
  },
  validation: {
    parentRequired: "Parent is required",
    nameRequired: "Student name is required",
    nameMinLength: "Name must be at least 3 characters",
  },
};
