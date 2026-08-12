"use client";

import { alpha, Box, Button, CircularProgress } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { CommunicationLogEntry } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { CommunicationLogCardProps } from "@/frontend/common/views/dashboard/classes/audit/communicationLogCard.types";
import { StyledSectionTitle } from "@/frontend/common/views/dashboard/classes/audit/components";
import {
  type CommunicationLogEntryItemConfig,
  CommunicationLogEntryItemShared,
} from "@/frontend/common/views/dashboard/classes/audit/components/__shared__/communicationLogEntryItemShared";
import { MobileBaseCard } from "@/frontend/mobile/components/ui/card";

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

const MOBILE_ENTRY_CONFIG: CommunicationLogEntryItemConfig = {
  iconContainerSize: 40,
  iconFontSize: 20,
  alignItems: "center",
  entryExtras: theme => ({
    p: 2,
    backgroundColor: theme.palette.action.hover,
    borderRadius: 3,
  }),
};

const MobileLogEntryItem = ({ entry }: Readonly<{ entry: CommunicationLogEntry }>) => (
  <CommunicationLogEntryItemShared entry={entry} config={MOBILE_ENTRY_CONFIG} />
);

export function CommunicationLogCardMobile({
  entries,
  labels,
  onResend,
  isResending,
}: Readonly<CommunicationLogCardProps>) {
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
