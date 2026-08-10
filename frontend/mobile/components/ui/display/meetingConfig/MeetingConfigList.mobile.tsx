"use client";

import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import StarOutlinedIcon from "@mui/icons-material/StarOutlined";
import { Box, Chip, IconButton, Stack, Typography } from "@mui/material";
import type { UserMeetingConfigFieldsFragment } from "@/frontend/common/graphql/generated/gql/operations";
import type { ClassMeetingConfigFieldsFragment } from "@/frontend/common/graphql/types/meeting-class-config.operations";
import { resolveLocalizedString } from "@/frontend/common/lib/localized-string";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { Translation, useAppTranslation } from "@/shared/locale";

export type MobileMeetingConfigListItem = UserMeetingConfigFieldsFragment | ClassMeetingConfigFieldsFragment;

export type MobileMeetingConfigListProps = {
  readonly configs: readonly MobileMeetingConfigListItem[];
  readonly title?: string;
  readonly loading?: boolean;
  readonly onSetDefaultAction?: (id: string) => void;
  readonly onEditAction?: (config: MobileMeetingConfigListItem) => void;
  readonly onDeleteAction?: (id: string) => void;
  readonly emptyMessage?: string;
};

/**
 * Mobile-tier meeting config list.
 *
 * Differences vs desktop:
 * - Tighter card padding (`p: 1.5` vs desktop `p: 2`) for compact rows.
 * - Tighter card gaps (`gap: 1` vs desktop `gap: 1.5`).
 * - Smaller touch targets: icon buttons use `size="small"` with reduced gap.
 * - Slightly tighter typography (`bodySm` titles instead of `titleMd`) for
 *   smaller mobile visual weight.
 */
export function MobileMeetingConfigList({
  configs,
  title,
  loading = false,
  onSetDefaultAction,
  onEditAction,
  onDeleteAction,
  emptyMessage,
}: MobileMeetingConfigListProps) {
  const t = useAppTranslation(Translation.Ui.MeetingConfig);
  const tDisplay = t.display;
  const tManager = t.manager;
  const locale = useAppLocale();
  const resolvedEmpty = emptyMessage ?? t.empty;

  if (loading && configs.length === 0) {
    return <Typography sx={{ color: "text.secondary", typography: "bodySm" }}>{t.loading}</Typography>;
  }

  if (configs.length === 0) {
    return <Typography sx={{ color: "text.secondary", typography: "bodySm" }}>{resolvedEmpty}</Typography>;
  }

  return (
    <Stack sx={{ gap: 1 }}>
      {title ? <Typography sx={{ typography: "titleSm" }}>{title}</Typography> : null}
      {configs.map(config => {
        const configId = config.id;
        if (!configId) return null;
        const providerName = config.provider
          ? resolveLocalizedString(config.provider.name, locale)
          : (config.providerId ?? "");
        const meetingUrl = config.details?.meetingUrl ?? "";

        return (
          <Box
            key={configId}
            sx={theme => ({
              border: `1px solid ${theme.palette.outlineVariant}`,
              borderRadius: 1.5,
              p: 1.5,
            })}
          >
            <Stack sx={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 0.75 }}>
              <Stack sx={{ gap: 0.25, minWidth: 0, flex: 1 }}>
                <Stack sx={{ flexDirection: "row", gap: 0.75, alignItems: "center", flexWrap: "wrap" }}>
                  <Typography sx={{ typography: "titleSm", fontWeight: 600 }}>{providerName}</Typography>
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
              <Stack sx={{ flexDirection: "row", gap: 0.25 }}>
                {onEditAction ? (
                  <IconButton aria-label={tManager.edit} size="small" onClick={() => onEditAction(config)}>
                    <EditOutlinedIcon fontSize="small" />
                  </IconButton>
                ) : null}
                {!config.isDefault && onSetDefaultAction ? (
                  <IconButton
                    aria-label={tManager.setDefault}
                    size="small"
                    onClick={() => onSetDefaultAction(configId)}
                  >
                    <StarOutlinedIcon fontSize="small" />
                  </IconButton>
                ) : null}
                {onDeleteAction ? (
                  <IconButton aria-label={tManager.delete} size="small" onClick={() => onDeleteAction(configId)}>
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
