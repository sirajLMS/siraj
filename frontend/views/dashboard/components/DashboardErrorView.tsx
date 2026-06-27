"use client";

import { ErrorOutlined as ErrorIcon } from "@mui/icons-material";
import { Box, Button, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { useRouter } from "@/shared/i18n/routing";

interface DashboardErrorViewProps {
  readonly errorMessage: string | null;
}

export function DashboardErrorView({ errorMessage }: DashboardErrorViewProps) {
  const router = useRouter();
  const t = useTranslations("dashboard.admin");

  const errorTitle = errorMessage ? t("loadingFailedTitle") : t("unauthenticatedTitle");
  const errorDesc = errorMessage || t("unauthenticatedDesc");
  const showRetry = !!errorMessage;

  const handleRetry = () => {
    globalThis.location.reload();
  };

  const handleLoginRedirect = () => {
    router.push("/login");
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        gap: 2,
        p: 3,
        textAlign: "center",
      }}
    >
      <ErrorIcon color="error" sx={{ fontSize: 48 }} />
      <Typography variant="h6" color="text.primary">
        {errorTitle}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, mb: 1 }}>
        {errorDesc}
      </Typography>
      {showRetry ? (
        <Button variant="contained" onClick={handleRetry}>
          {t("retryBtn")}
        </Button>
      ) : (
        <Button variant="contained" onClick={handleLoginRedirect}>
          {t("loginBtn")}
        </Button>
      )}
    </Box>
  );
}
