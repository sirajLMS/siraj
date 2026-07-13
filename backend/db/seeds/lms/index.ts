// LMS seeder barrel — re-exports every `seedOrGet` in this sub-directory.
// Master controller (`backend/db/seeds/index.ts`) imports these aliases.

export { seedOrGet as seedOrGetCreditTransactions } from "./seed-credit-transactions";
export { seedOrGet as seedOrGetLessonReports } from "./seed-lesson-reports";
export { seedOrGet as seedOrGetTeacherDues } from "./seed-teacher-dues";
