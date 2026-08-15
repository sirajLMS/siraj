"use client";

import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import { Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import { useState } from "react";
import type { ReauthProvider } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/reauth-needed-banner.types";
import type { MeetingConfigEnhancementLabels } from "@/shared/locale/types/ui";

export type ReconnectAllActionLabels = Pick<
  MeetingConfigEnhancementLabels,
  | "reconnectAllWithCount"
  | "reconnectingProgress"
  | "reconnectedProviders"
  | "reconnectFailedProviders"
  | "reconnectAllAriaLabel"
>;

export interface ReconnectAllActionProps {
  readonly providers: readonly ReauthProvider[];
  readonly labels: ReconnectAllActionLabels;
  readonly onReconnectProvider: (providerSlug: string) => Promise<boolean>;
  readonly onComplete: (reconnectedCount: number, failedCount: number) => void;
}

export function ReconnectAllAction({ providers, labels, onReconnectProvider, onComplete }: ReconnectAllActionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inProgress, setInProgress] = useState(false);

  if (providers.length < 2) {
    return null;
  }

  const processProvider = async (index: number, successCount: number, failureCount: number): Promise<void> => {
    if (index >= providers.length) {
      setInProgress(false);
      onComplete(successCount, failureCount);
      return;
    }
    setCurrentIndex(index);
    const provider = providers[index];
    if (!provider) {
      return processProvider(index + 1, successCount, failureCount);
    }
    const succeeded = await onReconnectProvider(provider.slug);
    return processProvider(
      index + 1,
      succeeded ? successCount + 1 : successCount,
      succeeded ? failureCount : failureCount + 1
    );
  };

  const handleReconnectAll = () => {
    if (inProgress) return;
    setInProgress(true);
    void processProvider(0, 0, 0);
  };

  if (inProgress) {
    const total = providers.length;
    const current = Math.min(currentIndex + 1, total);

    return (
      <Box
        sx={theme => ({
          p: 2,
          borderRadius: 1,
          backgroundColor: theme.palette.primaryContainer,
          color: theme.palette.onPrimaryContainer,
        })}
        aria-live="polite"
        aria-busy="true"
      >
        <Stack sx={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
          <CircularProgress size={24} sx={theme => ({ color: theme.palette.primary.main })} />
          <Typography sx={{ typography: "bodyMd" }}>{labels.reconnectingProgress(current, total)}</Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Button
      variant="contained"
      color="primary"
      disabled={inProgress}
      startIcon={<RefreshOutlinedIcon />}
      aria-label={labels.reconnectAllAriaLabel}
      onClick={handleReconnectAll}
      sx={theme => ({
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.onPrimary,
        minHeight: 48,
        [theme.breakpoints.down("sm")]: {
          width: "100%",
        },
      })}
    >
      {labels.reconnectAllWithCount(providers.length)}
    </Button>
  );
}

export default ReconnectAllAction;
