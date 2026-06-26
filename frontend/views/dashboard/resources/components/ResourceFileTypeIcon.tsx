"use client";

import { ArticleOutlined, PictureAsPdfOutlined, SlideshowOutlined, TableChartOutlined } from "@mui/icons-material";
import { Box } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import type { ResourceFileType } from "../types/resourcesTypes";

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

function getIconStyles(
  theme: Theme,
  fileType: ResourceFileType
): { readonly backgroundColor: string; readonly color: string } {
  switch (fileType) {
    case "pptx":
      return {
        backgroundColor: theme.palette.secondaryContainer,
        color: theme.palette.primary.main,
      };
    case "xlsx":
      return {
        backgroundColor: theme.palette.tertiaryContainer,
        color: theme.palette.onTertiaryContainer,
      };
    case "docx":
      return {
        backgroundColor: theme.palette.surfaceContainerHigh,
        color: theme.palette.secondary.main,
      };
    default:
      return {
        backgroundColor: theme.palette.errorContainer,
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
          backgroundColor: styles.bgcolor,
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
