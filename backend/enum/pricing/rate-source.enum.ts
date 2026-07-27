/**
 * Source of the hourly rate used to compute a teacher due for a class instance.
 *
 * Precedence (highest wins):
 *  1. {@link RateSource.OVERRIDE}  — admin manually overrode the rate on a single
 *     `class_instances` row (`is_rate_overridden = true`).
 *  2. {@link RateSource.RECURRING} — rate defined on the parent `recurring_schedules`
 *     row (a specific student+teacher+subject combination).
 *  3. {@link RateSource.SUBJECT}   — rate defined on the `class_subjects` row
 *     (global per subject, any teacher).
 *  4. {@link RateSource.TEACHER}   — fallback: the `teachers.hourly_rate` column.
 *
 * The cascade is implemented in `backend/services/pricing/rate-resolver.service.ts`.
 * When a higher tier sets an amount but omits the currency, the currency is
 * inherited from the next tier down that defines one (defaulting to `SAR`).
 */
export enum RateSource {
  OVERRIDE = "OVERRIDE",
  RECURRING = "RECURRING",
  SUBJECT = "SUBJECT",
  TEACHER = "TEACHER",
}
