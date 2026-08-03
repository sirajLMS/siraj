"use client";

import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import StarOutlinedIcon from "@mui/icons-material/StarOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import { Box, Chip, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import type { MeetingConfigListProps } from "@/frontend/common/components/ui/display/meetingConfig/types";
import { resolveLocalizedString } from "@/frontend/common/lib/localized-string";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { Translation, useAppTranslation } from "@/shared/locale";

export type {
  MeetingConfigListItem,
  MeetingConfigListProps,
} from "@/frontend/common/components/ui/display/meetingConfig/types";

export function MeetingConfigList({
  configs,
  title,
  loading = false,
  onSetDefaultAction,
  onEditAction,
  onDeleteAction,
  emptyMessage,
  requiresReconnect,
  renderRowExtra,
}: MeetingConfigListProps) {
  const t = useAppTranslation(Translation.Ui.MeetingConfig);
  const tDisplay = t.display;
  const tManager = t.manager;
  const tReauth = t.reauthNeeded;
  const locale = useAppLocale();
  const resolvedEmpty = emptyMessage ?? t.empty;
  const reconnectSet = new Set(requiresReconnect ?? []);

  if (loading && configs.length === 0) {
    return (
      <Typography sx={theme => ({ color: theme.palette.text.secondary, typography: "bodyMd" })}>{t.loading}</Typography>
    );
  }

  if (configs.length === 0) {
    return (
      <Typography sx={theme => ({ color: theme.palette.text.secondary, typography: "bodyMd" })}>
        {resolvedEmpty}
      </Typography>
    );
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
        const providerSlug = config.provider?.slug ?? null;
        const needsReconnect = providerSlug != null && reconnectSet.has(providerSlug);

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
                  {needsReconnect ? (
                    <Chip
                      size="small"
                      color="warning"
                      label={tReauth.reconnectRequiredBadge}
                      icon={<WarningAmberOutlinedIcon sx={{ fontSize: 16 }} />}
                    />
                  ) : null}
                  {"hasSecret" in config && config.hasSecret ? (
                    <Chip size="small" label={tDisplay.passwordProtected} variant="outlined" />
                  ) : null}
                  {config.label ? (
                    <Typography sx={theme => ({ typography: "bodySm", color: theme.palette.text.secondary })}>
                      {config.label}
                    </Typography>
                  ) : null}
                </Stack>
                <Tooltip title={meetingUrl || ""} placement="top-start">
                  <Typography sx={theme => ({ typography: "bodySm", color: theme.palette.text.secondary })} dir="ltr">
                    {meetingUrl}
                  </Typography>
                </Tooltip>
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
            {renderRowExtra ? renderRowExtra(config) : null}
          </Box>
        );
      })}
    </Stack>
  );
}
