"use client";

import type { SvgIconComponent } from "@mui/icons-material";
import type { SxProps, Theme } from "@mui/material";
import { Box, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { motion } from "framer-motion";
import { BaseCard } from "@/frontend/mobile/components/ui/card/BaseCard";

export type MetricCardVariant = "default" | "error" | "highlight" | "danger" | "compact";
export type MetricCardSize = "default" | "compact";

export function formatValue(value: number | string): string {
  if (typeof value === "number") {
    return String(value);
  }
  return value;
}

export function valueColor({ variant, theme }: { variant: MetricCardVariant; theme: Theme }) {
  switch (variant) {
    case "error":
      return theme.palette.error.main;
    case "highlight":
      return theme.palette.primary.light;
    case "danger":
      return theme.palette.error.main;
    case "default":
      return theme.palette.primary.main;
    case "compact":
      return theme.palette.primary.main;
  }
}

export function filledIconWrapSx(theme: Theme, isError: boolean) {
  return {
    backgroundColor: isError ? theme.palette.error.main : theme.palette.primary.main,
    borderColor: isError ? theme.palette.error.main : theme.palette.primary.main,
    "& .MuiSvgIcon-root": { color: isError ? theme.palette.onError : theme.palette.onPrimary },
  };
}

export function interactiveIconHoverSx(theme: Theme, isError: boolean) {
  return {
    ...filledIconWrapSx(theme, isError),
    transform: "scale(1.1)",
  };
}

export function interactiveIconActiveSx(theme: Theme, isError: boolean) {
  return {
    ...filledIconWrapSx(theme, isError),
    transform: "scale(0.95)",
  };
}

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

export interface MobileMetricCardProps {
  readonly icon: SvgIconComponent;
  readonly label: string;
  readonly value: number | string;
  readonly variant?: MetricCardVariant;
  readonly size?: MetricCardSize;
  readonly subLabel?: string;
  readonly animated?: boolean;
  readonly animationIndex?: number;
  readonly onClick?: () => void;
  readonly sx?: SxProps;
}

export function MobileMetricCard({
  icon: Icon,
  label,
  value,
  variant = "default",
  size = "default",
  subLabel,
  animated = true,
  animationIndex = 0,
  onClick,
  sx,
}: MobileMetricCardProps) {
  const isError = variant === "error" || variant === "danger";
  const isHighlight = variant === "highlight";
  const isCompactVariant = variant === "compact";
  const isCompactSize = size === "compact" || isCompactVariant;
  const iconSize = isCompactSize ? 32 : 44;
  const iconFontSize = isCompactSize ? 18 : 22;

  const labelTypography = (
    <StyledLabel variant="labelUppercase" title={label} isCompactSize={isCompactSize} isError={isError}>
      {label}
    </StyledLabel>
  );

  const valueTypography = (
    <StyledValue
      variant={isCompactSize ? "headlineMd" : "headlineLg"}
      metricVariant={variant === "compact" ? "default" : variant}
    >
      {formatValue(value)}
    </StyledValue>
  );

  const iconWrap = (
    <StyledIconWrap className="metric-icon-wrap" iconSize={iconSize} isError={isError} isHighlight={isHighlight}>
      <StyledIcon icon={Icon} fontSizeValue={iconFontSize} isError={isError} />
    </StyledIconWrap>
  );

  const cardContent = isCompactSize ? (
    <StyledCompactContentRoot>
      {labelTypography}
      <StyledCompactMiddleRow>
        <StyledValueContainer>{valueTypography}</StyledValueContainer>
        {iconWrap}
      </StyledCompactMiddleRow>
      {subLabel ? (
        <StyledSubLabel variant="labelMd" isCompactSize={isCompactSize}>
          {subLabel}
        </StyledSubLabel>
      ) : null}
    </StyledCompactContentRoot>
  ) : (
    <>
      <StyledDefaultContentRoot>
        {labelTypography}
        {valueTypography}
        {subLabel ? (
          <StyledSubLabel variant="labelMd" isCompactSize={isCompactSize}>
            {subLabel}
          </StyledSubLabel>
        ) : null}
      </StyledDefaultContentRoot>
      {iconWrap}
    </>
  );

  if (animated) {
    return (
      <MotionStyledCard
        interactive={false}
        onClick={onClick}
        isCompactSize={isCompactSize}
        isHighlight={isHighlight}
        isError={isError}
        isInteractive={Boolean(onClick)}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.4,
          delay: animationIndex * 0.04,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
        sx={sx}
      >
        {cardContent}
      </MotionStyledCard>
    );
  }

  return (
    <StyledCard
      interactive={false}
      onClick={onClick}
      isCompactSize={isCompactSize}
      isHighlight={isHighlight}
      isError={isError}
      isInteractive={Boolean(onClick)}
      sx={sx}
    >
      {cardContent}
    </StyledCard>
  );
}
