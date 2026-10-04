import type {
  CalculationStatus,
  ClassStatusEventsQuery_classStatusEvents,
  CurrencyCode,
  GroupClassAuditQuery_groupClassAudit as GroupClassAudit,
} from "@/frontend/common/graphql/generated/gql/graphql";

/** Payroll calculation values surfaced on the audit drawer; payroll report rows satisfy the shape structurally. */
export interface ClassAuditPayrollSnapshot {
  readonly calculationStatus: CalculationStatus | null;
  readonly calculatedDuration: number | null;
  readonly teacherPaidAmount: string | null;
  readonly teacherPaidCurrency: CurrencyCode | null;
  readonly isPartialPercentage: number | null;
  readonly payrollNote: string | null;
}

/** Copy shown across the audit detail fields, supplied by the audit ViewModel. */
interface ClassAuditDetailsLabels {
  readonly courseCode: string;
  readonly teacher: string;
  readonly originalDate: string;
  readonly rescheduledDate: string;
  readonly timeSlot: string;
  readonly venue: string;
  readonly auditTrailTitle: string;
  readonly auditTrailEmpty: string;
  readonly statusRescheduled: string;
  readonly classDetails: string;
}

export interface ClassAuditDetailsCardProps {
  readonly audit: NonNullable<GroupClassAudit>;
  readonly labels: ClassAuditDetailsLabels;
  /**
   * Current payroll calculation values for the instance; the payroll card is
   * omitted entirely while no snapshot is available.
   */
  readonly payroll?: ClassAuditPayrollSnapshot | null;
  /** Class status events for the instance; override rows are listed chronologically. */
  readonly statusEvents?: readonly ClassStatusEventsQuery_classStatusEvents[] | null;
  /** Override request raised to the parent, which owns the override dialog instance. */
  readonly onOverride?: () => void;
}

/** Shape consumed by the header/fields/trail sections of the audit details card. */
export type ClassAuditDetailsSectionProps = Pick<ClassAuditDetailsCardProps, "audit" | "labels">;

/** Locale status labels keyed by the generated calculation-status enum. */
export type PayrollStatusLabels = Record<CalculationStatus, string>;
