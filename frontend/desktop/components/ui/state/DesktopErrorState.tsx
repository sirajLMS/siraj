"use client";

import { ErrorState } from "@/frontend/common/components/ui/state/ErrorState";
import { DesktopPageContainer } from "@/frontend/desktop/components/ui/container/page";

export interface DesktopErrorStateProps {
  readonly message?: string;
  readonly onRetry?: () => void;
  readonly retryLabel?: string;
  readonly embedded?: boolean;
}

/**
 * Desktop error state. Delegates to the shared {@link ErrorState} with
 * `DesktopPageContainer` as the non-embedded wrapper (which renders the
 * fixed-position LinearProgress while the theme/language is changing).
 */
export function DesktopErrorState({ message, onRetry, retryLabel, embedded = false }: DesktopErrorStateProps) {
  return (
    <ErrorState
      message={message}
      onRetry={onRetry}
      retryLabel={retryLabel}
      embedded={embedded}
      ContainerComponent={DesktopPageContainer}
    />
  );
}
