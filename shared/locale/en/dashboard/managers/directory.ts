import type { ManagersDirectoryLabels } from "@/shared/locale/types/dashboard/managers";

export const directory: ManagersDirectoryLabels = {
  pageTitle: "Managers Directory",
  pageSubtitle: "Comprehensive management of administrative staff and system personnel.",
  mobileTitle: "Staff Directory",
  metrics: {
    totalAdmin: "Total Admins",
    systemStaff: "System Staff",
    activeNow: "Active Now",
    alerts: "Permission Alerts",
  },
  filters: {
    allRoleTypes: "All Role Types",
    admin: "Admin",
    staff: "Staff",
    statusAll: "Status: All",
    active: "Active",
    inactive: "Inactive",
  },
  table: {
    hash: "#",
    manager: "Manager",
    contactDetails: "Contact Details",
    phone: "Phone",
    roleType: "Role Type",
    options: "Options",
  },
  fields: {
    phone: "Phone",
  },
  actions: {
    addManager: "Add New Manager",
    options: "Options",
    editProfile: "Edit Profile",
    deactivate: "Deactivate",
    activate: "Activate",
    cancel: "Cancel",
    processing: "Processing...",
    save: "Save",
    deactivateConfirmation: name => `Are you sure you want to deactivate ${name}?`,
    activateConfirmation: name => `Are you sure you want to activate ${name}?`,
  },
  status: {
    active: "Active",
    offline: "Offline",
  },
  roles: {
    admin: "Admin",
    staff: "Staff",
  },
  showingOf: (count, total) => `Showing ${count} of ${total} results`,
  noEntries: "No managers",
};
