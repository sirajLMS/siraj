"use client";

import { Alert, Button } from "@mui/material";
import { DesktopPageContainer } from "@/frontend/desktop/components/ui/container/page";
import { useAppTranslation } from "@/shared/locale";

export interface DesktopErrorStateProps {
  readonly message?: string;
  readonly onRetry?: () => void;
  readonly retryLabel?: string;
  readonly embedded?: boolean;
}

/**
 * Desktop error state. When `embedded` is true, renders the Alert inline;
 * otherwise wraps it in `DesktopPageContainer` (which renders the
 * fixed-position LinearProgress while the theme/language is changing).
 */
export function DesktopErrorState({ message, onRetry, retryLabel, embedded = false }: DesktopErrorStateProps) {
  const tDefault = useAppTranslation().commonTranslations;
  const displayMessage = message ?? tDefault.loadFailed ?? "";

  const alert = (
    <Alert
      severity="error"
      action={
        onRetry ? (
          <Button color="inherit" size="small" onClick={onRetry}>
            {retryLabel}
          </Button>
        ) : undefined
      }
    >
      {displayMessage}
    </Alert>
  );

  if (embedded) {
    return alert;
  }

  return <DesktopPageContainer>{alert}</DesktopPageContainer>;
}
