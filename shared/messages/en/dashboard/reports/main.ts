import type { ReportsLabels } from "@/shared/messages/types/dashboard/reports";

export const reports: ReportsLabels = {
  pageTitle: "Main Reports Engine",
  pageSubtitle: "Main reporting and analytics engine",
  filtersTitle: "Report Filters",
  fromDate: "From date",
  toDate: "To date",
  teacher: "Teacher",
  allTeachers: "All teachers",
  reportType: "Report type",
  submit: "Submit",
  exportCsv: "Export CSV",
  printReport: "Print report",
  export: {
    pageTitle: "Attendance report",
  },
  reportTypes: {
    byTeacher: "By teacher",
    byStudent: "By student",
    byDate: "By date",
  },
  table: {
    name: "Name (teacher/student)",
    taken: "Attended",
    absent: "Absent",
    leave: "Leave",
    pending: "Pending",
    hours: "Hours",
    paid: "Paid",
    paidDisplay: "Paid (displayed)",
    paidLocked: "Paid (locked)",
    totals: "Total:",
  },
  convertedAmount: "{lockedAmount} {lockedCurrency} (approx {convertedApprox} {displayCurrency})",
  summary: {
    engagementRate: "Engagement rate",
    engagementGrowth: "Growth compared to last month",
    increase: "Increase",
    financialDistribution: "Financial distribution",
    financialSubtitle: "Multi-currency spending overview",
  },
  ledger: {
    title: "Performance ledger",
    studentLabel: "Student: {name}",
    paid: "Paid",
  },
  status: {
    active: "Active",
    onBreak: "On break",
  },
  noEntries: "No report data for this range",
  reportMultiCurrencyNote:
    "Financial distribution shows amounts in their original currencies. Use the report filter to narrow by teacher for currency-specific totals.",
};
