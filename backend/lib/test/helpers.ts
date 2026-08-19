/**
 * Shared test helpers for transient error simulation across cold-start tests.
 *
 * Usage:
 *   import { makeTransientError } from "@/backend/lib/test/helpers";
 *
 * All cold-start test files should import from here rather than defining
 * their own local copy of `makeTransientError`.
 */

/**
 * Constructs a transient error with the given error code and message.
 *
 * @param code - The error code (e.g. "ECONNRESET", "ETIMEDOUT"). Defaults to "ECONNRESET".
 * @param message - Optional custom error message. Defaults to `"Transient error (<code>)"`.
 */
export function makeTransientError(code: string = "ECONNRESET", message?: string): Error {
  const err = new Error(message ?? `Transient error (${code})`);
  Object.defineProperty(err, "code", { value: code, enumerable: true });
  return err;
}
