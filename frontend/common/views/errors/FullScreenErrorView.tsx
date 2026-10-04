"use client";

import CloudOffOutlined from "@mui/icons-material/CloudOffOutlined";
import ErrorOutlineOutlined from "@mui/icons-material/ErrorOutlineOutlined";
import RefreshOutlined from "@mui/icons-material/RefreshOutlined";
import { Box, Button, CircularProgress, Fade, Stack, Typography, useMediaQuery } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useEffect } from "react";
import { logger } from "@/frontend/common/utils/logger";
import { useFullScreenErrorRecovery } from "@/frontend/common/views/errors/useFullScreenErrorRecovery.hooks";
import { Translation, useAppTranslation } from "@/shared/locale";

export interface FullScreenErrorViewProps {
  readonly error: Error & { digest?: string };
  readonly onRetry: () => void;
  /**
   * Fast-path classification from the error digest sentinel — skips the
   * initial reachability probe when the server already identified the failure
   * as a database outage. The probe remains authoritative otherwise.
   */
  readonly databaseUnavailableHint?: boolean;
}

/**
 * Chrome-free, full-viewport error surface used by the root `app/error.tsx`
 * boundary. Renders inside the root layout, so theme (dark/light), direction
 * (RTL/LTR), and translations come from the existing providers — while staying
 * outside the dashboard shell, so no header/sidebar/footer appear around it.
 *
 * The database-unavailable variant is selected by a reachability probe (the
 * authoritative signal — driver wrapping makes error identity unreliable
 * across layers), with the digest sentinel as a zero-latency fast path.
 * Copy is deliberately confidential: no error details ever reach the UI.
 */
export function FullScreenErrorView({ error, onRetry, databaseUnavailableHint }: Readonly<FullScreenErrorViewProps>) {
  const t = useAppTranslation(Translation.Errors);
  const labels = t.serviceOutage;
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)", { noSsr: true });

  useEffect(() => {
    logger.error("Root error boundary:", error);
  }, [error]);

  const { isDatabase, pending, handleRetry } = useFullScreenErrorRecovery({ databaseUnavailableHint, onRetry });

  const title = isDatabase ? labels.title : labels.genericTitle;
  const description = isDatabase ? labels.description : labels.genericDescription;
  const Icon = isDatabase ? CloudOffOutlined : ErrorOutlineOutlined;

  return (
    <Fade in timeout={prefersReducedMotion ? 0 : 400}>
      <main>
        <Box
          sx={theme => ({
            minHeight: "100dvh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            px: 3,
            py: 6,
            backgroundColor: theme.palette.background.default,
          })}
        >
          <Stack sx={{ alignItems: "center", textAlign: "center", gap: 2.5, maxWidth: 440 }}>
            <Box
              sx={theme => ({
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 88,
                height: 88,
                borderRadius: "50%",
                backgroundColor: alpha(theme.palette.error.main, 0.12),
                color: theme.palette.error.main,
              })}
            >
              <Icon sx={{ fontSize: 44 }} />
            </Box>
            <Typography variant="headlineLg">{title}</Typography>
            <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
              {description}
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={handleRetry}
              disabled={pending}
              startIcon={pending ? <CircularProgress size={16} color="inherit" /> : <RefreshOutlined />}
            >
              {pending ? labels.retrying : labels.retry}
            </Button>
            {isDatabase ? (
              <Typography variant="bodyMd" component="output" sx={theme => ({ color: theme.palette.text.secondary })}>
                {labels.autoRetryHint}
              </Typography>
            ) : null}
          </Stack>
        </Box>
      </main>
    </Fade>
  );
}
