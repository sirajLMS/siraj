import { RateLimitRepository } from "@/backend/db/repo/shared";

/**
 * RateLimitService — thin service wrapper for auth rate-limiting.
 *
 * Resolvers should call these methods instead of accessing
 * {@link RateLimitRepository} directly. This keeps the service layer as the
 * single entry point and allows future changes (e.g. IP allow-listing,
 * adaptive thresholds) without touching every call site.
 */
export namespace RateLimitService {
  export async function isLocked(ipAddress: string, email: string): Promise<boolean> {
    return RateLimitRepository.isLocked(ipAddress, email);
  }

  export async function recordAttempt(
    ipAddress: string,
    email: string,
    maxAttempts = 5,
    lockoutMinutes = 15
  ): Promise<{ attempts: number; lockedUntil: Date | null; isLocked: boolean }> {
    return RateLimitRepository.recordAttempt(ipAddress, email, maxAttempts, lockoutMinutes);
  }

  export async function resetAttempts(ipAddress: string, email: string): Promise<void> {
    return RateLimitRepository.resetAttempts(ipAddress, email);
  }
}
