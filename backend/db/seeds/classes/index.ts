// Backend seeder barrel — re-exports every `seedOrGet` in this sub-directory.
// Master controller (`backend/db/seeds/index.ts`) imports these aliases.

export { seedOrGet as seedOrGetClassCommunications } from "./seed-class-communications";
export { seedOrGet as seedOrGetClassInstances } from "./seed-class-instances";
export { seedOrGet as seedOrGetClassPerformance } from "./seed-class-performance";
export { seedOrGet as seedOrGetClassStatusEvents } from "./seed-class-status-events";
export { seedOrGet as seedOrGetClasses } from "./seed-classes";
export { seedOrGet as seedOrGetDstMigrationEntries } from "./seed-dst-migration-entries";
export { seedOrGet as seedOrGetDstMigrationRuns } from "./seed-dst-migration-runs";
export { seedOrGet as seedOrGetGroupClassEnrollments } from "./seed-group-class-enrollments";
export { seedOrGet as seedOrGetGroupClasses } from "./seed-group-classes";
export { seedOrGet as seedOrGetRecurringScheduleDays } from "./seed-recurring-schedule-days";
