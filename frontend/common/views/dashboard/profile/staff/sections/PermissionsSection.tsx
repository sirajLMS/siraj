"use client";

import CheckCircleOutlined from "@mui/icons-material/CheckCircleOutlined";
import ShieldOutlined from "@mui/icons-material/ShieldOutlined";
import { Box, Chip, Stack, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import { AppDataGrid, SectionPanel } from "@/frontend/common/components/ui";
import { OverrideState } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { StaffPermissionsSectionLabels } from "@/frontend/common/views/dashboard/profile/staff/sections/staffProfileTypes";
import {
  type PermissionsSectionProps,
  usePermissionsSectionViewModel,
} from "@/frontend/common/views/dashboard/profile/staff/usePermissionsSectionViewModel";

type StaffPermissionOverride = NonNullable<PermissionsSectionProps["permissionOverrides"]>[number];

interface PermissionsOverridesGridProps {
  readonly overrides: readonly StaffPermissionOverride[];
  readonly labels: StaffPermissionsSectionLabels;
}

function PermissionsOverridesGrid({ overrides, labels: tp }: Readonly<PermissionsOverridesGridProps>) {
  const columns = useMemo<GridColDef<StaffPermissionOverride>[]>(
    () => [
      {
        field: "resource",
        headerName: tp.columns.resource,
        flex: 1,
        minWidth: 120,
      },
      {
        field: "action",
        headerName: tp.columns.action,
        flex: 1,
        minWidth: 120,
      },
      {
        field: "state",
        headerName: tp.columns.state,
        width: 120,
        renderCell: params => {
          const state = params.value as OverrideState | null;
          return state === OverrideState.Granted ? tp.states.granted : tp.states.denied;
        },
      },
    ],
    [tp]
  );

  return (
    <AppDataGrid<StaffPermissionOverride>
      rows={overrides}
      columns={columns}
      getRowId={row => row.id ?? ""}
      paginationOptions={false}
      autoHeight
    />
  );
}

export function PermissionsSection(props: Readonly<PermissionsSectionProps>) {
  const {
    labels: tp,
    permissionGroups,
    permissionOverrides,
    isOwnScope = false,
  } = usePermissionsSectionViewModel(props);
  const groups = permissionGroups ?? [];
  const overrides = permissionOverrides ?? [];
  const hasGroups = groups.length > 0;
  const hasOverrides = overrides.length > 0;

  if (!hasGroups && !hasOverrides) {
    return (
      <SectionPanel title={tp.inheritedGroups}>
        <Stack
          spacing={1}
          sx={{
            alignItems: "center",
            justifyContent: "center",
            py: 3,
            textAlign: "center",
          }}
        >
          <ShieldOutlined sx={{ fontSize: 40, color: theme => theme.palette.text.secondary }} />
          <Typography sx={{ typography: "titleLg" }}>{tp.empty.title}</Typography>
          <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary, maxWidth: 420 }}>
            {isOwnScope ? tp.empty.ownDescription : tp.empty.description}
          </Typography>
        </Stack>
      </SectionPanel>
    );
  }

  return (
    <SectionPanel title={tp.inheritedGroups}>
      <Stack spacing={2}>
        {hasGroups ? (
          <Box>
            <Typography sx={{ typography: "labelMd", mb: 1.5 }}>{tp.inheritedGroups}</Typography>
            <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
              {groups.map(group => (
                <Chip
                  key={group.id}
                  icon={<CheckCircleOutlined />}
                  label={group.name}
                  variant="outlined"
                  size="small"
                />
              ))}
            </Stack>
          </Box>
        ) : null}

        {hasOverrides ? (
          <Box>
            <Typography sx={{ typography: "labelMd", mb: 1.5 }}>{tp.directOverrides}</Typography>
            <PermissionsOverridesGrid overrides={overrides} labels={tp} />
          </Box>
        ) : null}
      </Stack>
    </SectionPanel>
  );
}
