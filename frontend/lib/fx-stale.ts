export const FX_STALE_MS = 24 * 60 * 60 * 1000;

export function isFxStale(finishedAt: string | null | undefined): boolean {
  if (!finishedAt) {
    return true;
  }
  return Date.now() - new Date(finishedAt).getTime() > FX_STALE_MS;
}

export function shouldShowFxStaleBanner(
  syncRun: {
    readonly finishedAt?: string | null;
    readonly startedAt?: string | null;
    readonly status?: string | null;
  } | null
): boolean {
  if (!syncRun) {
    return true;
  }

  const status = (syncRun.status ?? "").toLowerCase();
  if (status === "failed" || status === "partial") {
    return true;
  }

  return isFxStale(syncRun.finishedAt ?? syncRun.startedAt);
}
