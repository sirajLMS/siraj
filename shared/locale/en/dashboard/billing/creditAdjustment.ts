import type { CreditAdjustmentLabels } from "@/shared/locale/types/dashboard/billing/creditAdjustment";

export const dashboardBillingCreditAdjustmentEn: CreditAdjustmentLabels = {
  title: "Student Credits",
  adjustCredits: "Adjust Credits",
  adjustmentType: {
    title: "Adjustment Type",
    add: "Add",
    subtract: "Subtract",
    subtractWithCarryover: "Subtract With Carryover",
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
