/**
 * Utility functions for error handling
 */

/**
 * Checks if an error is an abort error (e.g., from a cancelled request)
 *
 * This is useful for preventing error notifications when requests are
 * aborted due to navigation or component unmounting.
 *
 * @param error - The error to check
 * @returns True if the error is an abort error
 *
 * @example
 * ```ts
 * try {
 *   await someQuery();
 * } catch (error) {
 *   if (!isAbortError(error)) {
 *     notifications.show("An error occurred");
 *   }
 * }
 * ```
 */
export function isAbortError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.message.includes("aborted") || error.message.includes("AbortError") || error.name === "AbortError")
  );
}

/**
 * Checks if an error is a network error
 *
 * @param error - The error to check
 * @returns True if the error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.message.includes("fetch") ||
      error.message.includes("NetworkError") ||
      error.message.includes("Failed to fetch") ||
      error.message.includes("Network request failed") ||
      error.message.includes("ERR_CONNECTION_REFUSED"))
  );
}
