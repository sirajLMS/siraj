import type { Theme } from "@mui/material/styles";
import type { CSSProperties } from "react";
import { DEFAULT_BUTTON_LAYOUT } from "@/frontend/common/components/ui/input/catalogImageUpload/catalogImageUploadShared.constants";
import type {
  CatalogImageUploadButtonLayout,
  CatalogImageUploadSlotProps,
} from "@/frontend/common/components/ui/input/catalogImageUpload/types/catalogImageUploadShared.types";

export function getButtonContainerSx(layout: CatalogImageUploadButtonLayout): CSSProperties {
  if (layout === "horizontal") {
    return { display: "flex", flexDirection: "row", flexWrap: "wrap", gap: 1, alignItems: "center" };
  }
  if (layout === "fullWidth") {
    return { display: "flex", gap: 1, width: "100%" };
  }
  return { display: "flex", flexDirection: "column", flexWrap: "wrap", gap: 1, alignItems: "stretch" };
}

export function getButtonSx(layout: CatalogImageUploadButtonLayout) {
  return (theme: Theme) => ({
    borderRadius: String(theme.layout.radius.button),
    ...(layout === "fullWidth" ? { flex: 1 } : {}),
    ...(layout === "vertical" ? { justifyContent: "flex-start" } : {}),
  });
}

export function getPreviewContentSx(
  previewShape: "square" | "circle",
  buttonLayout: CatalogImageUploadButtonLayout
): CSSProperties {
  const isColumn = previewShape === "circle" || buttonLayout === "vertical";
  return {
    display: "flex",
    flexDirection: isColumn ? "column" : "row",
    alignItems: isColumn ? "flex-start" : "center",
    gap: isColumn ? 1.5 : 2,
    minWidth: 0,
  };
}

export function getButtonLayout(
  slots: CatalogImageUploadSlotProps | undefined,
  previewShape: "square" | "circle"
): CatalogImageUploadButtonLayout {
  if (slots?.buttonLayout !== undefined) {
    return slots.buttonLayout;
  }
  return previewShape === "circle" ? "horizontal" : DEFAULT_BUTTON_LAYOUT;
}

export function getContainerSx(slots: CatalogImageUploadSlotProps | undefined): CSSProperties {
  if (slots?.ContainerWrapper !== undefined) {
    return { display: "flex", flexDirection: "column", gap: 1.5 };
  }
  return { display: "flex", flexDirection: "column", gap: 1, minWidth: 0 };
}
