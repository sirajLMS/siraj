const META_STATUS_LABEL_KEYS: Readonly<Record<string, string>> = {
  CONNECTED: "metaStatusConnected",
  DISCONNECTED: "metaStatusDisconnected",
} as const;

/**
 * Maps an account's `metaStatus` value (or null/unknown) to its whatsapp locale
 * label key. Unknown values fall back to `metaStatusUnknown` (the neutral
 * "unknown" state), matching the sync-status/tier/quality fallback convention.
 */
export function getMetaStatusLabelKey(metaStatus: string | null): string {
  return META_STATUS_LABEL_KEYS[metaStatus ?? ""] ?? "metaStatusUnknown";
}
