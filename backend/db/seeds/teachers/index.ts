// Backend seeder barrel — re-exports every `seedOrGet` in this sub-directory.
// Master controller (`backend/db/seeds/index.ts`) imports these aliases.

export { seedOrGet as seedOrGetLeaveQuotaUsage } from "./seed-leave-quota-usage";
export { seedOrGet as seedOrGetLeaveRequests } from "./seed-leave-requests";
export { seedOrGet as seedOrGetTeacherAvailabilityWindows } from "./seed-teacher-availability-windows";
export { seedOrGet as seedOrGetTeacherBankingDetails } from "./seed-teacher-banking-details-history";
export { seedOrGet as seedOrGetTeacherPayments } from "./seed-teacher-payments";
export { seedOrGet as seedOrGetTeacherRecurringUnavailability } from "./seed-teacher-recurring-unavailability";
export { seedOrGet as seedOrGetTeacherVacationRequests } from "./seed-teacher-vacation-requests";
export { seedOrGet as seedOrGetTeachers } from "./seed-teachers";
