"use client";

import { alpha, Box, Button, CircularProgress } from "@mui/material";
import { styled } from "@mui/material/styles";
import { BaseCard } from "@/frontend/common/components/ui";
import type { CommunicationLogEntry } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { CommunicationLogCardProps } from "@/frontend/common/views/dashboard/classes/audit/communicationLogCard.types";
import { StyledSectionTitle } from "@/frontend/common/views/dashboard/classes/audit/components";
import {
  type CommunicationLogEntryItemConfig,
  CommunicationLogEntryItemShared,
} from "@/frontend/common/views/dashboard/classes/audit/components/__shared__/communicationLogEntryItemShared";

const DESKTOP_ENTRY_CONFIG: CommunicationLogEntryItemConfig = {
  iconContainerSize: 32,
  iconFontSize: 18,
  alignItems: "flex-start",
  entryExtras: {},
};

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

const DesktopLogEntryItem = ({ entry }: Readonly<{ entry: CommunicationLogEntry }>) => (
  <CommunicationLogEntryItemShared entry={entry} config={DESKTOP_ENTRY_CONFIG} />
);

export function CommunicationLogCardDesktop({
  entries,
  labels,
  onResend,
  isResending,
}: Readonly<CommunicationLogCardProps>) {
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
