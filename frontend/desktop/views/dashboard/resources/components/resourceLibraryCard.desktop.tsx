"use client";

import { AttachFileOutlined, DeleteOutlined } from "@mui/icons-material";
import { Box, IconButton, Paper, Typography } from "@mui/material";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { ResourceLibraryCardProps } from "@/frontend/common/views/dashboard/resources/types/resourcesTypes";
import { ResourceFileTypeIconDesktop } from "@/frontend/desktop/views/dashboard/resources/components/resourceFileTypeIcon.desktop";

export function ResourceLibraryCardDesktop({
  resource,
  onDeleteRequest,
  onCardClick,
}: Readonly<Omit<ResourceLibraryCardProps, "variant" | "labels" | "canManage">>) {
  return (
    <Paper
      elevation={0}
      onClick={() => {
        onCardClick(resource.id);
      }}
      sx={theme => ({
        p: 3,
        borderRadius: theme.layout.radius.card,
        border: `1px solid ${theme.palette.outlineVariant}`,
        backgroundColor: theme.palette.surfaceContainerLowest,
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        gap: 0,
        position: "relative",
        minHeight: 160,
        justifyContent: "space-between",
        transition: "border-color 0.15s ease",
        cursor: "pointer",
        "&:hover": { borderColor: theme.palette.primary.main },
      })}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          width: "100%",
        }}
      >
        <ResourceFileTypeIconDesktop fileType={resource.fileType} />
        <RequirePermission permissions={AppPermission.ResourcesDelete}>
          <IconButton
            aria-label="Delete resource"
            onClick={e => {
              e.stopPropagation();
              onDeleteRequest(resource.id);
            }}
            sx={theme => ({ color: theme.palette.error.main })}
          >
            <DeleteOutlined />
          </IconButton>
        </RequirePermission>
      </Box>

      <Box sx={{ mt: 2 }}>
        <Typography variant="bodyLg" sx={theme => ({ fontWeight: 700, color: theme.palette.primary.main })}>
          {resource.title}
        </Typography>
        <Typography
          variant="labelMd"
          sx={theme => ({
            color: theme.palette.text.secondary,
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            mt: 0.5,
          })}
        >
          <AttachFileOutlined sx={{ fontSize: 14 }} />
          {resource.fileName}
        </Typography>
      </Box>
    </Paper>
  );
}
