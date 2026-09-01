"use client";

import { WarningAmberOutlined } from "@mui/icons-material";
import { Alert, Box, Typography } from "@mui/material";
import type { ComponentType, ReactNode } from "react";
import type { MissedClassAlertBannerProps } from "@/frontend/common/views/dashboard/teachers/dashboard/types/teacherDashboardComponentProps";

interface MissedClassAlertBannerSharedSlots {
  readonly DismissButton: ComponentType<{ readonly onDismiss: () => void; readonly ariaLabel: string }>;
}

export interface MissedClassAlertBannerSharedProps extends MissedClassAlertBannerProps {
  readonly onDismiss?: () => void;
  readonly slots: MissedClassAlertBannerSharedSlots;
}

interface MissedClassAlertBannerContentProps {
  readonly title: string;
  readonly description: string;
  readonly fixed?: boolean;
  readonly action?: ReactNode;
}

/**
 * Pure presentational body of the missed-class alert banner, shared so the
 * Alert/Box/Typography structure is defined once.
 */
function MissedClassAlertBannerContent({
  title,
  description,
  fixed = false,
  action,
}: Readonly<MissedClassAlertBannerContentProps>) {
  return (
    <Alert
      severity="error"
      icon={<WarningAmberOutlined />}
      action={action}
      sx={theme => ({
        mb: 3,
        ...(fixed
          ? {
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              zIndex: theme.zIndex.appBar + 2,
              borderRadius: 0,
            }
          : {}),
      })}
    >
      <Box>
        <Typography sx={{ typography: "labelUppercase", fontWeight: 700 }}>{title}</Typography>
        <Typography sx={{ typography: "bodyMd", mt: 0.5 }}>{description}</Typography>
      </Box>
    </Alert>
  );
}

export function MissedClassAlertBannerShared({
  alert,
  labels,
  fixed = false,
  onDismiss,
  slots,
}: Readonly<MissedClassAlertBannerSharedProps>) {
  const description = labels.description(alert.scheduledTime);
  const { DismissButton } = slots;

  return (
    <MissedClassAlertBannerContent
      title={labels.title}
      description={description}
      fixed={fixed}
      action={onDismiss ? <DismissButton onDismiss={onDismiss} ariaLabel={labels.title} /> : undefined}
    />
  );
}
