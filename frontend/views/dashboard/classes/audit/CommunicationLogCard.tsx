"use client";

import { CheckCircleOutlined, EmailOutlined, RadioButtonUncheckedOutlined, SmsOutlined } from "@mui/icons-material";
import { alpha, Box, Button, Typography, useMediaQuery, useTheme } from "@mui/material";
import { styled } from "@mui/material/styles";
import { BaseCard } from "@/frontend/components/ui";
import type { CommunicationLogEntry, CommunicationType } from "@/frontend/stores/mockClassAuditStore";

interface CommunicationLogCardProps {
  readonly entries: readonly CommunicationLogEntry[];
  readonly labels: {
    readonly title: string;
    readonly resendNotifications: string;
  };
  readonly onResend: () => void;
}

const COMMUNICATION_ICONS: Record<CommunicationType, typeof EmailOutlined> = {
  email: EmailOutlined,
  sms: SmsOutlined,
};

// Success-colored icon indicating a delivered communication entry
const StyledDeliveredIcon = styled(CheckCircleOutlined)(({ theme }) => ({
  color: theme.palette.success.main,
}));

// Muted icon indicating an undelivered communication entry
const StyledUndeliveredIcon = styled(RadioButtonUncheckedOutlined)(({ theme }) => ({
  color: theme.palette.text.secondary,
}));

// Secondary-colored description caption beneath a log entry title
const StyledEntryDescription = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
}));

// Primary-colored uppercase timestamp label shown beneath the entry description
const StyledEntryTimestamp = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.main,
}));

// Primary-colored card title used in both mobile header and desktop body
const StyledSectionTitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.main,
}));

// Outlined resend button used in the mobile header (primary border + hover tint)
const StyledMobileResendButton = styled(Button)(({ theme }) => ({
  color: theme.palette.primary.main,
  borderColor: theme.palette.primary.main,
  typography: "labelUppercase",
  borderRadius: 1.5,
  "&:hover": {
    borderColor: theme.palette.primary.dark,
    bgcolor: alpha(theme.palette.primary.main, 0.04),
  },
}));

// Full-width desktop resend button with muted border that transitions to primary on hover
const StyledDesktopResendButton = styled(Button)(({ theme }) => ({
  borderColor: theme.palette.border.light,
  color: theme.palette.text.secondary,
  typography: "labelUppercase",
  borderRadius: 2,
  "&:hover": {
    borderColor: theme.palette.primary.main,
    color: theme.palette.primary.main,
    bgcolor: alpha(theme.palette.primary.main, 0.04),
  },
}));

const LogEntryItem = ({ entry, isMobile }: { entry: CommunicationLogEntry; isMobile: boolean }) => {
  const Icon = COMMUNICATION_ICONS[entry.type];
  const deliveryIcon = entry.isDelivered ? <StyledDeliveredIcon /> : <StyledUndeliveredIcon />;

  return (
    <Box
      sx={theme => ({
        display: "flex",
        alignItems: isMobile ? "center" : "flex-start",
        justifyContent: "space-between",
        gap: 1.5,
        p: isMobile ? 2 : 0,
        bgcolor: isMobile ? theme.palette.action.hover : undefined,
        borderRadius: isMobile ? 3 : 0,
        opacity: entry.isActive ? 1 : 0.6,
      })}
    >
      <Box sx={{ display: "flex", gap: 1.5 }}>
        <Box
          sx={theme => ({
            width: isMobile ? 40 : 32,
            height: isMobile ? 40 : 32,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            bgcolor: entry.isActive ? theme.palette.secondaryContainer : theme.palette.action.selected,
            color: entry.isActive ? theme.palette.onSecondaryContainer : theme.palette.text.secondary,
          })}
        >
          <Icon sx={{ fontSize: isMobile ? 20 : 18 }} />
        </Box>
        <Box>
          <Typography variant="bodyMd" sx={{ fontWeight: 700 }}>
            {entry.title}
          </Typography>
          <StyledEntryDescription variant="labelMd">{entry.description}</StyledEntryDescription>
          {entry.timestamp ? (
            <StyledEntryTimestamp variant="labelUppercase" sx={{ mt: 0.5 }}>
              {entry.timestamp}
            </StyledEntryTimestamp>
          ) : null}
        </Box>
      </Box>
      {isMobile ? deliveryIcon : null}
    </Box>
  );
};

export function CommunicationLogCard({ entries, labels, onResend }: CommunicationLogCardProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <Box>
      {isMobile ? (
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5, px: 0.5 }}>
          <StyledSectionTitle variant="titleLg">{labels.title}</StyledSectionTitle>
          <StyledMobileResendButton onClick={onResend} variant="outlined" size="small">
            {labels.resendNotifications}
          </StyledMobileResendButton>
        </Box>
      ) : null}

      <BaseCard sx={{ p: 3 }}>
        {!isMobile && (
          <StyledSectionTitle variant="titleLg" sx={{ mb: 2 }}>
            {labels.title}
          </StyledSectionTitle>
        )}

        <Box sx={{ display: "flex", flexDirection: "column", gap: isMobile ? 1 : 2 }}>
          {entries.map(entry => (
            <LogEntryItem key={entry.id} entry={entry} isMobile={isMobile} />
          ))}
        </Box>

        {!isMobile && (
          <StyledDesktopResendButton
            id="audit-resend-notifications-btn"
            fullWidth
            variant="outlined"
            onClick={onResend}
            sx={{ mt: 3, py: 1 }}
          >
            {labels.resendNotifications}
          </StyledDesktopResendButton>
        )}
      </BaseCard>
    </Box>
  );
}
