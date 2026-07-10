import type { TeacherOwnProfileLabels } from "@/shared/messages/types/dashboard/teachers";

export const ownProfile: TeacherOwnProfileLabels = {
  pageTitle: "My Profile",
  pageSubtitle: "Manage your information",
  notSet: "Not set",
  sections: {
    contact: "Contact Information",
    salary: "Salary Information",
  },
  baseSalary: "Base Salary",
  paymentMethod: "Payment Method",
  errors: {
    failedToLoad: "Failed to load profile.",
  },
};
