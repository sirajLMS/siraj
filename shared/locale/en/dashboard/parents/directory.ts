import type { ParentsDirectoryLabels } from "@/shared/locale/types/dashboard/parents";

export const directory: ParentsDirectoryLabels = {
  pageTitle: "Parents Directory",
  pageSubtitle: "Manage guardian profiles, subscription statuses, and financial records.",
  searchPlaceholder: "Search parents...",
  records: "Parent Records",
  metrics: {
    regular: "Regular",
    onLeave: "On Leave",
    suspended: "Suspended",
    onTrial: "On Trial",
  },
  table: {
    index: "#",
    image: "Image",
    name: "Name",
    email: "Email",
    time: "Time",
    status: "Lifecycle",
    accountStatus: "Account",
    unpaidInvoices: "Unpaid Invoices",
    options: "Options",
  },
  card: {
    guardianOf: name => `Guardian of ${name}`,
    unpaidCount: count => `Unpaid: ${count}`,
    invoicesCleared: "Invoices Cleared",
  },
  accountStatus: {
    activated: "Activated",
    deactivated: "Deactivated",
  },
  actions: {
    addParent: "Add New Parent",
    filter: "Filter",
    clearFilters: "Clear Filters",
    manageLifecycle: "Manage lifecycle",
  },
  noEntries: "No parents found",
};
