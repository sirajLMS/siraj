import type { ManagerOnboardingLabels } from "@/shared/locale/types/dashboard/managers";

export const dashboardManagerOnboardingEn: ManagerOnboardingLabels = {
  pageTitle: "Manager Onboarding",
  pageSubtitle: "Register a new administrative staff member into the Siraj management system.",
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
    email: "s.alfarsi@siraj-lms.edu",
    phone: "+966 50 000 0000",
    department: "Select Department",
    password: "Enter Password",
  },
  options: {
    accountType: {
      manager: "Manager",
      admin: "Administrator",
      supervisor: "Supervisor",
    },
    accountTypeDescriptions: {
      manager: "Managers oversee curricula and teaching staff with limited financial access.",
      admin: "Administrators have full system control, including financial management and general settings.",
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
    signup: "Sign Up",
    processing: "Processing...",
    cancel: "Cancel",
    successMessage: "Account request submitted successfully. Pending approval from the main administrator.",
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
