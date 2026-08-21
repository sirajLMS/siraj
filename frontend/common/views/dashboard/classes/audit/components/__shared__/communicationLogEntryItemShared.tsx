"use client";

import { EmailOutlined } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import type { SystemStyleObject, Theme } from "@mui/system";
import type { GroupClassAuditQuery_groupClassAudit_communications as CommunicationLogEntry } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  StyledDeliveredIcon,
  StyledEntryDescription,
  StyledEntryTimestamp,
  StyledUndeliveredIcon,
} from "@/frontend/common/views/dashboard/classes/audit/components/communicationLogCard.styled";
import { COMMUNICATION_ICONS } from "@/frontend/common/views/dashboard/classes/audit/constants";
import type { CommunicationType } from "@/frontend/common/views/dashboard/classes/audit/types";

const VALID_COMMUNICATION_TYPES = new Set<string>(Object.keys(COMMUNICATION_ICONS));

function isCommunicationType(value: string | null | undefined): value is CommunicationType {
  return value != null && VALID_COMMUNICATION_TYPES.has(value);
}

export interface CommunicationLogEntryItemConfig {
  readonly iconContainerSize: number;
  readonly iconFontSize: number;
  readonly alignItems: "flex-start" | "center";
  readonly entryExtras: SystemStyleObject<Theme> | ((theme: Theme) => SystemStyleObject<Theme>);
}

export function CommunicationLogEntryItemShared({
  entry,
  config,
}: Readonly<{ entry: CommunicationLogEntry; config: CommunicationLogEntryItemConfig }>) {
  const type = isCommunicationType(entry.type) ? entry.type : "email";
  const Icon = COMMUNICATION_ICONS[type] ?? EmailOutlined;

  return (
    <Box
      sx={[
        {
          display: "flex",
          alignItems: config.alignItems,
          justifyContent: "space-between",
          gap: 1.5,
          opacity: entry.isActive ? 1 : 0.6,
        },
        config.entryExtras,
      ]}
    >
      <Box sx={{ display: "flex", gap: 1.5 }}>
        <Box
          sx={theme => ({
            width: config.iconContainerSize,
            height: config.iconContainerSize,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            backgroundColor: entry.isActive ? theme.palette.secondaryContainer : theme.palette.action.selected,
            color: entry.isActive ? theme.palette.onSecondaryContainer : theme.palette.text.secondary,
          })}
        >
          <Icon sx={{ fontSize: config.iconFontSize }} />
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
