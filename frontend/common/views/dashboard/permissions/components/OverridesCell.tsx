// NEW FOR PLAN v5 (newly created for the migration wave)
"use client";

import { CheckCircleOutlined, WarningOutlined } from "@mui/icons-material";
import { CircularProgress, Tooltip, Typography } from "@mui/material";
import { StatusBadge } from "@/frontend/common/components/ui";
import type { PermissionGroupDetailFieldsFragment } from "@/frontend/common/graphql/generated/gql/graphql";
import { OverrideCountPillShared } from "@/frontend/common/views/dashboard/permissions/components/__shared__/overrideCountPillShared";
import {
  type UserOverrideInfo,
  useUserOverridesData,
} from "@/frontend/common/views/dashboard/permissions/components/useUserOverridesData";
import type { PermissionsLabels } from "@/shared/locale";

export type OverridesCellType = "grants" | "revokes" | "status";

export type OverridesCellLabels = Pick<PermissionsLabels, "explicitGrant" | "explicitDeny" | "conflict" | "healthy">;

export interface OverridesCellProps {
  readonly userId: string;
  readonly userGroups: readonly PermissionGroupDetailFieldsFragment[];
  readonly type: OverridesCellType;
  readonly labels: OverridesCellLabels;
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
export function OverridesCell({ userId, userGroups, type, labels }: Readonly<OverridesCellProps>) {
  const { loading, info } = useUserOverridesData(userId, userGroups);

  if (loading) {
    return <CircularProgress size={16} thickness={5} color="inherit" sx={{ opacity: 0.5 }} />;
  }

  if (!info) {
    return <Typography variant="bodyMd">-</Typography>;
  }

  if (type === "grants") {
    return renderGrants(info, labels);
  }

  if (type === "revokes") {
    return renderRevokes(info, labels);
  }

  return renderStatus(info, labels);
}

function renderGrants(info: UserOverrideInfo, labels: OverridesCellLabels) {
  if (info.grants > 0) {
    return <OverrideCountPillShared count={info.grants} variant="grant" label={labels.explicitGrant} />;
  }
  return (
    <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
      {info.grants}
    </Typography>
  );
}

function renderRevokes(info: UserOverrideInfo, labels: OverridesCellLabels) {
  if (info.revokes > 0) {
    return <OverrideCountPillShared count={info.revokes} variant="revoke" label={labels.explicitDeny} />;
  }
  return (
    <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
      {info.revokes}
    </Typography>
  );
}

function renderStatus(info: UserOverrideInfo, labels: OverridesCellLabels) {
  if (info.status === "conflict") {
    const tooltipTitle = info.conflictDetails.join("\n");
    return (
      <Tooltip title={tooltipTitle} arrow placement="top">
        <StatusBadge
          category="overrideStatus"
          status="conflict"
          label={labels.conflict}
          icon={<WarningOutlined fontSize="small" />}
        />
      </Tooltip>
    );
  }

  return (
    <StatusBadge
      category="overrideStatus"
      status="healthy"
      label={labels.healthy}
      icon={<CheckCircleOutlined fontSize="small" />}
    />
  );
}
