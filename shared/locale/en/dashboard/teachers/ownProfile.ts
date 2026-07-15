import type { TeacherOwnProfileLabels } from "@/shared/locale/types/dashboard/teachers";

export const ownProfile: TeacherOwnProfileLabels = {
  pageTitle: "My Profile",
  pageSubtitle: "Manage your information",
  notSet: "Not set",
  sections: {
    contact: "Contact Information",
    salary: "Salary Information",
  },
  baseSalary: (amount, currency) => `Base Salary: ${amount} ${currency}`,
  paymentMethod: method => `Payment Method: ${method}`,
  errors: {
    failedToLoad: "Failed to load profile.",
  },
};
