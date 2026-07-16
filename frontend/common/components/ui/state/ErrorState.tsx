import { Alert, Button } from "@mui/material";
import { PageContainer } from "@/frontend/common/components/ui/container/page/PageContainer";
import { useAppTranslation } from "@/shared/locale/client";

type ErrorStateProps = {
  readonly message?: string;
  readonly onRetry?: () => void;
  readonly retryLabel?: string;
  readonly embedded?: boolean;
};

export function ErrorState({ message, onRetry, retryLabel, embedded = false }: ErrorStateProps) {
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

  return <PageContainer>{alert}</PageContainer>;
}
