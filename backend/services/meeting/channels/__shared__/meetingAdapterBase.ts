import { MeetingProviderTokenRepository } from "@/backend/db/repo/meeting/meeting-provider-token.repository";
import type { CachedToken } from "@/backend/types";

export type { CachedToken };

import { logger } from "@/backend/lib/logger";
import type {GenerateMeetingInput, GenerateMeetingResult, IMeetingChannel, MeetingProvider } from "@/backend/types";
import { NoOrgCredentialsNoUserTokenError, ProviderUnavailableError } from "@/backend/services/meeting/channels/IMeetingChannel";;;;
import { refreshAccessToken } from "@/backend/services/meeting/integrations/token-refresh";

// ============================================================================
// Shared constants
// ============================================================================

export const REQUEST_TIMEOUT_MS = 30_000;
export const RETRY_JITTER_BASE_MS = 200;
export const MAX_GENERATE_RETRIES = 2;

// ============================================================================
// Shared types (internal to the base class — not exported for consumers)
// ============================================================================

// ============================================================================
// Shared utility functions
// ============================================================================

export function withTimeout(ms: number): { signal: AbortSignal; cancel: () => void } {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, cancel: () => clearTimeout(timer) };
}

export function jitterDelay(baseMs: number): number {
  return baseMs + (Date.now() % 100);
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isTokenExpired(token: CachedToken | null, refreshMarginMs: number): boolean {
  if (!token) return true;
  return Date.now() >= token.expiresAt - refreshMarginMs;
}

/**
 * Shared fetch-with-timeout helper.  Wraps `globalThis.fetch` with an
 * `AbortController`-based timeout and maps network errors to
 * `ProviderUnavailableError`.  Returns the raw `Response` so the caller
 * can inspect status/body — rate-limit (429) and non-OK handling is
 * left to the caller (provider-specific error formats differ).
 */
export async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  providerSlug: MeetingProvider,
  timeoutMs = REQUEST_TIMEOUT_MS
): Promise<Response> {
  const { signal, cancel } = withTimeout(timeoutMs);
  try {
    return await fetch(url, { ...init, signal });
  } catch (error) {
    throw new ProviderUnavailableError(providerSlug, undefined, error instanceof Error ? error.message : String(error));
  } finally {
    cancel();
  }
}

// ============================================================================
// Abstract base class
// ============================================================================

/**
 * Shared base class for meeting provider adapters. Eliminates ~80% of
 * duplicated logic across Google Meet, Microsoft Teams, and Zoom adapters:
 * - Per-user OAuth token fallback flow
 * - Cached token expiry tracking
 * - Retry-with-jitter on transient failures
 * - disconnect() token-state clearing
 *
 * Subclasses must implement:
 * - `readonly providerSlug` — the MeetingProvider identifier
 * - `readonly tokenRefreshMarginMs` — provider-specific refresh margin
 * - `resolveAccessToken(input)` — org-credential or per-user token acquisition
 * - `callProviderApi(accessToken, input)` — provider-specific API call
 * - `transformResponse(response, status)` — map raw response to GenerateMeetingResult
 * - `validateConfig()` — check provider-specific credentials
 * - `disconnect(token?)` — optionally override for token revocation
 */
export abstract class MeetingAdapterBase implements IMeetingChannel {
  protected abstract readonly providerSlug: MeetingProvider;
  protected abstract readonly tokenRefreshMarginMs: number;

  protected cachedToken: CachedToken | null = null;

  async generateMeeting(input: GenerateMeetingInput): Promise<GenerateMeetingResult> {
    const accessToken = await this.resolveAccessToken(input);
    return this.generateWithRetry(accessToken, input, 0);
  }

  /**
   * Main retry loop shared by all adapters. Retries on
   * ProviderUnavailableError up to MAX_GENERATE_RETRIES times
   * with jittered back-off.
   */
  private async generateWithRetry(
    accessToken: string,
    input: GenerateMeetingInput,
    attempt: number
  ): Promise<GenerateMeetingResult> {
    if (attempt > 0) {
      await new Promise(resolve => setTimeout(resolve, jitterDelay(RETRY_JITTER_BASE_MS)));
    }
    try {
      return await this.callProviderApi(accessToken, input);
    } catch (error) {
      if (error instanceof ProviderUnavailableError && attempt + 1 < MAX_GENERATE_RETRIES) {
        return this.generateWithRetry(accessToken, input, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * Per-user OAuth fallback: exchange the stored refresh token for an
   * access token. Returns the stored access token if still valid (within
   * the refresh margin) to avoid racing concurrent calls on the single-use
   * refresh token.
   *
   * This method is shared verbatim across all three adapters.
   */
  protected async getPerUserAccessToken(actorUserId: string): Promise<string> {
    const tokenRow = await MeetingProviderTokenRepository.getByUserAndProvider(actorUserId, this.providerSlug);
    if (!tokenRow?.refreshToken) {
      throw new NoOrgCredentialsNoUserTokenError(this.providerSlug);
    }

    logger.debug(`${this.constructor.name}: using per-user token fallback`, { actorUserId });

    const storedExpiry = tokenRow.expiresAt ? tokenRow.expiresAt.getTime() : 0;
    if (tokenRow.accessToken && Date.now() < storedExpiry - this.tokenRefreshMarginMs) {
      return tokenRow.accessToken;
    }

    const refreshed = await refreshAccessToken(this.providerSlug, tokenRow.refreshToken, actorUserId);

    await MeetingProviderTokenRepository.upsert({
      userId: actorUserId,
      providerSlug: this.providerSlug,
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken ?? tokenRow.refreshToken,
      expiresAt: refreshed.expiresAt,
      scopes: tokenRow.scopes,
    });

    return refreshed.accessToken;
  }

  /**
   * Clears cached token state. Called by disconnect() implementations.
   */
  protected clearCachedToken(): void {
    this.cachedToken = null;
  }

  // ------------------------------------------------------------------------
  // Abstract methods — subclasses must implement these
  // ------------------------------------------------------------------------

  abstract validateConfig(): Promise<boolean>;

  /** Resolve the access token (org-level or per-user fallback). */
  protected abstract resolveAccessToken(input: GenerateMeetingInput): Promise<string>;

  /** Call the provider's meeting-creation API and return the raw response. */
  protected abstract callProviderApi(accessToken: string, input: GenerateMeetingInput): Promise<GenerateMeetingResult>;

  abstract disconnect(token?: { accessToken: string; refreshToken: string | null }): Promise<void>;
}
