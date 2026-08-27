import type { PackagePlansLabels } from "@/shared/locale/types/dashboard/accounting/package-plans";

export const dashboardAccountingPackagePlansEn: PackagePlansLabels = {
  pageTitle: "Package Plans",
  pageSubtitle: "Predefined credit-hour packages that auto-fill the Add Payment form.",
  createPlan: "Create Package Plan",
  createTitle: "Create Package Plan",
  editTitle: "Edit Package Plan",

  columns: {
    codename: "Codename",
    displayName: "Display Name",
    creditHours: "Credit Hours",
    price: "Price",
    currency: "Currency",
    active: "Active",
    sortOrder: "Sort Order",
    actions: "Actions",
  },

  form: {
    codename: "Codename",
    codenamePlaceholder: "e.g. PLAN_A_4HRS",
    codenameHelp: "Unique machine code; shown on payment records.",
    displayName: "Display Name",
    description: "Description",
    creditHours: "Credit Hours",
    priceAmount: "Price",
    currency: "Currency",
    active: "Active",
    activeHelp: "Inactive plans are hidden from the Add Payment dropdown but keep their history.",
    sortOrder: "Sort Order",
    validityMonths: "Validity (months)",
    submit: "Save Plan",
    cancel: "Cancel",
    saving: "Saving…",
  },

  archiveTitle: "Archive Package Plan",
  archiveBody: name =>
    `Archive "${name}"? Past payments keep their recorded snapshot, but the plan disappears from new payment forms.`,
  archiveConfirm: "Archive",
  archived: "Archived",
  empty: "No package plans yet. Create the first one to enable package payments.",
  loadError: "Failed to load package plans. Please try again.",
  saveSuccess: "Package plan saved successfully.",
  saveError: "Failed to save the package plan. Please review and try again.",
  archiveSuccess: "Package plan archived.",
  hoursUnit: hours => `${hours} hrs`,
};
