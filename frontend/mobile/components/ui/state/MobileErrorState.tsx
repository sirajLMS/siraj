"use client";

import { Alert, Box, Button } from "@mui/material";
import { MobilePageContainer } from "@/frontend/mobile/components/ui/container/page";
import { useAppTranslation } from "@/shared/locale";

export interface MobileErrorStateProps {
  readonly message?: string;
  readonly onRetry?: () => void;
  readonly retryLabel?: string;
  readonly embedded?: boolean;
}

/**
 * Mobile error state. When `embedded` is true, renders the Alert inline;
 * otherwise wraps it in a full-width `MobilePageContainer` (which has no
 * LinearProgress overlay — mobile has no fixed 64px navbar). Tighter Alert
 * padding tuned for mobile screen widths.
 */
export function MobileErrorState({ message, onRetry, retryLabel, embedded = false }: MobileErrorStateProps) {
  const tDefault = useAppTranslation().commonTranslations;
  const displayMessage = message ?? tDefault.loadFailed ?? "";

  const alert = (
    <Alert
      severity="error"
      sx={{
        py: 1.5,
        "& .MuiAlert-icon": { py: 1 },
        "& .MuiAlert-action": { padding: 0 },
      }}
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

  return (
    <MobilePageContainer>
      <Box sx={{ width: "100%" }}>{alert}</Box>
    </MobilePageContainer>
  );
}
