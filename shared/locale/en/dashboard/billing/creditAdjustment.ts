import type { CreditAdjustmentLabels } from "@/shared/locale/types/dashboard/billing/creditAdjustment";

export const dashboardBillingCreditAdjustmentEn: CreditAdjustmentLabels = {
  title: "Student Credits",
  adjustCredits: "Adjust Credits",
  adjustmentType: {
    title: "Adjustment Type",
    add: "Add",
    subtract: "Subtract",
    subtractWithCarryover: "Subtract With Carryover",
    addDescription: "Grant bonus hours",
    subtractDescription: "Deduct unearned hours",
    subtractWithCarryoverDescription: "Deduct hours and owe payout to a teacher",
  },
  carryover: {
    bannerTitle: "Carryover — allocate to teacher",
    teacher: "Teacher",
    fromDate: "From Date",
    toDate: "To Date",
    paymentDate: "Payment Date",
  },
  reason: { label: "Reason" },
  hours: { label: "Hours" },
  form: {
    balance: "Balance",
    internalNotes: "Internal Notes",
    internalNotesHint: "Visible to staff only — never shown to students or parents.",
  },
  preview: {
    balance: (from, to) => `Classes remaining: ${from} → ${to}`,
  },
  summary: {
    add: (hours, student) => (hours === 1 ? `Add 1 hour to ${student}` : `Add ${hours} hours to ${student}`),
    subtract: (hours, student) =>
      hours === 1 ? `Subtract 1 hour from ${student}` : `Subtract ${hours} hours from ${student}`,
    carryover: (hours, teacher, paymentDate) =>
      hours === 1
        ? `Subtract 1 hour; 1 payout hour to ${teacher} by ${paymentDate}`
        : `Subtract ${hours} hours; ${hours} payout hours to ${teacher} by ${paymentDate}`,
  },
  resultsCappedHint: limit => `Showing the first ${limit} students. Refine your search to narrow the list.`,
  validation: {
    fromAfterTo: "From Date cannot be after To Date",
    paymentTooFar: "Payment Date cannot be more than 1 day ahead",
    insufficientClasses: "Student has insufficient credit hours",
    hoursPositive: "Hours must be a positive whole number",
  },
  success: {
    added: hours => `Added ${hours} credit hours`,
    subtracted: hours => `Subtracted ${hours} credit hours`,
    carryover: (hours, teacher) => `Subtracted ${hours} hours and allocated carryover to ${teacher}`,
  },
};
