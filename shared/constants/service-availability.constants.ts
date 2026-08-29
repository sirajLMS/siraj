/**
 * Cross-layer constants for service availability signaling.
 *
 * The digest sentinel is assigned to `DatabaseUnavailableError.digest` on the
 * server and is the only property that survives Next.js production error
 * serialization into client error boundaries (`app/error.tsx`). Client code
 * uses it to pick "database temporarily unavailable" messaging instead of the
 * generic error copy — without ever exposing the underlying error details.
 */
export const DATABASE_UNAVAILABLE_DIGEST = "DATABASE_UNAVAILABLE";
