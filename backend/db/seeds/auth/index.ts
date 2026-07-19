// Backend seeder barrel — re-exports every `seedOrGet` in this sub-directory.
// Master controller (`backend/db/seeds/index.ts`) imports these aliases.
//
// System permissions / groups / group_permissions are NOT seeded here — they
// live in backend/db/migration/ and are applied via drizzle migrations.

export { seedOrGet as seedOrGetUserPermissionOverrides } from "./seed-user-permission-overrides";
