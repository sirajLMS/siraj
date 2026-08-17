import type { ProfileStaffLabels } from "../../../types/profile";

export const profileStaffEn: ProfileStaffLabels = {
  ownSubtitle: "View and update your account and contact details.",
  subtitle: "Manage system-wide roles and permissions for administrative staff.",
  adminBanner: "Admin view: Status and permissions visible.",
  sections: {
    account: "Account Information",
    contact: "Contact Information",
    role: "Role Information",
    compensation: "Compensation",
    permissions: "Effective Permissions",
  },
  fields: {
    fullName: "Full Name",
    primaryEmail: "Email",
    phone: "Phone",
    timezone: "Timezone",
    roleName: "Role",
    roleSlug: "Role ID",
    department: "Department",
    status: "Account Status",
    statusActive: "Active",
    statusInactive: "Inactive",
    displayCurrency: "Display Currency",
    hourlyRate: "Hourly Rate",
    currency: "Currency",
    avatar: "Avatar",
  },
  permissions: {
    inheritedGroups: "Permission Groups",
    directOverrides: "Direct Overrides",
    empty: {
      title: "No permission groups assigned",
      description: "This staff member has no inherited permission groups. Assign groups via Permission Management.",
      ownDescription: "You do not have any permission groups assigned yet.",
    },
    columns: {
      resource: "Resource",
      action: "Action",
      state: "Status",
    },
    states: {
      granted: "Granted",
      denied: "Denied",
    },
  },
};
