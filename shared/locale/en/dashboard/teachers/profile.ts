import type { TeacherProfileLabels } from "@/shared/locale/types/dashboard/teachers";

export const profile: TeacherProfileLabels = {
  pageTitle: "Teacher Profile",
  pageSubtitle: "View and edit teacher details",
  breadcrumbs: {
    teachers: "Teachers",
    editProfile: "Edit Profile",
  },
  sections: {
    teacherInfo: "Teacher Information",
    salaryDetails: "Salary Details",
    systemConfig: "System Configuration",
  },
  fields: {
    fullName: "Full Name",
    email: "Email",
    phone: "Phone",
    gender: "Gender",
    male: "Male",
    female: "Female",
    timezone: "Timezone",
    address: "Address",
    baseSalary: "Base Salary",
    currency: "Currency",
    paymentMethod: "Payment Method",
    accountStatus: "Account Status",
    accountStatusDesc: "Current account status",
    active: "Active",
    inactive: "Inactive",
    displayCurrency: "Display Currency",
    hourlyRate: "Hourly Rate",
    qualifications: "Qualifications",
  },
  actions: {
    saveProfile: "Save Profile",
    discardChanges: "Discard Changes",
    lastModified: date => `Last modified ${date}`,
    saveSuccess: "Profile saved successfully!",
    saveError: "Failed to save profile.",
  },
  stats: {
    totalClasses: "Total Classes",
    avgEngagement: "Average Engagement",
  },
  validation: {
    nameRequired: "Name is required",
    emailRequired: "Email is required",
    emailInvalid: "Invalid email format",
    timezoneRequired: "Timezone is required",
  },
};
