"use client";

import { useCallback, useEffect, useState } from "react";

const DB_HEALTH_ENDPOINT = "/api/health/db";

/**
 * Auto-retry polling backoff while the database is unreachable: probe the
 * health endpoint on this schedule and re-render the page as soon as it
 * answers 200. The last value repeats for all later attempts.
 */
const AUTO_RETRY_DELAYS_MS = [5_000, 10_000, 20_000, 30_000] as const;

/**
 * Fast-path classification from the error digest sentinel — skips the
 * initial reachability probe when the server already identified the failure
 * as a database outage. The probe remains authoritative otherwise.
 */
export interface UseFullScreenErrorRecoveryProps {
  readonly databaseUnavailableHint?: boolean;
  readonly onRetry: () => void;
}

export interface FullScreenErrorRecovery {
  readonly isDatabase: boolean;
  readonly pending: boolean;
  readonly handleRetry: () => void;
}

/**
 * Drives database-outage classification and auto-retry for the root error
 * boundary: a one-shot reachability probe classifies the failure, and while
 * the database stays unreachable the health endpoint is polled on a backoff
 * schedule until it answers 200, at which point `onRetry` re-renders the page.
 */
export function useFullScreenErrorRecovery({
  databaseUnavailableHint,
  onRetry,
}: Readonly<UseFullScreenErrorRecoveryProps>): FullScreenErrorRecovery {
  const [isDatabase, setIsDatabase] = useState(databaseUnavailableHint === true);
  const [pending, setPending] = useState(false);

  // One-shot reachability probe: a failed probe means the database is down
  // regardless of what the original error object claims.
  useEffect(() => {
    if (isDatabase) return undefined;
    let cancelled = false;

    const classify = async () => {
      try {
        const response = await fetch(DB_HEALTH_ENDPOINT, { cache: "no-store" });
        if (!cancelled && !response.ok) setIsDatabase(true);
      } catch {
        if (!cancelled) setIsDatabase(true);
      }
    };

    void classify();
    return () => {
      cancelled = true;
    };
  }, [isDatabase]);

  // Auto-retry loop while the database is unreachable.
  useEffect(() => {
    if (!isDatabase) return undefined;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const scheduleProbe = (attempt: number) => {
      const delay = AUTO_RETRY_DELAYS_MS[Math.min(attempt, AUTO_RETRY_DELAYS_MS.length - 1)] ?? 30_000;
      timer = setTimeout(() => {
        void probe(attempt);
      }, delay);
    };

    const probe = async (attempt: number) => {
      try {
        const response = await fetch(DB_HEALTH_ENDPOINT, { cache: "no-store" });
        if (response.ok) {
          if (!cancelled) onRetry();
          return;
        }
      } catch {
        // Database still unreachable — keep polling on the backoff schedule.
      }
      if (!cancelled) scheduleProbe(attempt + 1);
    };

    scheduleProbe(0);
    return () => {
      cancelled = true;
      if (timer !== undefined) clearTimeout(timer);
    };
  }, [isDatabase, onRetry]);

  const handleRetry = useCallback(() => {
    setPending(true);
    onRetry();
  }, [onRetry]);

  return { isDatabase, pending, handleRetry };
}
