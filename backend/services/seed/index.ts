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

export * from "./leave-request-seed.service";
export * from "./notification-device-seed.service";
export * from "./persona-seed.service";
export * from "./student-seed.service";
export * from "./teacher-availability-seed.service";
export * from "./teacher-payment-seed.service";
export * from "./user-seed.service";
