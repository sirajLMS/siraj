import type { StudentQuotaLabels } from "@/shared/locale/types/dashboard/students/quota";

const commonLabels: StudentQuotaLabels["common"] = { system: "System", notSet: "Not Set" };

const breadcrumbsLabels: StudentQuotaLabels["breadcrumbs"] = {
  students: "Students",
  adjustQuota: "Adjust Quota",
};

const sectionsLabels: StudentQuotaLabels["sections"] = {
  studentInfo: "Student Info",
  courseDetails: "Course Details",
};

const fieldsLabels: StudentQuotaLabels["fields"] = {
  studentName: "Student Name",
  studentNamePlaceholder: "Enter name",
  dateOfBirth: "Date of Birth",
  language: "Language",
  arabic: "Arabic",
  english: "English",
  gender: "Gender",
  male: "Male",
  female: "Female",
  teacher: "Teacher",
  loadingTeachers: "Loading teachers…",
  totalClasses: "Total Classes",
  classesLeft: "Classes Left",
  overrideActive: "Override Active",
  overrideNotice: "Manual override in effect",
};

const actionsLabels: StudentQuotaLabels["actions"] = {
  save: "Save",
  cancel: "Cancel",
  saving: "Saving…",
  saved: "Saved",
  saveSuccess: "Changes saved successfully",
  lastEditedAt: (time: string) => `Last edited ${time}`,
};

const infoLabels: StudentQuotaLabels["info"] = {
  quotaTitle: "Quota Information",
  quotaDesc: "Manage student class quota",
  publicTitle: "Public Profile",
  publicDesc: "Visible to parents",
};

const validationLabels: StudentQuotaLabels["validation"] = {
  nameRequired: "Name is required",
  dobRequired: "Date of birth is required",
  languageRequired: "Language is required",
  genderRequired: "Gender is required",
  teacherRequired: "Teacher is required",
  totalClassesRequired: "Total classes is required",
  totalClassesMin: "Must be at least 1",
  classesLeftRequired: "Classes left is required",
  classesLeftMin: "Must be at least 0",
};

const errorsLabels: StudentQuotaLabels["errors"] = { invalidId: "Invalid student ID" };

const audienceLabels: StudentQuotaLabels["audience"] = {
  studentTitle: "My Quota Balance",
  parentTitle: "Children Quota",
  teacherTitle: "Student Quota Overview",
  supervisorTitle: "All Quotas",
  activeQuotas: "Active Quotas",
  remainingCredits: "Remaining Credits",
  onDemandPending: "On-Demand Pending",
  noChildren: "No children found",
  quotaSummary: "Quota Summary",
  classQuotaUsage: "Class Quota Usage",
  onDemandPendingQueue: "On-Demand Queue",
  classAnalytics: "Class Analytics",
  lowBalanceAlerts: "Low Balance Alerts",
  conflictHeld: "Conflict Held",
  analyticsOverview: "Analytics Overview",
  noData: "No data available",
  noQuotaAssigned: "No quota assigned",
  quotaExhausted: "Quota exhausted — no classes remaining",
  eligibleForNextClass: "Eligible for next class",
  notEligibleForNextClass: "Not eligible — no classes remaining",
  expiryWarning: (days: number) => `Expiring in ${days} days`,
  remainingOfTotal: (remaining: number, total: number) => `${remaining} / ${total}`,
  validPeriod: "Valid Period",
  recentLedgerEntries: "Recent Ledger Entries",
  noLedgerEntries: "No ledger entries",
  loadingData: "Loading data…",
  selectChildPrompt: "Please select a child",
  name: "Name",
  kind: "Kind",
  remaining: "Remaining",
  totalClasses: "Total Classes",
  status: "Status",
  validFrom: "Valid From",
  validUntil: "Valid Until",
  delta: "Delta",
  reason: "Reason",
  ledgerDate: "Date",
  createdAt: "Created At",
  newQuota: "New Quota",
  editQuota: "Edit",
  deleteQuota: "Delete",
  statuses: { ACTIVE: "Active", EXPIRED: "Expired", ARCHIVED: "Archived" },
  kinds: { PACKAGE: "Package", PERIODIC: "Periodic" },
  ledgerReasons: {
    ADJUST: "Adjustment",
    EXPIRE: "Expiration",
    GRANT: "Grant",
    REDEEM: "Redemption",
    RELEASE: "Release",
    RESERVE: "Reserve",
  },
};

export function buildQuotaAudienceLabels(pageTitle: string): StudentQuotaLabels {
  return {
    pageTitle,
    common: commonLabels,
    breadcrumbs: breadcrumbsLabels,
    sections: sectionsLabels,
    fields: fieldsLabels,
    actions: actionsLabels,
    info: infoLabels,
    validation: validationLabels,
    errors: errorsLabels,
    audience: audienceLabels,
    quotaCount: (count: number) => (count === 1 ? "1 quota" : `${count} quotas`),
  };
}
