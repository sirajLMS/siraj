// Backend seeder barrel — re-exports every `seedOrGet` in this sub-directory.
// Master controller (`backend/db/seeds/index.ts`) imports these aliases.

export { seedOrGet as seedOrGetStudentProgress } from "./seed-student-progress";
export { seedOrGet as seedOrGetStudentStatusHistory } from "./seed-student-status-history";
export { seedOrGet as seedOrGetStudents } from "./seed-students";
