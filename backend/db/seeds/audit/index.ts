// Backend seeder barrel — re-exports every `seedOrGet` in this sub-directory.
// Master controller (`backend/db/seeds/index.ts`) imports these aliases.

export { seedOrGet as seedOrGetAdminAuditLogs } from "./seed-admin-audit-logs";
export { seedOrGet as seedOrGetAuditLogs } from "./seed-audit-logs";
