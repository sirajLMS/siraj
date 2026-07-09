"use client";

import CheckCircleOutlined from "@mui/icons-material/CheckCircleOutlined";
import ShieldOutlined from "@mui/icons-material/ShieldOutlined";
import { Box, Chip, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { SectionPanel } from "@/frontend/components/ui";
import { OverrideState } from "@/frontend/graphql/generated/gql/graphql-types";
import type { StaffPermissionGroups, StaffPermissionOverrides } from "./staffProfileTypes";

type PermissionsSectionProps = {
  readonly permissionGroups: StaffPermissionGroups;
  readonly permissionOverrides: StaffPermissionOverrides;
  readonly isOwnScope?: boolean;
};

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
            <Box sx={{ overflowX: "auto" }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{tp("columns.resource")}</TableCell>
                    <TableCell>{tp("columns.action")}</TableCell>
                    <TableCell>{tp("columns.state")}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {overrides.map(override => (
                    <TableRow key={override.id}>
                      <TableCell>{override.resource}</TableCell>
                      <TableCell>{override.action}</TableCell>
                      <TableCell>
                        {override.state === OverrideState.Granted ? tp("states.granted") : tp("states.denied")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Box>
        ) : null}
      </Stack>
    </SectionPanel>
  );
}
