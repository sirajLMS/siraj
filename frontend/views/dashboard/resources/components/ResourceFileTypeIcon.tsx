"use client";

import { ArticleOutlined, PictureAsPdfOutlined, SlideshowOutlined, TableChartOutlined } from "@mui/icons-material";
import { Box } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import type { ResourceFileType } from "@/frontend/stores/mockResourcesStore";

interface ResourceFileTypeIconProps {
  readonly fileType: ResourceFileType;
}

function renderIcon(fileType: ResourceFileType) {
  switch (fileType) {
    case "pptx":
      return <SlideshowOutlined fontSize="medium" />;
    case "xlsx":
      return <TableChartOutlined fontSize="medium" />;
    case "docx":
      return <ArticleOutlined fontSize="medium" />;
    default:
      return <PictureAsPdfOutlined fontSize="medium" />;
  }
}

function getIconStyles(theme: Theme, fileType: ResourceFileType): { readonly bgcolor: string; readonly color: string } {
  switch (fileType) {
    case "pptx":
      return {
        bgcolor: theme.palette.secondaryContainer,
        color: theme.palette.primary.main,
      };
    case "xlsx":
      return {
        bgcolor: theme.palette.tertiaryContainer,
        color: theme.palette.onTertiaryContainer,
      };
    case "docx":
      return {
        bgcolor: theme.palette.surfaceContainerHigh,
        color: theme.palette.secondary.main,
      };
    default:
      return {
        bgcolor: theme.palette.errorContainer,
        color: theme.palette.error.main,
      };
  }
}

export function ResourceFileTypeIcon({ fileType }: Readonly<ResourceFileTypeIconProps>) {
  return (
    <Box
      sx={theme => {
        const styles = getIconStyles(theme, fileType);

        return {
          p: 1.5,
          borderRadius: theme.layout.radius.card,
          bgcolor: styles.bgcolor,
          color: styles.color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        };
      }}
    >
      {renderIcon(fileType)}
    </Box>
  );
}
