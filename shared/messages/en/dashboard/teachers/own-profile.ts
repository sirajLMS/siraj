import type { TeacherOwnProfileLabels } from "@/shared/messages/types/dashboard/teachers";

export const ownProfile: TeacherOwnProfileLabels = {
  pageTitle: "My Profile",
  pageSubtitle: "Manage your information",
  notSet: "Not set",
  sections: {
    title: "Profile Sections",
    contact: "Contact Information",
    salary: "Salary Information",
    systemConfig: "System Configuration",
  },
  fields: {
    baseSalary: "Base Salary",
    paymentMethod: "Payment Method",
    accountStatus: "Account Status",
    accountStatusDesc: "Your current account status",
    active: "Active",
    inactive: "Inactive",
    displayCurrency: "Display Currency",
  },
  actions: {
    saveProfile: "Save Profile",
    discardChanges: "Discard Changes",
    lastModified: "Last modified {date}",
    saveSuccess: "Profile saved successfully!",
    saveError: "Failed to save profile.",
  },
  errors: {
    failedToLoad: "Failed to load profile.",
  },
};
