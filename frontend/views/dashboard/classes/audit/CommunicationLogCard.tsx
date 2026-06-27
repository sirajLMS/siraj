"use client";

import { CheckCircleOutlined, EmailOutlined, RadioButtonUncheckedOutlined, SmsOutlined } from "@mui/icons-material";
import { alpha, Box, Button, CircularProgress, Typography, useMediaQuery, useTheme } from "@mui/material";
import { styled } from "@mui/material/styles";
import { BaseCard } from "@/frontend/components/ui";
import type { CommunicationLogEntry } from "@/frontend/graphql/generated/gql/graphql-types";

interface CommunicationLogCardProps {
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

const LogEntryItem = ({ entry, isMobile }: { entry: CommunicationLogEntry; isMobile: boolean }) => {
  const type = (entry.type ?? "email") as CommunicationType;
  const Icon = COMMUNICATION_ICONS[type] ?? EmailOutlined;
  const deliveryIcon = entry.isDelivered ? <StyledDeliveredIcon /> : <StyledUndeliveredIcon />;

  return (
    <Box
      sx={theme => ({
        display: "flex",
        alignItems: isMobile ? "center" : "flex-start",
        justifyContent: "space-between",
        gap: 1.5,
        p: isMobile ? 2 : 0,
        backgroundColor: isMobile ? theme.palette.action.hover : undefined,
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
            backgroundColor: entry.isActive ? theme.palette.secondaryContainer : theme.palette.action.selected,
            color: entry.isActive ? theme.palette.onSecondaryContainer : theme.palette.text.secondary,
          })}
        >
          <Icon sx={{ fontSize: isMobile ? 20 : 18 }} />
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
      {isMobile ? deliveryIcon : null}
    </Box>
  );
};

export function CommunicationLogCard({ entries, labels, onResend, isResending }: CommunicationLogCardProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const validEntries = (entries ?? []).filter((e): e is CommunicationLogEntry => e != null);

  return (
    <Box>
      {isMobile ? (
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5, px: 0.5 }}>
          <StyledSectionTitle variant="titleLg">{labels.title}</StyledSectionTitle>
          <StyledMobileResendButton onClick={onResend} variant="outlined" size="small" disabled={isResending}>
            {isResending ? <CircularProgress size={16} /> : labels.resendNotifications}
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
          {validEntries.map(entry => (
            <LogEntryItem key={entry.id ?? ""} entry={entry} isMobile={isMobile} />
          ))}
        </Box>

        {!isMobile && (
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
        )}
      </BaseCard>
    </Box>
  );
}
