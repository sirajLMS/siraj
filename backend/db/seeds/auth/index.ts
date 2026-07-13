// Backend seeder barrel — re-exports every `seedOrGet` in this sub-directory.
// Master controller (`backend/db/seeds/index.ts`) imports these aliases.

export { seedOrGet as seedOrGetLmsPermissions } from "./seed-lms-permissions";
export { seedOrGet as seedOrGetPaymentMethodPermissions } from "./seed-payment-method-permissions";
export { seedOrGet as seedOrGetProfileFieldPermissions } from "./seed-profile-field-permissions";
export { seedOrGet as seedOrGetUserPermissionOverrides } from "./seed-user-permission-overrides";
