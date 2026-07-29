"use client";

import type { SvgIconComponent } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { motion } from "framer-motion";
import { BaseCard } from "@/frontend/common/components/ui";
import {
  filledIconWrapSx,
  interactiveIconActiveSx,
  interactiveIconHoverSx,
  type MetricCardDensity,
  type MetricCardVariant,
  valueColor,
} from "@/frontend/desktop/components/ui/card/MetricCard/utils";

export interface StyledCardProps {
  readonly isHighlight: boolean;
  readonly isError: boolean;
  readonly isInteractive: boolean;
  readonly density?: MetricCardDensity;
}

/** Desktop layout: horizontal row chrome. */
export const StyledCard = styled(BaseCard, {
  shouldForwardProp: prop =>
    prop !== "isHighlight" && prop !== "isError" && prop !== "isInteractive" && prop !== "density",
})<StyledCardProps>(({ theme, isHighlight, isError, isInteractive, density = "default" }) => ({
  padding: theme.spacing(density === "compact" ? 2 : 2.5),
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  gap: theme.spacing(1),
  height: "100%",
  overflow: "hidden",
  cursor: isInteractive ? "pointer" : "default",
  transition: "border-color 0.15s ease, box-shadow 0.15s ease",
  "&:hover": {
    borderColor: theme.palette.primary.main,
    boxShadow: theme.palette.shadow.cardHover,
  },
  ...(isHighlight && {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.action.hover,
  }),
  ...(isError && {
    borderColor: theme.palette.error.light,
  }),
  "&:hover .metric-icon-wrap": interactiveIconHoverSx(theme, isError),
  "&:active .metric-icon-wrap": interactiveIconActiveSx(theme, isError),
  borderRadius: theme.layout.radius.card,
}));

export const MotionStyledCard = motion.create(StyledCard);

export interface StyledLabelProps {
  readonly isError: boolean;
  readonly density?: MetricCardDensity;
}

export const StyledLabel = styled(Typography, {
  shouldForwardProp: prop => prop !== "isError" && prop !== "density",
})<StyledLabelProps>(({ theme, isError, density = "default" }) => ({
  color: isError ? theme.palette.error.main : theme.palette.primary.main,
  marginBottom: theme.spacing(density === "compact" ? 0.25 : 0.5),
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
}));

export interface StyledValueProps {
  readonly metricVariant: MetricCardVariant;
  readonly density?: MetricCardDensity;
  readonly isLongValue?: boolean;
}

export const StyledValue = styled(Typography, {
  shouldForwardProp: prop => prop !== "metricVariant" && prop !== "density" && prop !== "isLongValue",
})<StyledValueProps>(({ theme, metricVariant, density = "default", isLongValue = false }) => ({
  fontWeight: 700,
  color: valueColor({ variant: metricVariant, theme }),
  lineHeight: density === "compact" || isLongValue ? 1.25 : 1,
  ...(isLongValue && {
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    wordBreak: "break-word",
  }),
}));

export interface StyledIconWrapProps {
  readonly iconSize: number;
  readonly isError: boolean;
  readonly isHighlight: boolean;
}

export const StyledIconWrap = styled(Box, {
  shouldForwardProp: prop => prop !== "iconSize" && prop !== "isError" && prop !== "isHighlight",
})<StyledIconWrapProps>(({ theme, iconSize, isError, isHighlight }) => ({
  width: iconSize,
  height: iconSize,
  borderRadius: "50%",
  border: "2px solid",
  borderColor: isError ? theme.palette.error.main : theme.palette.primary.main,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  transition: "background-color 0.2s ease, border-color 0.2s ease, transform 0.2s ease, color 0.2s ease",
  ...(isHighlight && filledIconWrapSx(theme, isError)),
}));

export interface StyledIconProps {
  readonly icon: SvgIconComponent;
  readonly fontSizeValue: number;
  readonly isError: boolean;
}

export const StyledIcon = styled(
  ({ icon: Icon, ...props }: { icon: SvgIconComponent } & Record<string, unknown>) => <Icon {...props} />,
  {
    shouldForwardProp: prop => prop !== "fontSizeValue" && prop !== "isError",
  }
)<Omit<StyledIconProps, "icon">>(({ theme, fontSizeValue, isError }) => ({
  fontSize: fontSizeValue,
  color: isError ? theme.palette.error.main : theme.palette.primary.main,
  transition: "color 0.2s ease",
}));

export const StyledSubLabel = styled(Typography, {
  shouldForwardProp: prop => prop !== "density",
})<{ readonly density?: MetricCardDensity }>(({ theme, density = "default" }) => ({
  color: theme.palette.text.secondary,
  marginTop: theme.spacing(density === "compact" ? 0.25 : 0.5),
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  wordBreak: "break-word",
  lineHeight: 1.3,
}));

export const StyledDefaultContentRoot = styled(Box, {
  shouldForwardProp: prop => prop !== "density",
})<{ readonly density?: MetricCardDensity }>(({ theme, density = "default" }) => ({
  marginLeft: theme.spacing(0.5),
  flex: 1,
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  justifyContent: density === "compact" ? "flex-start" : "space-around",
  ...(density === "compact"
    ? { gap: theme.spacing(0.25) }
    : {
        height: "100%",
      }),
}));
