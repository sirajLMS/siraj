"use client";

import CheckCircleOutlined from "@mui/icons-material/CheckCircleOutlined";
import ShieldOutlined from "@mui/icons-material/ShieldOutlined";
import { Box, Chip, Stack, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { AppDataGrid, SectionPanel } from "@/frontend/components/ui";
import { OverrideState } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type {
  StaffPermissionGroups,
  StaffPermissionOverrides,
} from "@/frontend/views/dashboard/profile/staff/sections/staffProfileTypes";

type PermissionsSectionProps = {
  readonly permissionGroups: StaffPermissionGroups;
  readonly permissionOverrides: StaffPermissionOverrides;
  readonly isOwnScope?: boolean;
};

type StaffPermissionOverride = NonNullable<StaffPermissionOverrides>[number];

interface PermissionsOverridesGridProps {
  readonly overrides: readonly StaffPermissionOverride[];
}

function PermissionsOverridesGrid({ overrides }: Readonly<PermissionsOverridesGridProps>) {
  const tp = useTranslations("profile.staff.permissions");

  const columns = useMemo<GridColDef<StaffPermissionOverride>[]>(
    () => [
      {
        field: "resource",
        headerName: tp("columns.resource"),
        flex: 1,
        minWidth: 120,
      },
      {
        field: "action",
        headerName: tp("columns.action"),
        flex: 1,
        minWidth: 120,
      },
      {
        field: "state",
        headerName: tp("columns.state"),
        width: 120,
        renderCell: params => {
          const state = params.value as OverrideState | null;
          return state === OverrideState.Granted ? tp("states.granted") : tp("states.denied");
        },
      },
    ],
    [tp]
  );

  return (
    <AppDataGrid<StaffPermissionOverride>
      rows={overrides as StaffPermissionOverride[]}
      columns={columns}
      getRowId={row => row.id ?? ""}
      hideFooter
      autoHeight
    />
  );
}

export function PermissionsSection({
  permissionGroups,
  permissionOverrides,
  isOwnScope = false,
}: PermissionsSectionProps) {
  const t = useTranslations("profile.staff");
  const tp = useTranslations("profile.staff.permissions");
  const groups = permissionGroups ?? [];
  const overrides = permissionOverrides ?? [];
  const hasGroups = groups.length > 0;
  const hasOverrides = overrides.length > 0;

  if (!hasGroups && !hasOverrides) {
    return (
      <SectionPanel title={t("sections.permissions")}>
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
          <Typography sx={{ typography: "titleLg" }}>{tp("empty.title")}</Typography>
          <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary, maxWidth: 420 }}>
            {isOwnScope ? tp("empty.ownDescription") : tp("empty.description")}
          </Typography>
        </Stack>
      </SectionPanel>
    );
  }

  return (
    <SectionPanel title={t("sections.permissions")}>
      <Stack spacing={2}>
        {hasGroups ? (
          <Box>
            <Typography sx={{ typography: "labelMd", mb: 1.5 }}>{tp("inheritedGroups")}</Typography>
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
            <Typography sx={{ typography: "labelMd", mb: 1.5 }}>{tp("directOverrides")}</Typography>
            <PermissionsOverridesGrid overrides={overrides} />
          </Box>
        ) : null}
      </Stack>
    </SectionPanel>
  );
}
