"use client";

import { AttachFileOutlined, DeleteOutlined } from "@mui/icons-material";
import { Box, IconButton, Paper, Typography } from "@mui/material";
import type { ResourcesLabels } from "@/frontend/messages/types/dashboard/resources/main";
import type { LearningResourceRow } from "@/frontend/stores/resourcesStore";
import { ResourceFileTypeIcon } from "./ResourceFileTypeIcon";

interface ResourceLibraryCardProps {
  readonly resource: LearningResourceRow;
  readonly labels: ResourcesLabels;
  readonly canManage: boolean;
  readonly onDeleteRequest: (id: string) => void;
  readonly variant: "grid" | "list";
}

export function ResourceLibraryCard({
  resource,
  labels,
  canManage,
  onDeleteRequest,
  variant,
}: Readonly<ResourceLibraryCardProps>) {
  const isList = variant === "list";

  return (
    <Paper
      elevation={0}
      sx={theme => ({
        p: isList ? 2 : 3,
        borderRadius: theme.layout.radius.card,
        border: `1px solid ${theme.palette.outlineVariant}`,
        bgcolor: theme.palette.surfaceContainerLowest,
        display: "flex",
        flexDirection: isList ? "row" : "column",
        alignItems: isList ? "flex-start" : "stretch",
        gap: isList ? 2 : 0,
        position: "relative",
        minHeight: isList ? undefined : 160,
        justifyContent: "space-between",
        transition: "border-color 0.15s ease",
        "&:hover": { borderColor: theme.palette.primary.main },
      })}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          width: isList ? "auto" : "100%",
        }}
      >
        <ResourceFileTypeIcon fileType={resource.fileType} />
        {canManage && !isList ? (
          <IconButton
            aria-label="Delete resource"
            onClick={() => {
              onDeleteRequest(resource.id);
            }}
            sx={theme => ({ color: theme.palette.error.main })}
          >
            <DeleteOutlined />
          </IconButton>
        ) : null}
      </Box>

      <Box sx={{ flex: isList ? 1 : undefined, mt: isList ? 0 : 2, pr: isList && canManage ? 4 : 0 }}>
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
        {isList ? (
          <Typography variant="labelMd" sx={theme => ({ color: theme.palette.text.secondary, mt: 0.5 })}>
            {labels.library.uploaded} {resource.uploadedAt}
          </Typography>
        ) : null}
      </Box>

      {canManage && isList ? (
        <IconButton
          aria-label="Delete resource"
          onClick={() => {
            onDeleteRequest(resource.id);
          }}
          sx={theme => ({ color: theme.palette.error.main, position: "absolute", top: 8, right: 8 })}
        >
          <DeleteOutlined />
        </IconButton>
      ) : null}
    </Paper>
  );
}
