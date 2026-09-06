const SYNC_STATUS_LABEL_KEYS: Readonly<Record<string, string>> = {
  NOT_STARTED: "syncStatusNotStarted",
  REQUESTED: "syncStatusRequested",
  SYNCING: "syncStatusSyncing",
  COMPLETE: "syncStatusComplete",
  FAILED: "syncStatusFailed",
} as const;

/**
 * Maps a `WhatsappSyncStatus` value (or null/unknown) to its whatsapp locale
 * label key. Unknown values fall back to `syncStatusNotStarted` (the neutral
 * "not synced" state), matching the tier/quality fallback convention.
 */
export function getSyncStatusLabelKey(syncStatus: string | null): string {
  return SYNC_STATUS_LABEL_KEYS[syncStatus ?? ""] ?? "syncStatusNotStarted";
}
