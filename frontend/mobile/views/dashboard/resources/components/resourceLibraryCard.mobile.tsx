"use client";

import { AttachFileOutlined, DeleteOutlined } from "@mui/icons-material";
import { Box, IconButton, Paper, Typography } from "@mui/material";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { ResourceLibraryCardProps } from "@/frontend/common/views/dashboard/resources/types/resourcesTypes";
import { ResourceFileTypeIconMobile } from "@/frontend/mobile/views/dashboard/resources/components/resourceFileTypeIcon.mobile";

export function ResourceLibraryCardMobile({
  resource,
  labels,
  canManage,
  onDeleteRequest,
  onCardClick,
}: Readonly<Omit<ResourceLibraryCardProps, "variant">>) {
  return (
    <Paper
      elevation={0}
      onClick={() => {
        onCardClick(resource.id);
      }}
      sx={theme => ({
        p: 2,
        borderRadius: theme.layout.radius.card,
        border: `1px solid ${theme.palette.outlineVariant}`,
        backgroundColor: theme.palette.surfaceContainerLowest,
        display: "flex",
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 2,
        position: "relative",
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
          width: "auto",
        }}
      >
        <ResourceFileTypeIconMobile fileType={resource.fileType} />
      </Box>

      <Box sx={{ flex: 1, pr: canManage ? 4 : 0 }}>
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
        <Typography variant="labelMd" sx={theme => ({ color: theme.palette.text.secondary, mt: 0.5 })}>
          {labels.library.uploaded} {resource.uploadedAt}
        </Typography>
      </Box>

      <RequirePermission permissions={AppPermission.ResourcesDelete}>
        <IconButton
          aria-label="Delete resource"
          onClick={e => {
            e.stopPropagation();
            onDeleteRequest(resource.id);
          }}
          sx={theme => ({ color: theme.palette.error.main, position: "absolute", top: 8, right: 8 })}
        >
          <DeleteOutlined />
        </IconButton>
      </RequirePermission>
    </Paper>
  );
}
