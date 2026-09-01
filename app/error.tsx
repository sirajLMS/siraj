"use client";

import { FullScreenErrorView } from "@/frontend/common/views/errors";
import { DATABASE_UNAVAILABLE_DIGEST } from "@/shared/constants";

/**
 * Root error boundary for every route group (auth, dashboard, …). Runs inside
 * the root layout, so theme/locale providers stay alive, but outside the
 * dashboard chrome — no header/sidebar/footer around the error surface.
 *
 * The database-unavailable variant is selected by a reachability probe, with
 * the `error.digest` sentinel (the only error property that survives
 * production serialization) as a zero-latency fast path.
 * `retry()` (Next.js 16) re-fetches and re-renders the failing segment at the
 * same URL, so a successful retry lands the user back on the page they
 * originally requested.
 */
interface RootErrorProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
  readonly retry: () => void;
}

export default function RootError({ error, retry }: Readonly<RootErrorProps>) {
  return (
    <FullScreenErrorView
      error={error}
      onRetry={retry}
      databaseUnavailableHint={error.digest === DATABASE_UNAVAILABLE_DIGEST}
    />
  );
}
