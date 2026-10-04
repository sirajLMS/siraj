"use client";

import { DeleteOutlined, EditOutlined } from "@mui/icons-material";
import { Alert, Box, Chip, IconButton, Stack } from "@mui/material";
import { LocalizedStringDisplay } from "@/frontend/common/components/ui/display";
import { MeetingProviderLogo } from "@/frontend/common/components/ui/display/meetingConfig/MeetingProviderLogo";
import type { MeetingProviderFieldsFragment } from "@/frontend/common/graphql/generated/gql/graphql";
import type { MeetingProvidersViewProps } from "@/frontend/common/views/dashboard/admin/meeting-providers/types";
import { MobileCardListItem, MobileStatusBadge } from "@/frontend/mobile/components/ui";

function MeetingProvidersMobileEmptyState({ title, body }: Readonly<{ title: string; body: string }>) {
  return (
    <Alert severity="info" sx={{ mx: 2, mb: 2 }}>
      <Stack spacing={0.5}>
        <Box sx={{ typography: "labelSm" }}>{title}</Box>
        <Box sx={{ typography: "bodyMd" }}>{body}</Box>
      </Stack>
    </Alert>
  );
}

interface MobileProviderRowProps {
  readonly row: MeetingProviderFieldsFragment;
  readonly labels: MeetingProvidersViewProps["t"];
  readonly onEdit: (row: MeetingProviderFieldsFragment) => void;
  readonly onDelete: (row: MeetingProviderFieldsFragment) => void;
}

function MobileProviderRow({ row, labels, onEdit, onDelete }: MobileProviderRowProps) {
  const isActive = Boolean(row.isActive);
  return (
    <MobileCardListItem variant="edge-to-edge">
      <Box sx={{ p: 2, width: "100%", overflow: "hidden" }}>
        <Stack spacing={1.5}>
          {/* Header Row */}
          <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", gap: 1.5 }}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", minWidth: 0, flex: 1 }}>
              <MeetingProviderLogo providerSlug={null} providerName={row.slug} logoUrl={row.logoUrl} size="large" />
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Box sx={{ typography: "titleLg", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  <LocalizedStringDisplay value={row.name} />
                </Box>
                <Box sx={{ typography: "labelMd", color: theme => theme.palette.text.secondary }}>{row.slug}</Box>
              </Box>
            </Stack>

            <Stack direction="row" sx={{ gap: 0.5, alignItems: "center" }}>
              <MobileStatusBadge
                category="paymentMethod"
                status={isActive ? "active" : "inactive"}
                label={isActive ? labels.active : labels.inactive}
              />
              <IconButton size="small" aria-label={labels.edit} onClick={() => onEdit(row)}>
                <EditOutlined fontSize="small" />
              </IconButton>
              <IconButton size="small" aria-label={labels.delete} onClick={() => onDelete(row)}>
                <DeleteOutlined fontSize="small" />
              </IconButton>
            </Stack>
          </Stack>

          {/* Description & Instructions */}
          {row.description ? (
            <LocalizedStringDisplay
              value={row.description}
              typographyVariant="body2"
              sx={theme => ({ color: theme.palette.text.secondary })}
            />
          ) : null}

          {/* Allowed Hosts Chips */}
          {(row.urlAllowlist ?? []).length > 0 ? (
            <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", gap: 0.5 }}>
              {(row.urlAllowlist ?? []).map(host => (
                <Chip key={host} size="small" variant="outlined" label={host} />
              ))}
            </Stack>
          ) : null}

          {/* Capability Flags */}
          <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", gap: 0.5 }}>
            {row.fieldSchema?.supportsUsername ? (
              <Chip size="small" variant="outlined" label={labels.supportsUsername ?? ""} />
            ) : null}
            {row.fieldSchema?.supportsPassword ? (
              <Chip size="small" variant="outlined" label={labels.supportsPassword ?? ""} />
            ) : null}
            {row.fieldSchema?.supportsTenantId ? (
              <Chip size="small" variant="outlined" label={labels.supportsTenantId ?? ""} />
            ) : null}
          </Stack>
        </Stack>
      </Box>
    </MobileCardListItem>
  );
}

export { MeetingProvidersMobileEmptyState, MobileProviderRow };
