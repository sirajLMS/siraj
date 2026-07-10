"use client";

import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import StarOutlinedIcon from "@mui/icons-material/StarOutlined";
import { Box, Chip, IconButton, Stack, Typography } from "@mui/material";
import { useLocale } from "next-intl";
import type { UserMeetingConfigFieldsFragment } from "@/frontend/graphql/generated/gql/operations";
import { resolveLocalizedString } from "@/frontend/lib/localized-string";

export type MeetingConfigListProps = {
  readonly configs: readonly UserMeetingConfigFieldsFragment[];
  readonly onSetDefaultAction?: (id: string) => void;
  readonly onDeleteAction?: (id: string) => void;
  readonly emptyLabel?: string;
};

export function MeetingConfigList({
  configs,
  onSetDefaultAction,
  onDeleteAction,
  emptyLabel = "No meeting configs yet",
}: MeetingConfigListProps) {
  const locale = useLocale();

  if (configs.length === 0) {
    return <Typography sx={{ color: "text.secondary", typography: "bodyMd" }}>{emptyLabel}</Typography>;
  }

  return (
    <Stack sx={{ gap: 1.5 }}>
      {configs.map(config => {
        if (!config.id) return null;
        const providerName = config.provider
          ? resolveLocalizedString(config.provider.name, locale)
          : (config.providerId ?? "");
        const meetingUrl = config.details?.meetingUrl ?? "";

        return (
          <Box
            key={config.id}
            sx={theme => ({
              border: `1px solid ${theme.palette.outlineVariant}`,
              borderRadius: 2,
              p: 2,
            })}
          >
            <Stack sx={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
              <Stack sx={{ gap: 0.5 }}>
                <Stack sx={{ flexDirection: "row", gap: 1, alignItems: "center" }}>
                  <Typography sx={{ typography: "titleMd" }}>{providerName}</Typography>
                  {config.isDefault ? <Chip size="small" label="Default" color="primary" /> : null}
                  {config.label ? (
                    <Typography sx={{ typography: "bodySm", color: "text.secondary" }}>{config.label}</Typography>
                  ) : null}
                </Stack>
                <Typography sx={{ typography: "bodySm", color: "text.secondary" }} dir="ltr">
                  {meetingUrl}
                </Typography>
              </Stack>
              <Stack sx={{ flexDirection: "row", gap: 0.5 }}>
                {!config.isDefault && onSetDefaultAction ? (
                  <IconButton
                    aria-label="Set default"
                    size="small"
                    onClick={() => onSetDefaultAction(config.id as string)}
                  >
                    <StarOutlinedIcon fontSize="small" />
                  </IconButton>
                ) : null}
                {onDeleteAction ? (
                  <IconButton aria-label="Delete" size="small" onClick={() => onDeleteAction(config.id as string)}>
                    <DeleteOutlinedIcon fontSize="small" />
                  </IconButton>
                ) : null}
              </Stack>
            </Stack>
          </Box>
        );
      })}
    </Stack>
  );
}
