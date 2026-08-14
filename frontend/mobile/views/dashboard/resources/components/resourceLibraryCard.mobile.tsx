"use client";

import { AttachFileOutlined, DeleteOutlined } from "@mui/icons-material";
import { Box, IconButton, Typography } from "@mui/material";
import { ResourceFileTypeIconShared as ResourceFileTypeIconMobile } from "@/frontend/common/views/dashboard/resources/components/__shared__/resourceFileTypeIconShared";
import type { ResourceLibraryCardProps } from "@/frontend/common/views/dashboard/resources/types/resourcesTypes";
import { MobileCardListItem } from "@/frontend/mobile/components/ui/card";

export function ResourceLibraryCardMobile({
  resource,
  labels,
  canManage,
  onDeleteRequest,
  onCardClick,
}: Readonly<Omit<ResourceLibraryCardProps, "variant">>) {
  return (
    <MobileCardListItem variant="edge-to-edge" interactive sx={{ position: "relative" }}>
      <Box
        onClick={() => {
          onCardClick(resource.id);
        }}
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "flex-start",
          gap: 2,
          cursor: "pointer",
        }}
      >
        <ResourceFileTypeIconMobile fileType={resource.fileType} />
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
      </Box>

      {canManage ? (
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
      ) : null}
    </MobileCardListItem>
  );
}
