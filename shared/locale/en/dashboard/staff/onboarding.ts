import type { StaffOnboardingLabels } from "@/shared/locale/types/dashboard/staff/onboarding";

export const dashboardStaffOnboardingEn: StaffOnboardingLabels = {
  pageTitle: "Staff Onboarding",
  pageSubtitle: "Register a new staff member.",
  sections: {
    staffInfo: "Staff Information",
    systemAccess: "System Permissions",
  },
  fields: {
    fullName: "Full Name",
    email: "Official Email",
    phone: "Phone Number",
    accountType: "Account Type",
    department: "Primary Department",
    password: "Password",
    avatar: "Avatar",
  },
  placeholders: {
    fullName: "e.g. Dr. Salman Al-Farsi",
    email: "example@email.com",
    phone: "+1 00 000 0000",
    department: "Select Department",
    password: "Enter Password",
  },
  options: {
    accountType: {
      manager: "Manager",
      supervisor: "Supervisor",
    },
    accountTypeDescriptions: {
      manager: "Full system access for managing teachers, students, schedules, and billing — except permission control",
      supervisor: "Supervisors oversee teachers, review reports, and manage daily educational activities.",
    },
    department: {
      academic: "Academic Affairs",
      operations: "Student Operations",
      humanResources: "Human Resources",
      itSupport: "IT Support",
    },
  },
  actions: {
    signup: "Create Staff",
    processing: "Processing...",
    cancel: "Cancel",
    successMessage: "Account request submitted successfully. Pending approval from the main administrator.",
    errorMessage: "Failed to create account. Please try again.",
  },
  metrics: {
    activeStaff: "Active Staff",
    pendingApproval: "Pending Approval",
    avgOnboarding: "Average Onboarding",
  },
  validation: {
    fullNameRequired: "Full name is required",
    emailInvalid: "Email is invalid",
    departmentRequired: "Primary department is required",
  },
};
