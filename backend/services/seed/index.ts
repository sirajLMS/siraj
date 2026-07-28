/**
 * Seed and test-harness data provisioning services.
 *
 * These modules are **not** production domain services. They exist only for:
 * - `bun db seed` (local demo database population)
 * - GraphQL test helpers (`ensureDemoUsers`, etc.)
 *
 * All write paths call {@link assertSeedWriteAllowed} from `backend/lib/bootstrap-gate.ts`,
 * which blocks real production (`VERCEL_ENV=production`) while allowing local dev and
 * CI test servers (`TEST_SERVER=1`, `TEST_CI=true`).
 */

export { LeaveRequestSeedService } from "@/backend/services/seed/leave-request-seed.service";
export { NotificationDeviceSeedService } from "@/backend/services/seed/notification-device-seed.service";
export {
  PersonaSeedService,
  type SeedParentProfileInput,
  type SeedTeacherProfileInput,
} from "@/backend/services/seed/persona-seed.service";
export { type SeedStudentInput, StudentSeedService } from "@/backend/services/seed/student-seed.service";
export { TeacherAvailabilitySeedService } from "@/backend/services/seed/teacher-availability-seed.service";
export { TeacherPaymentSeedService } from "@/backend/services/seed/teacher-payment-seed.service";
export { type SeedDemoUserInput, UserSeedService } from "@/backend/services/seed/user-seed.service";
