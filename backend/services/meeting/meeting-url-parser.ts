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
  const match = url.match(pattern);
  return match?.[1] ?? null;
}
