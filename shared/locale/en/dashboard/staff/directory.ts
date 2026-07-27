import type { StaffDirectoryLabels } from "@/shared/locale/types/dashboard/staff/directory";

export const dashboardStaffDirectoryEn: StaffDirectoryLabels = {
  pageTitle: "Staff Directory",
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
    supervisor: "Supervisor",
    statusAll: "Status: All",
    active: "Active",
    inactive: "Inactive",
  },
  table: {
    hash: "#",
    manager: "Manager",
    status: "Status",
    contactDetails: "Contact Details",
    phone: "Phone",
    roleType: "Role Type",
    options: "Options",
  },
  fields: {
    phone: "Phone",
  },
  actions: {
    addManager: "Add New Staff",
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
    supervisor: "Supervisor",
  },
  showingOf: (count, total) => `Showing ${count} of ${total} results`,
  noEntries: "No managers",
};
