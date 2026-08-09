/**
 * Canonical meeting config utilities — pure functions shared across frontend and backend.
 *
 * Export groups:
 * - `validate*` / allowlist helpers
 * - `parse*` / meeting ID extraction
 */

// ============================================================================
// URL allowlist — host must match one of the provider patterns
// ============================================================================

export function isUrlAllowedByProvider(url: string, allowlist: readonly string[]): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return allowlist.some(pattern => {
      const normalized = pattern.toLowerCase().replace(/^\*\./, "");
      return hostname === normalized || hostname.endsWith(`.${normalized}`);
    });
  } catch {
    return false;
  }
}

// ============================================================================
// Meeting ID extraction — parse provider-specific join URLs
// ============================================================================

const MEETING_ID_PATTERNS: Record<string, RegExp> = {
  zoom: /\/j\/(\d+)/,
  google_meet: /meet\.google\.com\/([a-z]{3}-[a-z]{4}-[a-z]{3})/i,
  microsoft_teams: /\/meetup-join\/([^/?]+)/i,
};

export function extractMeetingId(providerSlug: string, url: string): string | null {
  const pattern = MEETING_ID_PATTERNS[providerSlug];
  if (!pattern) {
    return null;
  }
  const match = pattern.exec(url);
  return match?.[1] ?? null;
}
