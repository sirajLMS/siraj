"use client";

import { CheckCircleOutlined, EmailOutlined, RadioButtonUncheckedOutlined, SmsOutlined } from "@mui/icons-material";
import { alpha, Box, Button, CircularProgress, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { BaseCard } from "@/frontend/components/ui";
import type { CommunicationLogEntry } from "@/frontend/graphql/generated/gql/graphql-types";

export interface CommunicationLogCardDesktopProps {
  readonly entries: readonly (CommunicationLogEntry | null)[] | null | undefined;
  readonly labels: {
    readonly title: string;
    readonly resendNotifications: string;
  };
  readonly onResend: () => void;
  readonly isResending: boolean;
}

type CommunicationType = "email" | "sms";

const COMMUNICATION_ICONS: Record<CommunicationType, typeof EmailOutlined> = {
  email: EmailOutlined,
  sms: SmsOutlined,
};

const StyledDeliveredIcon = styled(CheckCircleOutlined)(({ theme }) => ({
  color: theme.palette.success.main,
}));

const StyledUndeliveredIcon = styled(RadioButtonUncheckedOutlined)(({ theme }) => ({
  color: theme.palette.text.secondary,
}));

const StyledEntryDescription = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
}));

const StyledEntryTimestamp = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.main,
}));

const StyledSectionTitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.main,
}));

const StyledDesktopResendButton = styled(Button)(({ theme }) => ({
  borderColor: theme.palette.border.light,
  color: theme.palette.text.secondary,
  typography: "labelUppercase",
  borderRadius: 2,
  "&:hover": {
    borderColor: theme.palette.primary.main,
    color: theme.palette.primary.main,
    backgroundColor: alpha(theme.palette.primary.main, 0.04),
  },
}));

function DesktopLogEntryItem({ entry }: Readonly<{ entry: CommunicationLogEntry }>) {
  const type = (entry.type ?? "email") as CommunicationType;
  const Icon = COMMUNICATION_ICONS[type] ?? EmailOutlined;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 1.5,
        opacity: entry.isActive ? 1 : 0.6,
      }}
    >
      <Box sx={{ display: "flex", gap: 1.5 }}>
        <Box
          sx={theme => ({
            width: 32,
            height: 32,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            backgroundColor: entry.isActive ? theme.palette.secondaryContainer : theme.palette.action.selected,
            color: entry.isActive ? theme.palette.onSecondaryContainer : theme.palette.text.secondary,
          })}
        >
          <Icon sx={{ fontSize: 18 }} />
        </Box>
        <Box>
          <Typography variant="bodyMd" sx={{ fontWeight: 700 }}>
            {entry.title}
          </Typography>
          {entry.description ? (
            <StyledEntryDescription variant="labelMd">{entry.description}</StyledEntryDescription>
          ) : null}
          {entry.timestamp ? (
            <StyledEntryTimestamp variant="labelUppercase" sx={{ mt: 0.5 }}>
              {entry.timestamp}
            </StyledEntryTimestamp>
          ) : null}
        </Box>
      </Box>
      {entry.isDelivered ? <StyledDeliveredIcon /> : <StyledUndeliveredIcon />}
    </Box>
  );
}

export function CommunicationLogCardDesktop({
  entries,
  labels,
  onResend,
  isResending,
}: Readonly<CommunicationLogCardDesktopProps>) {
  const validEntries = (entries ?? []).filter((e): e is CommunicationLogEntry => e != null);

  return (
    <Box>
      <BaseCard sx={{ p: 3 }}>
        <StyledSectionTitle variant="titleLg" sx={{ mb: 2 }}>
          {labels.title}
        </StyledSectionTitle>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {validEntries.map(entry => (
            <DesktopLogEntryItem key={entry.id ?? ""} entry={entry} />
          ))}
        </Box>

        <StyledDesktopResendButton
          id="audit-resend-notifications-btn"
          fullWidth
          variant="outlined"
          onClick={onResend}
          disabled={isResending}
          sx={{ mt: 3, py: 1 }}
        >
          {isResending ? <CircularProgress size={16} /> : labels.resendNotifications}
        </StyledDesktopResendButton>
      </BaseCard>
    </Box>
  );
}
