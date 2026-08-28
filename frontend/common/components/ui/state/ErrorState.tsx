import { Alert, Box, Button, type SxProps, type Theme } from "@mui/material";
import type { ComponentType, ReactNode } from "react";
import { Translation, useAppTranslation } from "@/shared/locale";

type ErrorStateContainerComponent = ComponentType<{
  readonly children: ReactNode;
  readonly sx?: SxProps<Theme>;
}>;

type ErrorStateProps = {
  readonly message?: string;
  readonly onRetry?: () => void;
  readonly retryLabel?: string;
  readonly embedded?: boolean;
  readonly ContainerComponent?: ErrorStateContainerComponent;
};

export function ErrorState({
  message,
  onRetry,
  retryLabel,
  embedded = false,
  ContainerComponent = Box,
}: ErrorStateProps) {
  const tDefault = useAppTranslation(Translation.Common);
  const displayMessage = message ?? tDefault.loadFailed ?? "";
  const displayRetryLabel = retryLabel ?? tDefault.retry;

  const alert = (
    <Alert
      severity="error"
      action={
        onRetry ? (
          <Button color="inherit" size="small" onClick={onRetry}>
            {displayRetryLabel}
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

  return <ContainerComponent sx={{ p: 3, display: "flex", justifyContent: "center" }}>{alert}</ContainerComponent>;
}
