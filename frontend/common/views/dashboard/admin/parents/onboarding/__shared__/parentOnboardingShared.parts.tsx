import { InfoOutlined } from "@mui/icons-material";
import { Alert, Button, Stack, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactNode } from "react";
import type { ParentOnboardingSharedOptions } from "@/frontend/common/views/dashboard/admin/parents/onboarding/__shared__/parentOnboardingShared.types";
import type { MeetingConfigAlertProps } from "@/frontend/common/views/dashboard/admin/parents/onboarding/types";

export function MeetingConfigAlertShared({
  meetingConfigWarning,
  meetingSetupHref,
  failureMessage,
  setupLinkLabel,
  onClearWarning,
  onVisitSetup,
  alertSx,
}: Readonly<MeetingConfigAlertProps> & { readonly alertSx: SxProps<Theme> }): ReactNode {
  if (!meetingConfigWarning) return null;

  return (
    <Alert
      severity="warning"
      onClose={onClearWarning}
      action={
        meetingSetupHref ? (
          <Button color="inherit" size="small" onClick={onVisitSetup}>
            {setupLinkLabel}
          </Button>
        ) : undefined
      }
      sx={alertSx}
    >
      {failureMessage}
    </Alert>
  );
}

export function StatusBadgeShared({
  bannerText,
  options,
}: {
  readonly bannerText: string;
  readonly options: ParentOnboardingSharedOptions;
}): ReactNode {
  return (
    <Stack sx={options.statusBadgeSx}>
      <InfoOutlined sx={{ fontSize: options.statusBadgeIconSize }} />
      <Typography variant={options.statusBadgeTypographyVariant}>{bannerText}</Typography>
    </Stack>
  );
}
