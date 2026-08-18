// NEW FOR PLAN v5 (newly created for the migration wave)
"use client";

import { CheckCircleOutlined, WarningOutlined } from "@mui/icons-material";
import { Box, CircularProgress, Tooltip, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import type { PermissionGroup } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  type UserOverrideInfo,
  useUserOverridesData,
} from "@/frontend/common/views/dashboard/permissions/components/useUserOverridesData";

export type OverridesCellType = "grants" | "revokes" | "status";

export interface OverridesCellProps {
  readonly userId: string;
  readonly userGroups: readonly PermissionGroup[];
  readonly type: OverridesCellType;
}

/**
 * Common (tier-neutral) cell renderer for the User Overrides grid.
 *
 * Lifted (NS-2) so neither `userOverridesDataGrid.{mobile,desktop}.tsx` issues
 * its own `useQuery` — the GraphQL fetch lives in the common
 * `useUserOverridesData` hook. The tier files render this component as a child
 * (specs §6.2 — data fetching belongs in common, the tier invokes zero
 * GraphQL hooks directly).
 *
 * This component is intentionally self-contained and is used by BOTH tiers
 * (mobile card body + desktop data-grid cell renderer).
 */
export function OverridesCell({ userId, userGroups, type }: Readonly<OverridesCellProps>) {
  const { loading, info } = useUserOverridesData(userId, userGroups);

  if (loading) {
    return <CircularProgress size={16} thickness={5} color="inherit" sx={{ opacity: 0.5 }} />;
  }

  if (!info) {
    return <Typography variant="bodyMd">-</Typography>;
  }

  if (type === "grants") {
    return renderGrants(info);
  }

  if (type === "revokes") {
    return renderRevokes(info);
  }

  return renderStatus(info);
}

function renderGrants(info: UserOverrideInfo) {
  if (info.grants > 0) {
    return (
      <Box
        sx={theme => ({
          fontSize: theme.typography.bodyMd.fontSize,
          fontWeight: 700,
          minWidth: 24,
          height: 24,
          borderRadius: 1,
          px: 1,
          backgroundColor: theme.palette.successContainer ?? alpha(theme.palette.success.main, 0.15),
          color: theme.palette.success.main,
          border: `1px solid ${theme.palette.success.light}`,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        })}
      >
        {info.grants}
      </Box>
    );
  }
  return (
    <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
      {info.grants}
    </Typography>
  );
}

function renderRevokes(info: UserOverrideInfo) {
  if (info.revokes > 0) {
    return (
      <Box
        sx={theme => ({
          fontSize: theme.typography.bodyMd.fontSize,
          fontWeight: 700,
          minWidth: 24,
          height: 24,
          borderRadius: 1,
          px: 1,
          backgroundColor: theme.palette.errorContainer ?? alpha(theme.palette.error.main, 0.15),
          color: theme.palette.error.main,
          border: `1px solid ${theme.palette.error.light}`,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        })}
      >
        {info.revokes}
      </Box>
    );
  }
  return (
    <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
      {info.revokes}
    </Typography>
  );
}

function renderStatus(info: UserOverrideInfo) {
  if (info.status === "conflict") {
    const tooltipTitle = info.conflictDetails.join("\n");
    return (
      <Tooltip title={tooltipTitle} arrow placement="top">
        <Box
          sx={theme => ({
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            color: theme.palette.warning.main,
            cursor: "help",
          })}
        >
          <WarningOutlined fontSize="small" />
          <Typography variant="labelMd" sx={{ fontWeight: 600 }}>
            Conflict
          </Typography>
        </Box>
      </Tooltip>
    );
  }

  return (
    <Box sx={theme => ({ display: "flex", alignItems: "center", gap: 0.5, color: theme.palette.success.main })}>
      <CheckCircleOutlined fontSize="small" />
      <Typography variant="labelMd" sx={{ fontWeight: 600 }}>
        Healthy
      </Typography>
    </Box>
  );
}
