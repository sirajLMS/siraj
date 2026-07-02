import type { SvgIconComponent } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { motion } from "framer-motion";
import { BaseCard } from "../BaseCard";
import {
  filledIconWrapSx,
  interactiveIconActiveSx,
  interactiveIconHoverSx,
  type MetricCardVariant,
  valueColor,
} from "./utils";

export interface StyledCardProps {
  readonly isCompactSize: boolean;
  readonly isHighlight: boolean;
  readonly isError: boolean;
  readonly isInteractive: boolean;
}

export const StyledCard = styled(BaseCard, {
  shouldForwardProp: prop =>
    prop !== "isCompactSize" && prop !== "isHighlight" && prop !== "isError" && prop !== "isInteractive",
})<StyledCardProps>(({ theme, isCompactSize, isHighlight, isError, isInteractive }) => ({
  padding: isCompactSize ? theme.spacing(1.5) : theme.spacing(2.5),
  display: "flex",
  flexDirection: isCompactSize ? "column" : "row",
  alignItems: isCompactSize ? "stretch" : "center",
  justifyContent: isCompactSize ? "flex-start" : "space-between",
  gap: theme.spacing(1),
  height: "100%",
  minHeight: isCompactSize ? 92 : undefined,
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
  readonly isCompactSize: boolean;
  readonly isError: boolean;
}

export const StyledLabel = styled(Typography, {
  shouldForwardProp: prop => prop !== "isCompactSize" && prop !== "isError",
})<StyledLabelProps>(({ theme, isCompactSize, isError }) => ({
  color: isError ? theme.palette.error.main : theme.palette.primary.main,
  marginBottom: isCompactSize ? 0 : theme.spacing(0.5),
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

export const StyledCompactContentRoot = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  gap: theme.spacing(1.25),
  height: "100%",
  minWidth: 0,
}));

export const StyledCompactMiddleRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: theme.spacing(1),
  minWidth: 0,
}));

export const StyledValueContainer = styled(Box)({
  minWidth: 0,
});

export interface StyledSubLabelProps {
  readonly isCompactSize: boolean;
}

export const StyledSubLabel = styled(Typography, {
  shouldForwardProp: prop => prop !== "isCompactSize",
})<StyledSubLabelProps>(({ theme, isCompactSize }) => ({
  color: theme.palette.primary.dark,
  ...(!isCompactSize && {
    marginTop: theme.spacing(0.5),
  }),
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
