// DRIFT-NOTE: AttendanceStatus is defined here AND in
// `@/shared/constants/attendance-status.enum.ts`, but the two have DIVERGENT
// string values (backend = lowercase "present"/"absent"/"late";
// shared = uppercase "PRESENT"/"ABSENT"/"LATE"). Shimming would change DB wire
// values and break stored rows. Reconcile the canonical wire format before
// consolidating; intentionally NOT shimmed.
export enum AttendanceStatus {
  PRESENT = "present",
  ABSENT = "absent",
  LATE = "late",
}
