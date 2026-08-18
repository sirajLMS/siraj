import type { QuotaLabels } from "@/shared/locale/types/dashboard/billing/quota";

const baseLabels = {
  title: "Quotas",
  breadcrumbLabel: "Quotas",
  newQuota: "New Quota",
  editQuota: "Edit Quota",
  quotaDetails: "Quota Details",
  insights: "Insights",
  listTitle: "All Quotas",
  noQuotas: "No quotas found",
};

const fieldLabels = {
  name: "Name",
  student: "Student",
  kind: "Kind",
  totalClasses: "Total Classes",
  remaining: "Remaining",
  reservedClasses: "Reserved",
  validUntil: "Valid Until",
  validFrom: "Valid From",
  status: "Status",
  periodType: "Period Type",
  priority: "Priority",
  all: "All",
  studentIdPlaceholder: "Select student",
  periodDays: "Period Days",
  periodDaysHelperText: "Days in period",
  periodDaysRequired: "Period days is required",
  validUntilAfterValidFrom: "Valid until must be after valid from",
  studentPickerPlaceholder: "Select a student",
  studentPickerNoOptions: "No students",
  studentPickerLoading: "Loading students...",
};

const enumLabels = {
  kinds: { PACKAGE: "Package", PERIODIC: "Periodic" },
  statuses: { ACTIVE: "Active", EXPIRED: "Expired", ARCHIVED: "Archived", PENDING: "Pending" },
  periodTypes: { WEEKLY: "Weekly", MONTHLY: "Monthly", CUSTOM: "Custom" },
};

const actionLabels = {
  actions: {
    create: "Create",
    save: "Save",
    edit: "Edit",
    delete: "Delete",
    cancel: "Cancel",
    viewLedger: "View Ledger",
    view: "View",
    filter: "Filter",
    addQuota: "Add Quota",
    exportCsv: "Export CSV",
  },
  deleteConfirm: {
    title: "Confirm Delete",
    body: (studentName: string) => `Are you sure you want to delete the quota for ${studentName}?`,
    cancel: "Cancel",
    confirm: "Delete",
  },
  errors: {
    createFailed: "Failed to create quota",
    updateFailed: "Failed to update quota",
    deleteFailed: "Failed to delete quota",
    loadFailed: "Failed to load quota data",
  },
  ledger: {
    title: "Ledger",
    reason: "Reason",
    delta: "Delta",
    note: "Note",
    date: "Date",
  },
};

const insightsLabels = {
  charts: {
    quotaPurchasesOverTime: "Quota Purchases Over Time",
    redemptionRateByType: "Redemption Rate by Type",
    packageDeliveryRate: "Package Delivery Rate",
    pendingCreditBacklogGauge: "Pending Credit Backlog",
    expiredSlippage: "Expired Slippage",
    months: "Months",
    classes: "Classes",
    packageType: "Package",
    periodicType: "Periodic",
    committed: "Committed",
    cancelled: "Cancelled",
    deliveryRate: "Delivery Rate",
    pendingCredits: "Pending Credits",
    expiredClasses: "Expired Classes",
    redeemedClasses: "Redeemed Classes",
  },
};

const miscLabels = {
  insightsTitle: "Quota Insights",
  activeQuotasCount: (count: number) => `${count} active quotas`,
  totalClassesRemaining: (count: number) => `${count} classes remaining`,
  expiringThisWeekCount: (count: number) => `${count} expiring this week`,
  quotaCount: (count: number) => `${count} quotas`,
  ledgerCount: (count: number) => `${count} entries`,
  deleteSuccess: "Quota deleted successfully",
  notFoundTitle: "Not Found",
  notFoundMessage: "The quota you are looking for does not exist.",
  notFoundBackButton: "Back to Quotas",
  errorGenericTitle: "Error",
  errorGeneric: "An error occurred",
  retry: "Retry",
  restrictedAccessHelperText: "You have view-only access",
  emptyListMessage: "No quotas yet",
  emptyListCta: "Create your first quota",
  insightsDateRangeLabel: "Date Range",
  insightsKindLabel: "Kind",
  insightsStatusLabel: "Status",
  insightsStudentLabel: "Student",
  exportSuccess: "Export successful",
  emptyInsightsMessage: "No insights data available",
};

export function createMockQuotaLabels(): QuotaLabels {
  return {
    ...baseLabels,
    fields: fieldLabels,
    ...enumLabels,
    ...actionLabels,
    ...insightsLabels,
    ...miscLabels,
  };
}
