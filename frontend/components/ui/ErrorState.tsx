import { Alert, Button } from "@mui/material";
import type { useTranslations } from "next-intl";
import { PageContainer } from "./PageContainer";

type ErrorStateProps = {
  readonly t?: ReturnType<typeof useTranslations>;
  readonly message?: string;
  readonly onRetry?: () => void;
  readonly retryLabel?: string;
  readonly embedded?: boolean;
};

export function ErrorState({ t, message, onRetry, retryLabel, embedded = false }: ErrorStateProps) {
  const displayMessage = message ?? t?.("loadError") ?? "";

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

  return <PageContainer>{alert}</PageContainer>;
}
