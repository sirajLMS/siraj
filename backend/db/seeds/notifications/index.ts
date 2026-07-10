// Backend seeder barrel — re-exports every `seedOrGet` in this sub-directory.
// Master controller (`backend/db/seeds/index.ts`) imports these aliases.

export { seedOrGet as seedOrGetNotificationDeliveries } from "./seed-notification-deliveries";
export { seedOrGet as seedOrGetUserNotificationPreferences } from "./seed-user-notification-preferences";
