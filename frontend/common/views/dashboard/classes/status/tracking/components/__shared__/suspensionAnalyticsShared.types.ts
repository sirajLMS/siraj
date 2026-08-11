import type { SxProps, Theme } from "@mui/material";

export interface SuspensionAnalyticsTierConfig {
  readonly chartPadding: number;
  readonly chartTitleFontFamily: string;
  readonly chartHeight: number;
  readonly chartGap: number;
  readonly chartPx: number;
  readonly chartTitleMb: number;
  readonly chartDayLabelRowPx: number;
  readonly chartDayLabelRowMt: number;
  readonly chartDayLabelFontFamily: string;
  readonly chartNoteMt: number;
  readonly chartBarHover: boolean;
  readonly ctaPadding: number;
  readonly ctaMinHeight: number;
  readonly ctaGap: number;
  readonly topRightBlobSize: number;
  readonly bottomLeftBlobSize: number;
  readonly urgentBadgeMb: number;
  readonly ctaHeadlineFontFamily: string;
  readonly ctaDescriptionMb: number;
  readonly ctaButtonFontFamily: string;
  readonly ctaButtonPaddingInline: number;
  readonly ctaButtonId: string;
  readonly outerContainerSx: SxProps<Theme>;
}
