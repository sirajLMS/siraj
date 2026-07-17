"use client";

import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import StarOutlinedIcon from "@mui/icons-material/StarOutlined";
import { Box, Chip, IconButton, Stack, Typography } from "@mui/material";
import type { UserMeetingConfigFieldsFragment } from "@/frontend/common/graphql/generated/gql/operations";
import type { ClassMeetingConfigFieldsFragment } from "@/frontend/common/graphql/types/meeting-class-config.operations";
import { resolveLocalizedString } from "@/frontend/common/lib/localized-string";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { useAppTranslation } from "@/shared/locale";

export type DesktopMeetingConfigListItem = UserMeetingConfigFieldsFragment | ClassMeetingConfigFieldsFragment;

export type DesktopMeetingConfigListProps = {
  readonly configs: readonly DesktopMeetingConfigListItem[];
  readonly title?: string;
  readonly loading?: boolean;
  readonly onSetDefaultAction?: (id: string) => void;
  readonly onEditAction?: (config: DesktopMeetingConfigListItem) => void;
  readonly onDeleteAction?: (id: string) => void;
  readonly emptyMessage?: string;
};

export function DesktopMeetingConfigList({
  configs,
  title,
  loading = false,
  onSetDefaultAction,
  onEditAction,
  onDeleteAction,
  emptyMessage,
}: DesktopMeetingConfigListProps) {
  const t = useAppTranslation().uiTranslations.meetingConfig;
  const tDisplay = t.display;
  const tManager = t.manager;
  const locale = useAppLocale();
  const resolvedEmpty = emptyMessage ?? t.empty;

  if (loading && configs.length === 0) {
    return <Typography sx={{ color: "text.secondary", typography: "bodyMd" }}>{t.loading}</Typography>;
  }

  if (configs.length === 0) {
    return <Typography sx={{ color: "text.secondary", typography: "bodyMd" }}>{resolvedEmpty}</Typography>;
  }

  return (
    <Stack sx={{ gap: 1.5 }}>
      {title ? <Typography sx={{ typography: "titleMd" }}>{title}</Typography> : null}
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
                <Stack sx={{ flexDirection: "row", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
                  <Typography sx={{ typography: "titleMd" }}>{providerName}</Typography>
                  {config.isDefault ? <Chip size="small" label={tDisplay.defaultBadge} color="primary" /> : null}
                  {"hasSecret" in config && config.hasSecret ? (
                    <Chip size="small" label={tDisplay.passwordProtected} variant="outlined" />
                  ) : null}
                  {config.label ? (
                    <Typography sx={{ typography: "bodySm", color: "text.secondary" }}>{config.label}</Typography>
                  ) : null}
                </Stack>
                <Typography sx={{ typography: "bodySm", color: "text.secondary" }} dir="ltr">
                  {meetingUrl}
                </Typography>
              </Stack>
              <Stack sx={{ flexDirection: "row", gap: 0.5 }}>
                {onEditAction ? (
                  <IconButton aria-label={tManager.edit} size="small" onClick={() => onEditAction(config)}>
                    <EditOutlinedIcon fontSize="small" />
                  </IconButton>
                ) : null}
                {!config.isDefault && onSetDefaultAction ? (
                  <IconButton
                    aria-label={tManager.setDefault}
                    size="small"
                    onClick={() => onSetDefaultAction(config.id as string)}
                  >
                    <StarOutlinedIcon fontSize="small" />
                  </IconButton>
                ) : null}
                {onDeleteAction ? (
                  <IconButton
                    aria-label={tManager.delete}
                    size="small"
                    onClick={() => onDeleteAction(config.id as string)}
                  >
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
