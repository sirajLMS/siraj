"use client";

import { CheckCircleOutlined, EmailOutlined, RadioButtonUncheckedOutlined, SmsOutlined } from "@mui/icons-material";
import { alpha, Box, Button, CircularProgress, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { CommunicationLogEntry } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { MobileBaseCard } from "@/frontend/mobile/components/ui/card";

export interface CommunicationLogCardMobileProps {
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

const StyledMobileResendButton = styled(Button)(({ theme }) => ({
  color: theme.palette.primary.main,
  borderColor: theme.palette.primary.main,
  typography: "labelUppercase",
  borderRadius: 1.5,
  "&:hover": {
    borderColor: theme.palette.primary.dark,
    backgroundColor: alpha(theme.palette.primary.main, 0.04),
  },
}));

function MobileLogEntryItem({ entry }: Readonly<{ entry: CommunicationLogEntry }>) {
  const type = (entry.type ?? "email") as CommunicationType;
  const Icon = COMMUNICATION_ICONS[type] ?? EmailOutlined;
  const deliveryIcon = entry.isDelivered ? <StyledDeliveredIcon /> : <StyledUndeliveredIcon />;

  return (
    <Box
      sx={theme => ({
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1.5,
        p: 2,
        backgroundColor: theme.palette.action.hover,
        borderRadius: 3,
        opacity: entry.isActive ? 1 : 0.6,
      })}
    >
      <Box sx={{ display: "flex", gap: 1.5 }}>
        <Box
          sx={theme => ({
            width: 40,
            height: 40,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            backgroundColor: entry.isActive ? theme.palette.secondaryContainer : theme.palette.action.selected,
            color: entry.isActive ? theme.palette.onSecondaryContainer : theme.palette.text.secondary,
          })}
        >
          <Icon sx={{ fontSize: 20 }} />
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
      {deliveryIcon}
    </Box>
  );
}

export function CommunicationLogCardMobile({
  entries,
  labels,
  onResend,
  isResending,
}: Readonly<CommunicationLogCardMobileProps>) {
  const validEntries = (entries ?? []).filter((e): e is CommunicationLogEntry => e != null);

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5, px: 0.5 }}>
        <StyledSectionTitle variant="titleLg">{labels.title}</StyledSectionTitle>
        <StyledMobileResendButton onClick={onResend} variant="outlined" size="small" disabled={isResending}>
          {isResending ? <CircularProgress size={16} /> : labels.resendNotifications}
        </StyledMobileResendButton>
      </Box>

      <MobileBaseCard sx={{ p: 3 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {validEntries.map(entry => (
            <MobileLogEntryItem key={entry.id ?? ""} entry={entry} />
          ))}
        </Box>
      </MobileBaseCard>
    </Box>
  );
}
