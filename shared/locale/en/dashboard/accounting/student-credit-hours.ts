import type { StudentCreditHoursLabels } from "@/shared/locale/types/dashboard/accounting/student-credit-hours";

export const dashboardAccountingStudentCreditHoursEn: StudentCreditHoursLabels = {
  tabTitle: "Credit Hours",
  balanceCardTitle: "Credit Hours Balance",
  remainingLabel: "Remaining",
  totalLabel: "Total Purchased",
  hoursUnit: hours => `${hours} hrs`,
  recentPurchasesTitle: "Recent Hour Activity",
  recentPurchasesEmpty: "No credit-hour activity yet.",
  lowBalanceAlert: (remaining, threshold) =>
    `Low balance: ${remaining} hrs remaining (threshold ${threshold} hrs). Consider purchasing a package.`,

  columns: {
    date: "Date",
    change: "Change",
    reason: "Reason",
    note: "Note",
  },

  reasons: {
    PURCHASE: "Purchase",
    DEDUCTION: "Class",
    REFUND: "Refund",
    ADJUSTMENT: "Adjustment",
  },

  perAudience: {
    studentHint: "Hours are consumed per class based on its duration.",
    parentHint: "Top up your child's hours by purchasing a package from the academy.",
    teacherHint: "Assigned students' hour balances. The next class will consume the hours above.",
    supervisorHint: "Summary of all students' credit-hour balances.",
  },

  nextClassConsumes: hours => `Next class consumes ~${hours} hrs`,
  loadError: "Failed to load the credit-hours summary. Please try again.",
};
