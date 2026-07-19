import type { SvgIconComponent } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { motion } from "framer-motion";
import { BaseCard } from "@/frontend/common/components/ui/card/BaseCard";
import {
  filledIconWrapSx,
  interactiveIconActiveSx,
  interactiveIconHoverSx,
  type MetricCardVariant,
  valueColor,
} from "@/frontend/common/components/ui/card/MetricCard/utils";

export interface StyledCardProps {
  readonly isHighlight: boolean;
  readonly isError: boolean;
  readonly isInteractive: boolean;
}

/** Desktop / shared layout: horizontal row chrome. */
export const StyledCard = styled(BaseCard, {
  shouldForwardProp: prop => prop !== "isHighlight" && prop !== "isError" && prop !== "isInteractive",
})<StyledCardProps>(({ theme, isHighlight, isError, isInteractive }) => ({
  padding: theme.spacing(2.5),
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
}

export const StyledLabel = styled(Typography, {
  shouldForwardProp: prop => prop !== "isError",
})<StyledLabelProps>(({ theme, isError }) => ({
  color: isError ? theme.palette.error.main : theme.palette.primary.main,
  marginBottom: theme.spacing(0.5),
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
}));

export interface StyledValueProps {
  readonly metricVariant: MetricCardVariant;
}

export const StyledValue = styled(Typography, {
  shouldForwardProp: prop => prop !== "metricVariant",
})<StyledValueProps>(({ theme, metricVariant }) => ({
  fontWeight: 700,
  color: valueColor({ variant: metricVariant, theme }),
  lineHeight: 1,
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

export const StyledSubLabel = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.dark,
  marginTop: theme.spacing(0.5),
}));

export const StyledDefaultContentRoot = styled(Box)(({ theme }) => ({
  marginLeft: theme.spacing(0.5),
  flex: 1,
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-around",
  height: "100%",
}));
