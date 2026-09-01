"use client";

import { DeleteOutlined, EditOutlined } from "@mui/icons-material";
import { Box, Chip, IconButton, Stack, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { StatusBadge } from "@/frontend/common/components/ui";
import { LocalizedStringDisplay } from "@/frontend/common/components/ui/display/localizedStringDisplay/LocalizedStringDisplay";
import { MeetingProviderLogo } from "@/frontend/common/components/ui/display/meetingConfig/MeetingProviderLogo";
import type { MeetingProviderFieldsFragment } from "@/frontend/common/graphql/generated/gql/graphql";
import type { MeetingProvidersColumnLabels } from "@/frontend/common/views/dashboard/admin/meeting-providers/types";

/**
 * Tier-neutral catalog grid column factory for the meeting providers page.
 * The logo cell is driven by the row's `logoUrl` only; `MeetingProviderLogo`
 * falls back to its video-camera icon when no URL is present, avoiding the
 * component's built-in static asset map (those assets are not bundled).
 */
export function buildMeetingProviderColumns(
  labels: MeetingProvidersColumnLabels,
  onEdit: (row: MeetingProviderFieldsFragment) => void,
  onDelete: (row: MeetingProviderFieldsFragment) => void
): GridColDef<MeetingProviderFieldsFragment>[] {
  return [
    {
      field: "logoUrl",
      headerName: labels.logo ?? "Logo",
      width: 72,
      sortable: false,
      filterable: false,
      renderCell: ({ row }) => (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
          <MeetingProviderLogo providerSlug={null} providerName={row.slug} logoUrl={row.logoUrl} size="large" />
        </Box>
      ),
    },
    {
      field: "name",
      headerName: labels.name,
      flex: 1.2,
      minWidth: 150,
      renderCell: ({ row }) => <LocalizedStringDisplay value={row.name} />,
    },
    {
      field: "description",
      headerName: labels.description ?? "Description",
      flex: 1.5,
      minWidth: 180,
      renderCell: ({ row }) => (row.description ? <LocalizedStringDisplay value={row.description} /> : "—"),
    },
    {
      field: "instructions",
      headerName: labels.instructions ?? "Instructions",
      flex: 1.5,
      minWidth: 180,
      renderCell: ({ row }) => (row.instructions ? <LocalizedStringDisplay value={row.instructions} /> : "—"),
    },
    {
      field: "urlAllowlist",
      headerName: labels.urlAllowlist ?? "Allowed Hosts",
      flex: 1.5,
      minWidth: 180,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", gap: 0.5, py: 1 }}>
          {(row.urlAllowlist ?? []).map(host => (
            <Chip key={host} size="small" variant="outlined" label={host} />
          ))}
        </Stack>
      ),
    },
    {
      field: "urlExample",
      headerName: labels.urlExample ?? "Example URL",
      flex: 1.2,
      minWidth: 160,
      renderCell: ({ row }) =>
        row.urlExample ? (
          <Typography variant="body2" sx={{ overflow: "hidden", textOverflow: "ellipsis" }}>
            {row.urlExample}
          </Typography>
        ) : (
          "—"
        ),
    },
    {
      field: "isActive",
      headerName: labels.active,
      width: 100,
      renderCell: ({ value }) => (
        <StatusBadge
          category="paymentMethod"
          status={value ? "active" : "inactive"}
          label={value ? labels.active : labels.inactive}
        />
      ),
    },
    {
      field: "actions",
      headerName: labels.actions,
      width: 100,
      sortable: false,
      filterable: false,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={0.5}>
          <IconButton size="small" aria-label={labels.edit} onClick={() => onEdit(row)}>
            <EditOutlined fontSize="small" />
          </IconButton>
          <IconButton size="small" aria-label={labels.delete} onClick={() => onDelete(row)}>
            <DeleteOutlined fontSize="small" />
          </IconButton>
        </Stack>
      ),
    },
  ];
}
